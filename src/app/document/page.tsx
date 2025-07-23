"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TiptapEditor } from "@/components/TipTapEditor";
import EditorContainer from "@/components/EditorContainer";
import AuthStatus from "@/components/AuthStatus";
import { getDocument } from "@/utils/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function DocumentPage() {
  const [documentContent, setDocumentContent] = useState("");
  const [currentDocumentId, setCurrentDocumentId] = useState<
    string | undefined
  >();
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState<string>("");
  const [initialDocumentContent, setInitialDocumentContent] =
    useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  // Function to be passed to TiptapEditor to update document content
  const updateDocumentContent = (content: string) => {
    setDocumentContent(content);
  };

  // Function to update document title from TipTapEditor
  const updateDocumentTitle = (newTitle: string) => {
    setCurrentDocumentTitle(newTitle);
  };

  const loadDocument = useCallback(
    async (documentId: string) => {
      setIsLoading(true);
      try {
        const document = await getDocument(documentId);
        if (document && document.userId === currentUser?.uid) {
          setCurrentDocumentId(documentId);
          setCurrentDocumentTitle(document.title);
          setInitialDocumentContent(document.content);
          setDocumentContent(document.content);
        } else {
          console.error("Document not found or access denied");
        }
      } catch (error) {
        console.error("Error loading document:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser],
  );

  // Load document if ID is provided in URL
  useEffect(() => {
    const documentId = searchParams.get("id");
    if (documentId && currentUser) {
      loadDocument(documentId);
    }
  }, [searchParams, currentUser, loadDocument]);

  return (
    <div className="min-h-screen relative">
      {/* Logo positioned at very top left of page */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/logo2.png"
            alt="JUVO Docs Logo"
            width={40}
            height={40}
            className="cursor-pointer"
          />
        </Link>
      </div>

      {/* Authentication Status Indicator */}
      <AuthStatus />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <EditorContainer documentContent={documentContent}>
          <TiptapEditor
            onContentChange={updateDocumentContent}
            onTitleChange={updateDocumentTitle}
            currentDocumentId={currentDocumentId}
            currentDocumentTitle={currentDocumentTitle}
            initialContent={initialDocumentContent}
          />
        </EditorContainer>
      )}
    </div>
  );
}
