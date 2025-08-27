import styles from './TipTapEditor.module.css';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import React, { useRef } from 'react';

// Custom hooks
import { useTipTapExtensions } from '@/hooks/useTipTapExtensions';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const extensions = useTipTapExtensions();

  const editor = useEditor({
    extensions,
    content: initialContent || '',
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
      timeoutRef.current = setTimeout(() => {
        try {
          if (editor && !editor.isDestroyed && editor.view?.dom) {
            const editorElement = editor.view.dom;
            // Only manipulate DOM if properly mounted
            if (editorElement && editorElement.isConnected && editorElement.parentElement) {
              editorElement.scrollTop = 0;
              // Focus the editor to make cursor active
              if (editor.commands && typeof editor.commands.focus === 'function') {
                editor.commands.focus();
              }
            }
          }
        } catch (error) {
          console.warn('TipTap focus error (safe to ignore):', error);
        }
      }, 200);
    },
    onUpdate: ({ editor }) => {
      // Update content when editor content changes
      if (onContentChange) {
        const content = editor.getHTML();
        onContentChange(content);
      }
    },
  });

  // Update editor content when initialContent changes
  React.useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      // Only update if content is different to avoid infinite loops
      editor.commands.setContent(initialContent, false);
    }
  }, [editor, initialContent]);

  // Scroll to top and focus when initial content changes (when loading a document)
  React.useEffect(() => {
    if (editor && initialContent) {
      const timeout = setTimeout(() => {
        try {
          if (editor && !editor.isDestroyed && editor.view?.dom) {
            const editorElement = editor.view.dom;
            const editorContainer = editorContainerRef.current;

            // Only manipulate DOM if properly mounted
            if (editorElement && editorElement.isConnected && editorElement.parentElement) {
              editorElement.scrollTop = 0;
            }
            if (editorContainer && editorContainer.isConnected) {
              editorContainer.scrollTop = 0;
            }

            // Focus the editor to make cursor active when document loads
            if (editor.commands && typeof editor.commands.focus === 'function') {
              editor.commands.focus();
            }
          }
        } catch (error) {
          console.warn('TipTap content load focus error (safe to ignore):', error);
        }
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [editor, initialContent]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
