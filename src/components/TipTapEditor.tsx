import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent } from "@tiptap/react";
import React, { useState, useRef, useEffect } from "react";

import FormattingToolbar from "./FormattingToolbar";
import InlineChatbot, { InlineChatbotRef } from "./InlineChatbot";
import SuggestionToolbar from "./SuggestionToolbar";
import { SaveFormat } from "./SaveButton";

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
import { isModifierPressed } from "@/utils/platformDetection";

interface TiptapEditorProps {
  onContentChange?: (content: string) => void;
  currentDocumentId?: string;
  currentDocumentTitle?: string;
  initialContent?: string;
}

export const TiptapEditor = ({
  onContentChange,
  currentDocumentId,
  currentDocumentTitle,
  initialContent,
}: TiptapEditorProps) => {
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);
  const [documentContent, setDocumentContent] = useState("");

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
      // Initialize document content when editor is created
      const htmlContent = editor.getHTML();
      setDocumentContent(htmlContent);
      if (onContentChange) {
        const content = editor.state.doc.textContent;
        onContentChange(content);
      }

      // Scroll to top of editor when created
      setTimeout(() => {
        const editorElement = editor.view.dom;
        if (editorElement) {
          editorElement.scrollTop = 0;
        }
      }, 100);
    },
    onUpdate: ({ editor }) => {
      // Update document content when editor content changes
      const htmlContent = editor.getHTML();
      setDocumentContent(htmlContent);
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
        disabled={!editor}
        onExportSave={handleSave}
        onUpload={handleUpload}
        documentContent={documentContent}
        currentDocumentId={currentDocumentId}
        currentDocumentTitle={currentDocumentTitle}
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
