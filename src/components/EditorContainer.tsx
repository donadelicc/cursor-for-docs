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

  // Calculate current attached file count (same logic as MainChatbot's allUploadedFiles)
  const currentAttachedCount = [
    ...selectedSources,
    ...chatbotUploadedFiles,
  ].filter(
    (file, index, self) =>
      index ===
      self.findIndex((f) => f.name === file.name && f.size === file.size),
  ).length;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (widths: [number, number, number]) => {
    // Optional: Handle resize events if needed
    // Could be used for persistence, analytics, etc.
  };

  const handleSelectedSourcesChange = useCallback((files: File[]) => {
    setSelectedSources(files);
  }, []);

  // Handle removing files from selectedSources
  const handleFileRemove = useCallback((fileToRemove: File) => {
    setSelectedSources((prev) =>
      prev.filter(
        (f) => !(f.name === fileToRemove.name && f.size === fileToRemove.size),
      ),
    );
  }, []);

  // Handle removing files from chatbotUploadedFiles (files uploaded directly to chat)
  const handleChatbotFileRemove = useCallback((fileToRemove: File) => {
    setChatbotUploadedFiles((prev) =>
      prev.filter(
        (f) => !(f.name === fileToRemove.name && f.size === fileToRemove.size),
      ),
    );
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
            onExternalFileRemove={handleChatbotFileRemove}
            currentAttachedCount={currentAttachedCount}
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
            onFileRemove={handleFileRemove}
            onChatbotFileRemove={handleChatbotFileRemove}
          />
        </div>
      </ResizableContainer>
    </div>
  );
};

export default EditorContainer;
