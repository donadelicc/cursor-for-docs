"use client";

import { useState } from "react";
import { TiptapEditor } from "@/components/TipTapEditor";
import EditorContainer from "@/components/EditorContainer";

export default function Home() {
  const [documentContent, setDocumentContent] = useState("");

  // Function to be passed to TiptapEditor to update document content
  const updateDocumentContent = (content: string) => {
    setDocumentContent(content);
  };

  return (
    <EditorContainer documentContent={documentContent}>
      <TiptapEditor onContentChange={updateDocumentContent} />
    </EditorContainer>
  );
}
