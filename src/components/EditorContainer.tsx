import React from "react";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (widths: [number, number, number]) => {
    // Optional: Handle resize events if needed
    // Could be used for persistence, analytics, etc.
  };

  return (
    <div className={styles.editorContainer}>
      <ResizableContainer
        minWidth={15} // 15% minimum width for each panel
        onResize={handleResize}
      >
        {/* Knowledge Base Panel */}
        <div className={styles.sourcesSection}>
          <KnowledgeBase onFileUpload={onFileUpload} />
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
          <MainChatbot documentContent={documentContent} />
        </div>
      </ResizableContainer>
    </div>
  );
};

export default EditorContainer;
