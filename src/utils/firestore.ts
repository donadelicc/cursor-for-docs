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
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import {
  UserProfile,
  Document,
  CreateDocumentData,
  UpdateDocumentData,
} from "@/types/editor";

// Collection names
const USERS_COLLECTION = "users";
const DOCUMENTS_COLLECTION = "documents";

// User operations
export const createUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
      uid: user.uid,
      email: user.email || "",
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

export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
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
  documentData: CreateDocumentData,
): Promise<string> => {
  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
    ...documentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  });

  return docRef.id;
};

export const getDocument = async (
  documentId: string,
): Promise<Document | null> => {
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
    where("userId", "==", userId),
    orderBy("lastModified", "desc"),
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
  const textContent = content.replace(/<[^>]*>/g, "").trim();
  const firstLine = textContent.split("\n")[0];

  if (firstLine.length > 0) {
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + "..."
      : firstLine;
  }

  return `Untitled Document - ${new Date().toLocaleDateString()}`;
};
