"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TiptapEditor } from "@/components/TipTapEditor";
import EditorContainer from "@/components/EditorContainer";

export default function DocumentPage() {
  const [documentContent, setDocumentContent] = useState("");

  // Function to be passed to TiptapEditor to update document content
  const updateDocumentContent = (content: string) => {
    setDocumentContent(content);
  };

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

      <EditorContainer documentContent={documentContent}>
        <TiptapEditor onContentChange={updateDocumentContent} />
      </EditorContainer>
    </div>
  );
}
