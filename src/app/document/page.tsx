"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TiptapEditor } from "@/components/TipTapEditor";
import EditorContainer from "@/components/EditorContainer";
import AuthStatus from "@/components/AuthStatus";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { getDocument } from "@/utils/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";

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

  // Auto-save functionality
  const { autoSaveStatus, saveNow } = useAutoSave({
    content: documentContent,
    title: currentDocumentTitle,
    documentId: currentDocumentId,
    options: {
      delay: 3000, // Auto-save 3 seconds after stopping typing
      enabled: !!currentUser, // Only enable when user is logged in
      onAutoSave: (savedDocumentId) => {
        // Update current document ID if it's a new document
        if (!currentDocumentId && savedDocumentId) {
          setCurrentDocumentId(savedDocumentId);
          // Update URL to include the document ID
          const url = new URL(window.location.href);
          url.searchParams.set("id", savedDocumentId);
          window.history.replaceState({}, "", url.toString());
        }
      },
    },
  });

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

  // Keyboard shortcut for manual save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveNow]);

  return (
    <div className="min-h-screen relative">
      {/* Logo positioned at very top left of page */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/useful_sm.png"
            alt="Useful logo"
            width={100}
            height={100}
            className="cursor-pointer"
          />
        </Link>
      </div>

      {/* Authentication Status Indicator */}
      <AuthStatus />

      {/* Auto-Save Status Indicator */}
      <div className="absolute top-4 right-4 z-40">
        <AutoSaveIndicator autoSaveStatus={autoSaveStatus} />
      </div>

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
