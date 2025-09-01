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
