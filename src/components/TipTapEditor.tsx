import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent } from "@tiptap/react";
import React, { useState, useRef } from "react";
import ShortcutsInfoBox from "./ShortcutsInfoBox";
import FormattingToolbar from "./FormattingToolbar";
import InlineChatbot from "./InlineChatbot";
import SuggestionToolbar from "./SuggestionToolbar";
import { SaveFormat, SaveModal } from "./SaveButton";
import { importDocxFile } from "../utils/docxImporter";
import { downloadAsDocx } from "../utils/docxConverter";
import { downloadAsPdf } from "../utils/pdfConverter";
import { htmlToMarkdown, downloadMarkdown } from "../utils/markdownConverter";

// Custom hooks
import { useTipTapExtensions } from "@/hooks/useTipTapExtensions";
import { usePositionCalculation } from "@/hooks/usePositionCalculation";
import { useChatbotState } from "@/hooks/useChatbotState";
import { useSuggestionState } from "@/hooks/useSuggestionState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEditorUtils } from "@/hooks/useEditorUtils";

export const TiptapEditor = () => {
  const [showSaveModal, setShowSaveModal] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const extensions = useTipTapExtensions();
  const { calculatePosition } = usePositionCalculation(editorContainerRef);
  const {
    chatbotVisible,
    chatbotPosition,
    resetChatbotState,
    showChatbot,
  } = useChatbotState();

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
  });

  const {
    suggestionToolbarVisible,
    suggestionToolbarPosition,
    originalContent,
    suggestionIntent,
    resetSuggestionState,
    handleSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
  } = useSuggestionState(editor, calculatePosition);

  const { syncStateWithDocument, getSelectedText } = useEditorUtils({
    editor,
    chatbotVisible,
    suggestionToolbarVisible,
    originalContent,
    calculatePosition,
    resetSuggestionState,
    resetChatbotState,
    setSuggestionToolbarVisible: (visible) => {
      // This is handled internally by the suggestion state hook
    },
    setSuggestionToolbarPosition: (position) => {
      // This is handled internally by the suggestion state hook
    },
    setOriginalContent: (content) => {
      // This is handled internally by the suggestion state hook
    },
  });

  // Set up editor update handler
  React.useEffect(() => {
    if (editor) {
      editor.on('update', ({ editor }) => {
        syncStateWithDocument();
      });
    }
  }, [editor, syncStateWithDocument]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    editor,
    suggestionToolbarVisible,
    chatbotVisible,
    calculatePosition,
    editorContainerRef,
    showChatbot,
    resetChatbotState,
    handleRejectSuggestion,
  });

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

      <div className={styles.tiptapEditor} ref={editorContainerRef}>
        <ShortcutsInfoBox />
        <EditorContent editor={editor} />

        <InlineChatbot
          ref={chatbotRef}
          isVisible={chatbotVisible}
          position={chatbotPosition}
          selectedText={selectedText}
          onClose={resetChatbotState}
          onSuggest={handleSuggestion}
        />

        {suggestionToolbarVisible && (
          <SuggestionToolbar
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            position={suggestionToolbarPosition}
            intent={suggestionIntent}
          />
        )}
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default TiptapEditor;
