import React from "react";
import styles from "./EditorContainer.module.css";

const EditorContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.editorContainer}>{children}</div>;
};

export default EditorContainer;
