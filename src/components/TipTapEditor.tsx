import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent } from "@tiptap/react";
import React, { useState, useRef, useEffect } from "react";
// import ShortcutsInfoBox from "./ShortcutsInfoBox";
import FormattingToolbar from "./FormattingToolbar";
import InlineChatbot, { InlineChatbotRef } from "./InlineChatbot";
import SuggestionToolbar from "./SuggestionToolbar";
import { SaveFormat, SaveModal } from "./SaveButton";
import { importDocxFile } from "../utils/docxImporter";
import { downloadAsDocx } from "../utils/docxConverter";
import { downloadAsPdf } from "../utils/pdfConverter";
import { htmlToMarkdown, downloadMarkdown } from "../utils/markdownConverter";
import { SuggestionIntent } from "@/types/editor";

// Custom hooks
import { useTipTapExtensions } from "@/hooks/useTipTapExtensions";
import { usePositionCalculation } from "@/hooks/usePositionCalculation";
import { useSuggestionState } from "@/hooks/useSuggestionState";
import { useEditorUtils } from "@/hooks/useEditorUtils";

interface TiptapEditorProps {
  onContentChange?: (content: string) => void;
}

export const TiptapEditor = ({ onContentChange }: TiptapEditorProps) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<InlineChatbotRef>(null);

  // Custom hooks
  const extensions = useTipTapExtensions();
  const { calculatePosition } = usePositionCalculation(editorContainerRef);

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
    onCreate: ({ editor }) => {
      // Initialize document content when editor is created
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

  // Keyboard shortcut for Ctrl+K to focus chatbot input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();

        // Focus the chatbot input
        chatbotRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSave = async (format: SaveFormat, customFilename: string) => {
    if (!editor) return;

    const html = editor.getHTML();

    try {
      if (format === "docx") {
        const filename = `${customFilename}.docx`;
        await downloadAsDocx(html, filename);
      } else if (format === "pdf") {
        const filename = `${customFilename}.pdf`;
        await downloadAsPdf(html, filename);
      } else {
        // Default to markdown
        const markdown = htmlToMarkdown(html);
        const filename = `${customFilename}.md`;
        downloadMarkdown(markdown, filename);
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document: " + (error as Error).message);
    }
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleUpload = async (file: File) => {
    if (!editor) return;

    try {
      const result = await importDocxFile(file);
      editor.commands.setContent(result.html);

      // Update document content after upload
      if (onContentChange) {
        setTimeout(() => {
          const content = editor.state.doc.textContent;
          onContentChange(content);
        }, 100);
      }

      if (result.messages.length > 0) {
        console.log("Import messages:", result.messages);
      }
    } catch (error) {
      console.error("Error importing DOCX:", error);
      throw error;
    }
  };

  // Get selected text for AI processing
  const selectedText = getSelectedText();

  return (
    <div className={styles.editorWrapper}>
      <FormattingToolbar
        editor={editor}
        onSave={handleSaveClick}
        onUpload={handleUpload}
        disabled={!editor}
      />

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
        {/* <ShortcutsInfoBox />*/}

        <EditorContent editor={editor} />
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

// Export a component that includes the document content context
export const TiptapEditorWithChatbot = () => {
  return <TiptapEditor />;
};

export default TiptapEditor;
