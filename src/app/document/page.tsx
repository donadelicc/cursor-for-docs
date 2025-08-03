"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Editor } from "@tiptap/react";
import EditorContainer from "@/components/EditorContainer";
import HeaderDocument from "@/components/HeaderDocument";
import { SaveFormat } from "@/components/SaveButton";

import { getDocument } from "@/utils/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRef } from "react";

// Generate a unique client-side ID for new documents
const generateClientId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default function DocumentPage() {
  const [documentContent, setDocumentContent] = useState("");
  const [currentDocumentId, setCurrentDocumentId] = useState<
    string | undefined
  >();
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState<string>("");
  const [initialDocumentContent, setInitialDocumentContent] =
    useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  // Track the initial URL ID to distinguish existing vs new documents
  const initialUrlId = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  // Function to be passed to TiptapEditor to update document content
  const updateDocumentContent = (content: string) => {
    setDocumentContent(content);
  };

  // Function to update document title from TipTapEditor
  const updateDocumentTitle = (newTitle: string) => {
    setCurrentDocumentTitle(newTitle);
  };

  // Function to handle file uploads from Sources component
  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    // TODO: Implement file processing for PDF/DOCX sources
    // This could include:
    // - Extracting text content from PDFs/DOCX
    // - Storing file references in Firestore
    // - Making content available to the chatbot for RAG
  };

  // Function to handle editor instance ready
  const handleEditorReady = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  // Functions for FormattingToolbar (moved from TipTapEditor)
  const handleSave = async (format: SaveFormat, customFilename: string) => {
    if (!editor) return;

    const html = editor.getHTML();

    try {
      const { downloadAsDocx } = await import("@/utils/docxConverter");
      const { downloadAsPdf } = await import("@/utils/pdfConverter");
      const { htmlToMarkdown, downloadMarkdown } = await import(
        "@/utils/markdownConverter"
      );

      if (format === "docx") {
        const filename = `${customFilename}.docx`;
        await downloadAsDocx(html, filename);
      } else if (format === "pdf") {
        const filename = `${customFilename}.pdf`;
        await downloadAsPdf(html, filename);
      } else {
        // Default to markdown
        const markdown = htmlToMarkdown(html);
        const filename = `${customFilename}.md`;
        downloadMarkdown(markdown, filename);
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document: " + (error as Error).message);
    }
  };

  const handleUpload = async (file: File) => {
    if (!editor) return;

    try {
      const { importDocxFile } = await import("@/utils/docxImporter");
      const result = await importDocxFile(file);
      editor.commands.setContent(result.html);

      // Update document content after upload
      setTimeout(() => {
        const content = editor.state.doc.textContent;
        updateDocumentContent(content);
      }, 100);

      if (result.messages.length > 0) {
        console.log("Import messages:", result.messages);
      }
    } catch (error) {
      console.error("Error importing DOCX:", error);
      throw error;
    }
  };

  // Auto-save functionality with near-instant saving
  const { autoSaveStatus, saveNow } = useAutoSave({
    content: documentContent,
    title: currentDocumentTitle,
    documentId: currentDocumentId,
    initialContent: initialDocumentContent, // Helps distinguish new vs existing documents
    options: {
      delay: 300, // Auto-save 300ms after stopping typing (near-instant)
      enabled: !!currentUser, // Only enable when user is logged in
      onAutoSave: (savedDocumentId) => {
        // ID is now generated immediately when typing starts, so no URL update needed here
        console.log("Document auto-saved with ID:", savedDocumentId);
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

  // Load document if ID is provided in URL, or generate new ID for new documents
  useEffect(() => {
    const documentId = searchParams.get("id");

    // On first run, capture the initial URL ID
    if (!hasInitialized.current) {
      initialUrlId.current = documentId;
      hasInitialized.current = true;
    }

    if (currentUser) {
      if (documentId && documentId === initialUrlId.current) {
        // This ID was in the URL initially - it's an existing document, load it
        loadDocument(documentId);
      } else if (!documentId && !currentDocumentId) {
        // No ID in URL and we haven't generated one - create new document
        const newId = generateClientId();
        setCurrentDocumentId(newId);

        // Update URL immediately to prevent later URL changes
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("id", newId);
          window.history.replaceState({}, "", url.toString());
        } catch (error) {
          console.warn("Could not update URL:", error);
        }
      }
      // If documentId exists but is NOT the initial URL ID, it's our generated ID - don't load it
    }
  }, [searchParams, currentUser, loadDocument, currentDocumentId]);

  // Ensure page starts at top when loaded (this won't work with overflow:hidden)
  // Instead, we'll handle this in the editor component

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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Document Header */}
      <HeaderDocument
        title={currentDocumentTitle}
        onTitleChange={updateDocumentTitle}
        currentDocumentId={currentDocumentId}
        documentContent={documentContent}
        autoSaveStatus={autoSaveStatus}
        disabled={!currentUser}
        editor={editor}
        onExportSave={handleSave}
        onUpload={handleUpload}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <EditorContainer
            documentContent={documentContent}
            onContentChange={updateDocumentContent}
            initialContent={initialDocumentContent}
            onFileUpload={handleFileUpload}
            onEditorReady={handleEditorReady}
          />
        )}
      </div>
    </div>
  );
}
