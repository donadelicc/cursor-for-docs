import React from "react";
import styles from "./EditorContainer.module.css";
import MainChatbot from "./MainChatbot";

interface EditorContainerProps {
  children: React.ReactNode;
}

const EditorContainer = ({ children }: EditorContainerProps) => {
  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorSection}>{children}</div>
      <div className={styles.chatbotSection}>
        <MainChatbot />
      </div>
    </div>
  );
};

export default EditorContainer;
