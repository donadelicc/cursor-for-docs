export interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocumentMeta {
  id: string;
  title: string;
  size: number;
  mimeType: string;
  storagePath: string; // Now stored in Firebase Storage
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
}

export interface ProjectDocumentData {
  title: string;
  content: string;
}

export interface ProjectSource {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

// For recently deleted items that can be restored
export interface DeletedItem {
  id: string;
  name: string;
  type: 'document' | 'source';
  size: number;
  mimeType: string;
  storagePath: string;
  deletedAt: Date;
  originalData: Record<string, unknown>; // Store original metadata for restoration
}
