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
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, storage } from '@/lib/firebase';
import { UserProfile, Document, CreateDocumentData, UpdateDocumentData } from '@/types/editor';
import { Project, ProjectDocumentMeta, ProjectDocumentData, ProjectSource } from '@/types/projects';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { doc as fsDoc, getDoc as fsGetDoc } from 'firebase/firestore';

// Collection names
const USERS_COLLECTION = 'users';
const PROJECTS_COLLECTION = 'projects';
const DOCUMENTS_COLLECTION = 'documents'; // legacy
const SOURCES_SUBCOLLECTION = 'sources';
const PROJECT_DOCUMENTS_SUBCOLLECTION = 'documents';

// User operations
export const createUserProfile = async (user: User): Promise<void> => {
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
  const projectRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
    userId,
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return projectRef.id;
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
  console.log('🗑️ [Delete Project] Starting deletion of project:', projectId);

  try {
    // 1. Delete all project documents
    console.log('🗑️ [Delete Project] Deleting project documents...');
    const docsQuery = query(
      collection(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION),
    );
    const docsSnapshot = await getDocs(docsQuery);

    const docDeletePromises = docsSnapshot.docs.map((docSnap) =>
      deleteDoc(
        doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, docSnap.id),
      ),
    );
    await Promise.all(docDeletePromises);
    console.log(`✅ [Delete Project] Deleted ${docsSnapshot.docs.length} documents`);

    // 2. Delete all project sources (files + metadata)
    console.log('🗑️ [Delete Project] Deleting project sources...');
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
        } catch (error) {
          console.warn('File already deleted or not found:', sourceData.storagePath, error);
        }
      }
      // Delete metadata document
      await deleteDoc(
        doc(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION, sourceSnap.id),
      );
    });
    await Promise.all(sourceDeletePromises);
    console.log(`✅ [Delete Project] Deleted ${sourcesSnapshot.docs.length} sources`);

    // 3. Finally, delete the main project document
    console.log('🗑️ [Delete Project] Deleting main project document...');
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
    console.log('✅ [Delete Project] Project completely deleted');
  } catch (error) {
    console.error('❌ [Delete Project] Error deleting project:', error);
    throw error;
  }
};

// Project Documents
export const createProjectDocument = async (
  projectId: string,
  data: ProjectDocumentData & { id?: string },
): Promise<string> => {
  if (data.id) {
    const docRef = doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      PROJECT_DOCUMENTS_SUBCOLLECTION,
      data.id,
    );
    const payload = { title: data.title, content: data.content };
    await setDoc(docRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
    return data.id;
  } else {
    const docRef = await addDoc(
      collection(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION),
      {
        title: data.title,
        content: data.content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      },
    );
    return docRef.id;
  }
};



export const getProjectDocuments = async (projectId: string): Promise<ProjectDocumentMeta[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION),
    orderBy('lastModified', 'desc'),
  );
  const qs = await getDocs(q);
  return qs.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
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
  console.log('🔍 [Firestore] getProjectDocument called:', {
    projectId,
    documentId,
  });

  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);
  const snap = await getDoc(dref);

  if (!snap.exists()) {
    console.log('❌ [Firestore] Document does not exist');
    return null;
  }

  const data = snap.data();
  const result = {
    title: data.title,
    content: data.content,
  } as ProjectDocumentData;

  console.log('✅ [Firestore] getProjectDocument SUCCESS:', {
    title: result.title,
    hasContent: !!result.content,
    contentLength: result.content?.length,
    contentPreview: result.content?.substring(0, 100) + '...',
  });

  return result;
};

export const updateProjectDocument = async (
  projectId: string,
  documentId: string,
  data: Partial<ProjectDocumentData>,
): Promise<void> => {
  console.log('🔄 [Firestore] updateProjectDocument called:', {
    projectId,
    documentId,
    hasContent: !!data.content,
    contentLength: data.content?.length,
    contentPreview: data.content?.substring(0, 50) + '...',
  });

  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);

  try {
    await updateDoc(dref, {
      ...data,
      updatedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
    console.log('✅ [Firestore] updateProjectDocument SUCCESS');
  } catch (error) {
    console.error('❌ [Firestore] updateProjectDocument FAILED:', error);
    throw error;
  }
};

export const deleteProjectDocument = async (
  projectId: string,
  documentId: string,
): Promise<void> => {
  const dref = doc(db, PROJECTS_COLLECTION, projectId, PROJECT_DOCUMENTS_SUBCOLLECTION, documentId);
  await deleteDoc(dref);
};

// Project Sources (files in Storage + metadata in Firestore)
export const uploadProjectSource = async (
  projectId: string,
  file: File,
): Promise<ProjectSource> => {
  const path = `${projectId}/sources/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
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
  return {
    id: metaRef.id,
    name: file.name,
    size: file.size,
    mimeType: file.type,
    storagePath: path,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const listProjectSources = async (projectId: string): Promise<ProjectSource[]> => {
  const qs = await getDocs(collection(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION));
  return qs.docs.map((d) => {
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

export const deleteProjectSource = async (
  projectId: string,
  sourceId: string,
  storagePath: string,
) => {
  // Delete file from storage, then metadata
  await deleteObject(ref(storage, storagePath)).catch(() => undefined);
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, SOURCES_SUBCOLLECTION, sourceId));
};

export const getProjectSourceDownloadURL = async (storagePath: string): Promise<string> => {
  return await getDownloadURL(ref(storage, storagePath));
};
