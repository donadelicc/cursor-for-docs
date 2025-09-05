import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';
import {
  UserProfile,
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  PilotUser,
  CreatePilotUserData,
} from '@/types/editor';
import {
  Project,
  ProjectDocumentMeta,
  ProjectDocumentData,
  ProjectSource,
  DeletedItem,
} from '@/types/projects';
import { ref, uploadBytes, deleteObject, getDownloadURL, getBytes } from 'firebase/storage';
// Removed unused imports: doc as fsDoc, getDoc as fsGetDoc

// Collection names
const USERS_COLLECTION = 'users';
const PROJECTS_COLLECTION = 'projects';
const DOCUMENTS_COLLECTION = 'documents'; // legacy
const SOURCES_SUBCOLLECTION = 'sources';
const PROJECT_DOCUMENTS_SUBCOLLECTION = 'documents';
const DELETED_ITEMS_SUBCOLLECTION = 'deleted_items';
const PILOT_USERS_COLLECTION = 'pilotUsers';

// User operations
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      await setDoc(userRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't throw the error - we want pilot users to be able to continue even if user profile creation fails
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as UserProfile;
  }

  return null;
};

// Document operations
export const createDocument = async (
  documentData: CreateDocumentData & { id?: string },
): Promise<string> => {
  if (documentData.id) {
    // Create document with specific ID
    const docRef = doc(db, DOCUMENTS_COLLECTION, documentData.id);
    const dataWithoutId = { ...documentData };
    delete dataWithoutId.id;
    await setDoc(docRef, {
      ...dataWithoutId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
    return documentData.id;
  } else {
    // Create document with auto-generated ID
    const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
      ...documentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const getDocument = async (documentId: string): Promise<Document | null> => {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      lastModified: (data.lastModified as Timestamp).toDate(),
    } as Document;
  }

  return null;
};

export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('lastModified', 'desc'),
  );

  const querySnapshot = await getDocs(q);
  const documents: Document[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    documents.push({
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      lastModified: (data.lastModified as Timestamp).toDate(),
    } as Document);
  });

  return documents;
};

export const updateDocument = async (
  documentId: string,
  updateData: UpdateDocumentData,
): Promise<void> => {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  });
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId);
  await deleteDoc(docRef);
};

// Utility function to generate document title from content
export const generateDocumentTitle = (content: string): string => {
  // Remove HTML tags and get first line or first 50 characters
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const firstLine = textContent.split('\n')[0];

  if (firstLine.length > 0) {
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }

  return `Untitled Document - ${new Date().toLocaleDateString()}`;
};

// New: Projects API
export const createProject = async (userId: string, name: string): Promise<string> => {
  console.log('🔧 createProject called with:', { userId, name });

  try {
    const projectRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      userId,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Project created successfully with ID:', projectRef.id);
    return projectRef.id;
  } catch (error) {
    console.error('❌ Error in createProject:', error);
    throw error;
  }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(collection(db, PROJECTS_COLLECTION), where('userId', '==', userId));
  const qs = await getDocs(q);
  return qs.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      name: data.name,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as Project;
  });
};

export const renameProject = async (projectId: string, name: string): Promise<void> => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), { name, updatedAt: serverTimestamp() });
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const pref = doc(db, PROJECTS_COLLECTION, projectId);
  const snap = await getDoc(pref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    name: data.name,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  } as Project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    // 1. Delete all project documents (both Storage files + Firestore metadata)
    const docsQuery = query(
      collection(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION),
    );
    const docsSnapshot = await getDocs(docsQuery);

    const docDeletePromises = docsSnapshot.docs.map(async (docSnap) => {
      const docData = docSnap.data();
      // Delete file from Storage if it exists
      if (docData.storagePath) {
        try {
          await deleteObject(ref(storage, docData.storagePath));
        } catch {
          // File already deleted or not found - ignore
        }
      }
      // Delete metadata document
      await deleteDoc(
        doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, docSnap.id),
      );
    });
    await Promise.all(docDeletePromises);

    // 2. Delete all project sources (files + metadata)
    const sourcesQuery = query(
      collection(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION),
    );
    const sourcesSnapshot = await getDocs(sourcesQuery);

    const sourceDeletePromises = sourcesSnapshot.docs.map(async (sourceSnap) => {
      const sourceData = sourceSnap.data();
      // Delete file from Storage if it exists
      if (sourceData.storagePath) {
        try {
          await deleteObject(ref(storage, sourceData.storagePath));
        } catch {
          // File already deleted or not found - ignore
        }
      }
      // Delete metadata document
      await deleteDoc(
        doc(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION, sourceSnap.id),
      );
    });
    await Promise.all(sourceDeletePromises);

    // 3. Delete all deleted items (cleanup the recycle bin)
    const deletedItemsQuery = query(
      collection(db, PROJECTS_COLLECTION, projectId, DELETED_ITEMS_SUBCOLLECTION),
    );
    const deletedItemsSnapshot = await getDocs(deletedItemsQuery);

    const deletedItemsDeletePromises = deletedItemsSnapshot.docs.map((deletedSnap) =>
      deleteDoc(
        doc(db, PROJECTS_COLLECTION, projectId, DELETED_ITEMS_SUBCOLLECTION, deletedSnap.id),
      ),
    );
    await Promise.all(deletedItemsDeletePromises);

    // 4. Finally, delete the main project document
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
  } catch (error) {
    throw error;
  }
};

// Project Documents
export const createProjectDocument = async (
  projectId: string,
  data: ProjectDocumentData & { id?: string },
): Promise<string> => {
  // Create HTML file and upload to Firebase Storage
  const htmlContent = data.content || '';
  const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  const blob = new Blob([htmlContent], { type: 'text/html' });

  const storagePath = `${projectId}/documents/${Date.now()}_${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob);

  // Create metadata in Firestore
  const docId = data.id || crypto.randomUUID();
  const docRef = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, docId);

  await setDoc(docRef, {
    title: data.title,
    size: blob.size,
    mimeType: 'text/html',
    storagePath: storagePath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  });

  return docId;
};

export const getProjectDocuments = async (projectId: string): Promise<ProjectDocumentMeta[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION),
    orderBy('lastModified', 'desc'),
  );
  const qs = await getDocs(q);

  return qs.docs
    .filter((d) => {
      const data = d.data();
      // Filter out any legacy soft-deleted items that shouldn't be in this collection
      if (data.isDeleted === true) {
        // Clean up legacy soft-deleted items by removing them from main collection
        deleteDoc(d.ref).catch(() => undefined);
        return false;
      }
      return true;
    })
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        size: data.size || 0,
        mimeType: data.mimeType || 'text/html',
        storagePath: data.storagePath,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        lastModified: (data.lastModified as Timestamp).toDate(),
      } as ProjectDocumentMeta;
    });
};

export const getProjectDocument = async (
  projectId: string,
  documentId: string,
): Promise<ProjectDocumentData | null> => {
  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);
  const snap = await getDoc(dref);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();

  // Check if document is deleted
  if (data.isDeleted) {
    return null;
  }

  // Download content from Firebase Storage
  let content = '';
  if (data.storagePath) {
    // Check if this is a newly created document (size <= 7 bytes means empty content)
    const isNewDocument = (data.size || 0) <= 7;

    if (isNewDocument) {
      content = '';
    } else {
      try {
        // Use Firebase Storage SDK directly to avoid CORS issues
        const storageRef = ref(storage, data.storagePath);
        const bytes = await getBytes(storageRef);

        // Convert bytes to string
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(bytes);
      } catch {
        // Gracefully fallback to empty content
        content = '';
      }
    }
  } else {
    // Fallback for old documents that still have content in Firestore
    content = data.content || '';
  }

  return {
    title: data.title,
    content: content,
  } as ProjectDocumentData;
};

export const updateProjectDocument = async (
  projectId: string,
  documentId: string,
  updateData: { title?: string; content?: string },
): Promise<void> => {
  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);
  const docSnap = await getDoc(dref);

  if (!docSnap.exists()) {
    throw new Error('Document not found');
  }

  const data = docSnap.data();
  const updates: { [key: string]: string | number | FieldValue } = {
    updatedAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  };

  // Update title if provided
  if (updateData.title !== undefined) {
    updates.title = updateData.title;
  }

  // Update content if provided - upload to Firebase Storage
  if (updateData.content !== undefined) {
    const htmlContent = updateData.content;
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // Upload new content to existing storage path or create new one
    let storagePath: string = data.storagePath as string;
    if (!storagePath) {
      // For old documents without storage path, create new one
      const filename = `${(updateData.title || data.title || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      storagePath = `${projectId}/documents/${Date.now()}_${filename}`;
      updates.storagePath = storagePath;
      updates.mimeType = 'text/html';
    }

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    updates.size = blob.size;
  }

  await updateDoc(dref, updates);
};

export const deleteProjectDocument = async (
  projectId: string,
  documentId: string,
): Promise<void> => {
  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);
  const docSnap = await getDoc(dref);

  if (!docSnap.exists()) {
    throw new Error('Document not found');
  }

  const data = docSnap.data();

  // Store in deleted items for potential restoration
  await addDoc(collection(db, PROJECTS_COLLECTION, projectId, DELETED_ITEMS_SUBCOLLECTION), {
    originalId: documentId,
    name: data.title,
    type: 'document',
    size: data.size || 0,
    mimeType: data.mimeType || 'text/html',
    storagePath: data.storagePath,
    deletedAt: serverTimestamp(),
    originalData: data,
  });

  // Soft delete - mark as deleted instead of actually deleting
  await updateDoc(dref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  });
};

// Project Sources (files in Storage + metadata in Firestore)
export const uploadProjectSource = async (
  projectId: string,
  file: File,
): Promise<ProjectSource> => {
  try {
    console.log('🔧 [Storage] Starting upload for project:', projectId, 'file:', file.name);

    // Validate inputs
    if (!projectId || !file) {
      throw new Error('Project ID and file are required');
    }

    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload files');
    }

    console.log('🔧 [Storage] User authenticated:', auth.currentUser.uid);

    const path = `${projectId}/sources/${Date.now()}_${file.name}`;
    console.log('🔧 [Storage] Upload path:', path);

    const storageRef = ref(storage, path);

    console.log('🔧 [Storage] Uploading to Firebase Storage...');
    await uploadBytes(storageRef, file);
    console.log('✅ [Storage] File uploaded successfully');

    console.log('🔧 [Storage] Creating metadata document...');
    const metaRef = await addDoc(
      collection(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION),
      {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        storagePath: path,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );
    console.log('✅ [Storage] Metadata document created:', metaRef.id);

    return {
      id: metaRef.id,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      storagePath: path,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('❌ [Storage] Upload failed:', error);
    console.error('❌ [Storage] Project ID:', projectId);
    console.error('❌ [Storage] File:', { name: file?.name, size: file?.size, type: file?.type });
    console.error('❌ [Storage] User:', auth.currentUser?.uid || 'Not authenticated');

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || error.message.includes('unauthorized')) {
        throw new Error(
          `Permission denied: Make sure you own this project and your Firebase Storage rules are configured correctly. Project: ${projectId}`,
        );
      }
      if (error.message.includes('unauthenticated')) {
        throw new Error('Authentication required: Please log in again');
      }
    }

    throw error;
  }
};

export const listProjectSources = async (projectId: string): Promise<ProjectSource[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION),
    orderBy('createdAt', 'desc'),
  );
  const qs = await getDocs(q);

  return qs.docs
    .filter((d) => {
      const data = d.data();
      // Filter out any legacy soft-deleted items that shouldn't be in this collection
      if (data.isDeleted === true) {
        // Clean up legacy soft-deleted items by removing them from main collection
        deleteDoc(d.ref).catch(() => undefined);
        return false;
      }
      return true;
    })
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        size: data.size,
        mimeType: data.mimeType,
        storagePath: data.storagePath,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as ProjectSource;
    });
};

export const deleteProjectSource = async (projectId: string, sourceId: string) => {
  const sourceRef = doc(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION, sourceId);
  const sourceSnap = await getDoc(sourceRef);

  if (!sourceSnap.exists()) {
    throw new Error('Source not found');
  }

  const data = sourceSnap.data();

  // Store in deleted items for potential restoration
  await addDoc(collection(db, PROJECTS_COLLECTION, projectId, DELETED_ITEMS_SUBCOLLECTION), {
    originalId: sourceId,
    name: data.name,
    type: 'source',
    size: data.size,
    mimeType: data.mimeType,
    storagePath: data.storagePath,
    deletedAt: serverTimestamp(),
    originalData: data,
  });

  // Actually remove from the main sources collection
  await deleteDoc(sourceRef);
};

export const getProjectSourceDownloadURL = async (storagePath: string): Promise<string> => {
  return await getDownloadURL(ref(storage, storagePath));
};

// Deleted Items Management
export const getDeletedItems = async (projectId: string): Promise<DeletedItem[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION, projectId, DELETED_ITEMS_SUBCOLLECTION),
    orderBy('deletedAt', 'desc'),
  );
  const qs = await getDocs(q);
  return qs.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      type: data.type,
      size: data.size,
      mimeType: data.mimeType,
      storagePath: data.storagePath,
      deletedAt: (data.deletedAt as Timestamp).toDate(),
      originalData: data.originalData,
    } as DeletedItem;
  });
};

export const restoreDeletedItem = async (
  projectId: string,
  deletedItemId: string,
): Promise<void> => {
  const deletedRef = doc(
    db,
    PROJECTS_COLLECTION,
    projectId,
    DELETED_ITEMS_SUBCOLLECTION,
    deletedItemId,
  );
  const deletedSnap = await getDoc(deletedRef);

  if (!deletedSnap.exists()) {
    throw new Error('Deleted item not found');
  }

  const deletedData = deletedSnap.data();
  const { type, originalData, originalId } = deletedData;

  if (type === 'document') {
    // Recreate document in the main documents collection with original ID
    const docRef = doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      PROJECT_DOCUMENTS_SUBCOLLECTION,
      originalId,
    );
    await setDoc(docRef, {
      ...originalData,
      updatedAt: serverTimestamp(), // Update the timestamp to show it was restored
    });
  } else if (type === 'source') {
    // Recreate source in the main sources collection with original ID
    const sourceRef = doc(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION, originalId);
    await setDoc(sourceRef, {
      ...originalData,
      updatedAt: serverTimestamp(), // Update the timestamp to show it was restored
    });
  }

  // Remove from deleted items
  await deleteDoc(deletedRef);
};

export const permanentlyDeleteItem = async (
  projectId: string,
  deletedItemId: string,
): Promise<void> => {
  const deletedRef = doc(
    db,
    PROJECTS_COLLECTION,
    projectId,
    DELETED_ITEMS_SUBCOLLECTION,
    deletedItemId,
  );
  const deletedSnap = await getDoc(deletedRef);

  if (!deletedSnap.exists()) {
    throw new Error('Deleted item not found');
  }

  const deletedData = deletedSnap.data();

  // Delete the actual file from Firebase Storage
  if (deletedData.storagePath) {
    await deleteObject(ref(storage, deletedData.storagePath)).catch(() => undefined);
  }

  // Remove the original document/source metadata if it still exists
  try {
    if (deletedData.type === 'document') {
      const docRef = doc(
        db,
        PROJECTS_COLLECTION,
        projectId,
        PROJECT_DOCUMENTS_SUBCOLLECTION,
        deletedData.originalId,
      );
      await deleteDoc(docRef);
    } else if (deletedData.type === 'source') {
      const sourceRef = doc(
        db,
        PROJECTS_COLLECTION,
        projectId,
        SOURCES_SUBCOLLECTION,
        deletedData.originalId,
      );
      await deleteDoc(sourceRef);
    }
  } catch {
    // Item might already be deleted, which is fine
  }

  // Remove from deleted items
  await deleteDoc(deletedRef);
};

// Pilot Users Management
export const checkPilotAccess = async (email: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, PILOT_USERS_COLLECTION),
      where('email', '==', email.toLowerCase()),
      where('isActive', '==', true),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking pilot access:', error);
    return false;
  }
};

export const getPilotUser = async (email: string): Promise<PilotUser | null> => {
  try {
    const q = query(
      collection(db, PILOT_USERS_COLLECTION),
      where('email', '==', email.toLowerCase()),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      displayName: data.displayName,
      addedAt: (data.addedAt as Timestamp).toDate(),
      addedBy: data.addedBy,
      isActive: data.isActive,
      notes: data.notes,
    } as PilotUser;
  } catch (error) {
    console.error('Error getting pilot user:', error);
    return null;
  }
};

export const getAllPilotUsers = async (): Promise<PilotUser[]> => {
  try {
    const q = query(collection(db, PILOT_USERS_COLLECTION), orderBy('addedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        addedAt: (data.addedAt as Timestamp).toDate(),
        addedBy: data.addedBy,
        isActive: data.isActive,
        notes: data.notes,
      } as PilotUser;
    });
  } catch (error) {
    console.error('Error getting all pilot users:', error);
    return [];
  }
};

export const addPilotUser = async (pilotUserData: CreatePilotUserData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, PILOT_USERS_COLLECTION), {
      email: pilotUserData.email.toLowerCase(),
      displayName: pilotUserData.displayName,
      addedBy: pilotUserData.addedBy,
      notes: pilotUserData.notes,
      isActive: true,
      addedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding pilot user:', error);
    throw error;
  }
};

export const updatePilotUser = async (
  pilotUserId: string,
  updates: Partial<Pick<PilotUser, 'isActive' | 'notes' | 'displayName'>>,
): Promise<void> => {
  try {
    const pilotUserRef = doc(db, PILOT_USERS_COLLECTION, pilotUserId);
    await updateDoc(pilotUserRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating pilot user:', error);
    throw error;
  }
};

export const removePilotUser = async (pilotUserId: string): Promise<void> => {
  try {
    const pilotUserRef = doc(db, PILOT_USERS_COLLECTION, pilotUserId);
    await deleteDoc(pilotUserRef);
  } catch (error) {
    console.error('Error removing pilot user:', error);
    throw error;
  }
};
