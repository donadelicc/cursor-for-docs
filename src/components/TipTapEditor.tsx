import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import React, { useState, useRef, useEffect } from "react";

import InlineChatbot, { InlineChatbotRef } from "./InlineChatbot";
import SuggestionToolbar from "./SuggestionToolbar";

import { SuggestionIntent } from "@/types/editor";

// Custom hooks
import { useTipTapExtensions } from "@/hooks/useTipTapExtensions";
import { usePositionCalculation } from "@/hooks/usePositionCalculation";
import { useSuggestionState } from "@/hooks/useSuggestionState";
import { useEditorUtils } from "@/hooks/useEditorUtils";
import { isModifierPressed } from "@/utils/platformDetection";

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
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<InlineChatbotRef>(null);

  // Custom hooks
  const extensions = useTipTapExtensions();
  const { calculatePosition } = usePositionCalculation(editorContainerRef);

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
        const content = editor.state.doc.textContent;
        onContentChange(content);
      }

      // Notify parent component that editor is ready
      onEditorReady?.(editor);

      // Scroll to top of editor when created
      setTimeout(() => {
        const editorElement = editor.view.dom;
        if (editorElement) {
          editorElement.scrollTop = 0;
        }
      }, 100);
    },
    onUpdate: ({ editor }) => {
      // Update content when editor content changes
      if (onContentChange) {
        const content = editor.state.doc.textContent;
        onContentChange(content);
      }
    },
  });

  const {
    suggestionToolbarVisible,
    originalContent,
    suggestionIntent,
    isSuggestionActive,
    resetSuggestionState,
    handleSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
  } = useSuggestionState(editor);

  const handleSuggestionWithToolbar = (
    suggestion: string,
    intent: SuggestionIntent,
  ) => {
    handleSuggestion(suggestion, intent);
    setHasPendingSuggestion(true);
  };

  const handleAcceptWithToolbar = () => {
    handleAcceptSuggestion();
    setHasPendingSuggestion(false);
  };

  const handleRejectWithToolbar = () => {
    handleRejectSuggestion();
    setHasPendingSuggestion(false);
  };

  const { syncStateWithDocument, getSelectedText } = useEditorUtils({
    editor,
    suggestionToolbarVisible,
    originalContent,
    calculatePosition,
    resetSuggestionState,
    setSuggestionToolbarVisible: () => {
      // This is handled internally by the suggestion state hook
    },
    setSuggestionToolbarPosition: () => {
      // This is handled internally by the suggestion state hook
    },
    setOriginalContent: () => {
      // This is handled internally by the suggestion state hook
    },
  });

  // Set up editor update handler
  React.useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        syncStateWithDocument();

        // Update document content for main chatbot
        if (onContentChange) {
          const content = editor.state.doc.textContent;
          onContentChange(content);
        }
      });
    }
  }, [editor, syncStateWithDocument, onContentChange]);

  // Scroll to top when initial content changes (when loading a document)
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
      }, 150);
    }
  }, [editor, initialContent]);

  // Keyboard shortcut for Ctrl+K (Windows) / Cmd+K (Mac) to focus chatbot input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModifierPressed(e) && e.key === "k") {
        e.preventDefault();

        // Focus the chatbot input
        chatbotRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Get selected text for AI processing
  const selectedText = getSelectedText();

  return (
    <div className={styles.editorWrapper}>
      {/* Always visible AI assistant row */}
      <div className={styles.aiAssistantRow}>
        <div className={styles.inlineChatbotContainer}>
          <InlineChatbot
            ref={chatbotRef}
            selectedText={selectedText}
            onSuggest={handleSuggestionWithToolbar}
          />
        </div>

        <div className={styles.suggestionToolbarContainer}>
          <SuggestionToolbar
            onAccept={handleAcceptWithToolbar}
            onReject={handleRejectWithToolbar}
            intent={suggestionIntent}
            hasActiveSuggestion={isSuggestionActive || hasPendingSuggestion}
          />
        </div>
      </div>

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
