// Type for storing original content before a suggestion is applied
export type OriginalContent = {
  text: string;
  from: number;
  to: number;
};

// Type for suggestion intent
export type SuggestionIntent = "replace" | "add_after" | "add_before";

// Type for position coordinates
export type Position = {
  x: number;
  y: number;
} | null;

// Database types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id?: string; // Firestore document ID
  userId: string;
  title: string;
  content: string; // HTML content from TipTap editor
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
}

export interface CreateDocumentData {
  userId: string;
  title: string;
  content: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  lastModified: Date;
}
