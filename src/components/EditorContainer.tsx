import React, { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import styles from "./EditorContainer.module.css";
import ResizableContainer from "./ResizableContainer";
import KnowledgeBase from "./KnowledgeBase";
import MainChatbot from "./MainChatbot";
import { TiptapEditor } from "./TipTapEditor";

interface EditorContainerProps {
  documentContent: string;
  onContentChange?: (content: string) => void;
  initialContent?: string;
  onFileUpload?: (files: File[]) => void;
  onEditorReady?: (editor: Editor) => void;
}

const EditorContainer = ({
  documentContent,
  onContentChange,
  initialContent,
  onFileUpload,
  onEditorReady,
}: EditorContainerProps) => {
  const [selectedSources, setSelectedSources] = useState<File[]>([]);
  const [chatbotUploadedFiles, setChatbotUploadedFiles] = useState<File[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (widths: [number, number, number]) => {
    // Optional: Handle resize events if needed
    // Could be used for persistence, analytics, etc.
  };

  const handleSelectedSourcesChange = useCallback((files: File[]) => {
    setSelectedSources(files);
  }, []);

  // Handle files uploaded from chatbot - add them to KnowledgeBase
  const handleChatbotFileUpload = useCallback(
    (files: File[]) => {
      setChatbotUploadedFiles((prev) => {
        // Avoid duplicates by filtering out files that already exist
        const newFiles = files.filter(
          (newFile) =>
            !prev.some(
              (existingFile) =>
                existingFile.name === newFile.name &&
                existingFile.size === newFile.size,
            ),
        );
        return [...prev, ...newFiles];
      });

      // Also call the original callback if needed
      onFileUpload?.(files);
    },
    [onFileUpload],
  );

  return (
    <div className={styles.editorContainer}>
      <ResizableContainer
        minWidth={15} // 15% minimum width for each panel
        onResize={handleResize}
      >
        {/* Knowledge Base Panel */}
        <div className={styles.sourcesSection}>
          <KnowledgeBase
            onFileUpload={onFileUpload}
            onSelectedSourcesChange={handleSelectedSourcesChange}
            externalFiles={chatbotUploadedFiles}
          />
        </div>

        {/* Editor Panel */}
        <div className={styles.editorSection}>
          <TiptapEditor
            onContentChange={onContentChange}
            initialContent={initialContent}
            onEditorReady={onEditorReady}
          />
        </div>

        {/* Chatbot Panel */}
        <div className={styles.chatbotSection}>
          <MainChatbot
            documentContent={documentContent}
            selectedSources={selectedSources}
            onFileUpload={handleChatbotFileUpload}
          />
        </div>
      </ResizableContainer>
    </div>
  );
};

export default EditorContainer;
