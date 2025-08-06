import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import React, { useRef } from "react";

// Custom hooks
import { useTipTapExtensions } from "@/hooks/useTipTapExtensions";

interface TiptapEditorProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  onEditorReady?: (editor: Editor) => void;
}

export const TiptapEditor = ({
  onContentChange,
  initialContent,
  onEditorReady,
}: TiptapEditorProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const extensions = useTipTapExtensions();

  const editor = useEditor({
    extensions,
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
    onCreate: ({ editor }) => {
      // Initialize content change handler
      if (onContentChange) {
        const content = editor.getHTML();
        onContentChange(content);
      }

      // Notify parent component that editor is ready
      onEditorReady?.(editor);

      // Auto-focus the editor and scroll to top when created
      setTimeout(() => {
        const editorElement = editor.view.dom;
        if (editorElement) {
          editorElement.scrollTop = 0;
          // Focus the editor to make cursor active
          editor.commands.focus();
        }
      }, 100);
    },
    onUpdate: ({ editor }) => {
      // Update content when editor content changes
      if (onContentChange) {
        const content = editor.getHTML();
        onContentChange(content);
      }
    },
  });

  // Scroll to top and focus when initial content changes (when loading a document)
  React.useEffect(() => {
    if (editor && initialContent) {
      setTimeout(() => {
        const editorElement = editor.view.dom;
        const editorContainer = editorContainerRef.current;

        if (editorElement) {
          editorElement.scrollTop = 0;
        }
        if (editorContainer) {
          editorContainer.scrollTop = 0;
        }

        // Focus the editor to make cursor active when document loads
        editor.commands.focus();
      }, 150);
    }
  }, [editor, initialContent]);

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.tiptapEditor} ref={editorContainerRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// Export a component that includes the document content context
export const TiptapEditorWithChatbot = () => {
  return <TiptapEditor />;
};

export default TiptapEditor;
