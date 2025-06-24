import styles from "./TipTapEditor.module.css";

import { useEditor, EditorContent } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ShortcutsInfoBox from "./ShortcutsInfoBox";
import FormattingToolbar from "./FormattingToolbar";
import InlineChatbot from "./InlineChatbot";
import SuggestionToolbar from "./SuggestionToolbar";
import { SuggestionMark, OriginalTextMark } from "@/utils/suggestion-mark";
import {
  htmlToMarkdown,
  downloadMarkdown,
  markdownToHtml,
} from "../utils/markdownConverter";
import { downloadAsDocx } from "../utils/docxConverter";
import { downloadAsPdf } from "../utils/pdfConverter";
import { SaveFormat, SaveModal } from "./SaveButton";
import { importDocxFile } from "../utils/docxImporter";

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Highlight,
  Typography,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Underline,
  TextStyle,
  FontFamily.configure({
    types: ["textStyle"],
  }),
  Color,
  SuggestionMark,
  OriginalTextMark,
];

// Type for storing original content before a suggestion is applied
type OriginalContent = {
  text: string;
  from: number;
  to: number;
};

// Type for suggestion intent
type SuggestionIntent = "replace" | "add_after" | "add_before";

export const TiptapEditor = () => {
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [suggestionToolbarVisible, setSuggestionToolbarVisible] =
    useState(false);
  const [suggestionToolbarPosition, setSuggestionToolbarPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [originalContent, setOriginalContent] =
    useState<OriginalContent | null>(null);
  const [suggestionIntent, setSuggestionIntent] =
    useState<SuggestionIntent>("replace");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Helper function to reset suggestion state
  const resetSuggestionState = useCallback(() => {
    setSuggestionToolbarVisible(false);
    setSuggestionToolbarPosition(null);
    setOriginalContent(null);
    setSuggestionIntent("replace");
  }, []);

  // Helper function to reset chatbot state
  const resetChatbotState = useCallback(() => {
    setChatbotVisible(false);
    setChatbotPosition(null);
  }, []);

  // Helper function to calculate position relative to editor
  const calculatePosition = useCallback(
    (rect: DOMRect): { x: number; y: number } | null => {
      const editorRect = editorContainerRef.current?.getBoundingClientRect();
      if (!editorRect) return null;

      return {
        x: rect.left - editorRect.left + rect.width / 2,
        y: rect.bottom - editorRect.top + 10,
      };
    },
    [],
  );

  // Function to sync component state with document state
  const syncStateWithDocument = useCallback(
    (editor: ReturnType<typeof useEditor>) => {
      if (!editor) return;

      // Don't sync if chatbot is visible and user might be typing
      if (chatbotVisible) return;

      const { originalRange, suggestionRange } = findSuggestionRanges(editor);
      const hasOriginalMark = originalRange.from !== -1;
      const hasSuggestionMark = suggestionRange.from !== -1;

      if (hasOriginalMark && hasSuggestionMark) {
        // Both marks exist - we're in suggestion state
        if (!suggestionToolbarVisible) {
          setSuggestionToolbarVisible(true);

          // Calculate toolbar position
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const position = calculatePosition(rect);

              if (position) {
                setSuggestionToolbarPosition(position);
              }
            }
          }, 50);

          // Restore original content info if we don't have it
          if (!originalContent) {
            const originalText = editor.state.doc.textBetween(
              originalRange.from,
              originalRange.to,
            );
            setOriginalContent({
              text: originalText,
              from: originalRange.from,
              to: originalRange.to,
            });
          }
        }
      } else if (hasOriginalMark && !hasSuggestionMark) {
        // Only original mark exists - this is an intermediate state, remove the mark
        editor
          .chain()
          .focus()
          .setTextSelection({ from: originalRange.from, to: originalRange.to })
          .unsetMark(OriginalTextMark.name)
          .run();

        // Reset component state
        resetSuggestionState();
      } else {
        // No marks or incomplete marks - reset state
        if (suggestionToolbarVisible) {
          resetSuggestionState();
        }

        // Close chatbot if it's open and we're back to clean state
        if (chatbotVisible) {
          resetChatbotState();
        }
      }
    },
    [
      suggestionToolbarVisible,
      originalContent,
      chatbotVisible,
      resetSuggestionState,
      resetChatbotState,
      calculatePosition,
    ],
  );

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
    onUpdate: ({ editor }) => {
      // Sync component state with document state after any change (including undo/redo)
      syncStateWithDocument(editor);
    },
  });

  // Open chatbot on keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();

        if (!editor || suggestionToolbarVisible) return;

        const { empty } = editor.state.selection;

        if (!empty) {
          // Has selection - position chatbot near selection
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const position = calculatePosition(rect);

            if (position) {
              setChatbotPosition(position);
              setChatbotVisible(true);
            }
          }
        } else {
          // No selection - position chatbot in center of editor
          const editorRect =
            editorContainerRef.current?.getBoundingClientRect();
          if (editorRect) {
            const position = {
              x: editorRect.width / 2,
              y: editorRect.height / 3, // Position in upper third of editor
            };
            setChatbotPosition(position);
            setChatbotVisible(true);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    editor,
    suggestionToolbarVisible,
    calculatePosition,
    chatbotVisible,
    resetChatbotState,
    resetSuggestionState,
  ]);

  const handleRejectSuggestion = useCallback(() => {
    if (!editor || !originalContent) return;

    // Find the original text range
    const { originalRange } = findSuggestionRanges(editor);

    if (originalRange.from === -1) {
      resetSuggestionState();
      return;
    }

    // Simple approach: replace everything from original start to end of document with just the original text
    const docEndPos = editor.state.doc.content.size - 1;

    // Delete everything from the original position to the end
    editor
      .chain()
      .focus()
      .deleteRange({ from: originalRange.from, to: docEndPos })
      .insertContent(originalContent.text)
      .run();

    resetSuggestionState();
  }, [editor, originalContent, resetSuggestionState]);

  // Handle closing popups
  useEffect(() => {
    if (!chatbotVisible && !suggestionToolbarVisible) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (suggestionToolbarVisible) {
          handleRejectSuggestion();
        } else {
          resetChatbotState();
        }
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [
    chatbotVisible,
    suggestionToolbarVisible,
    handleRejectSuggestion,
    resetChatbotState,
  ]);

  const handleSuggestion = (suggestion: string, intent: SuggestionIntent) => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;

    let actualFrom: number;
    let actualTo: number;
    let originalText: string;

    if (empty) {
      // No selection - use entire document
      actualFrom = 0;
      actualTo = editor.state.doc.content.size - 1;
      originalText = editor.state.doc.textContent;
    } else {
      // Has selection - use selected range
      actualFrom = from;
      actualTo = to;
      originalText = editor.state.doc.textBetween(from, to);
    }

    // Save the original content and intent
    setOriginalContent({ text: originalText, from: actualFrom, to: actualTo });
    setSuggestionIntent(intent);

    // Mark the original text as "to be replaced" (gray styling)
    editor
      .chain()
      .focus()
      .setTextSelection({ from: actualFrom, to: actualTo })
      .setMark(OriginalTextMark.name)
      .run();

    // Debug logging
    console.log("🔧 Markdown Conversion Debug:", {
      originalSuggestion: suggestion,
      trimmedSuggestion: suggestion.trim(),
      intent: intent,
    });

    // Parse markdown and apply formatting directly using TipTap commands
    applyMarkdownFormatting(
      editor,
      suggestion.trim(),
      actualFrom,
      actualTo,
      intent,
    );

    // Find and mark the suggestion text by searching for it in the document
    setTimeout(() => {
      const { suggestionRange } = findSuggestionRanges(editor);
      if (suggestionRange.from !== -1) {
        editor
          .chain()
          .focus()
          .setTextSelection({
            from: suggestionRange.from,
            to: suggestionRange.to,
          })
          .setMark(SuggestionMark.name)
          .run();
      } else {
        // Fallback: mark the text that was just inserted
        const currentDocSize = editor.state.doc.content.size;
        const suggestionText = suggestion.trim();
        const estimatedStart = currentDocSize - suggestionText.length - 1;
        if (estimatedStart >= 0) {
          editor
            .chain()
            .focus()
            .setTextSelection({
              from: estimatedStart,
              to: estimatedStart + suggestionText.length,
            })
            .setMark(SuggestionMark.name)
            .run();
        }
      }
    }, 10);

    // Calculate position for suggestion toolbar
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const position = calculatePosition(rect);

        if (position) {
          setSuggestionToolbarPosition(position);
        }
      }
    }, 50);

    setSuggestionToolbarVisible(true);
  };

  const handleAcceptSuggestion = () => {
    if (!editor || !originalContent) return;

    // Find both the original text and suggestion ranges
    const { originalRange, suggestionRange } = findSuggestionRanges(editor);

    if (originalRange.from === -1 || suggestionRange.from === -1) {
      resetSuggestionState();
      return;
    }

    // Get the suggestion text (clean, without any markup)
    const suggestionText = editor.state.doc.textBetween(
      suggestionRange.from,
      suggestionRange.to,
    );

    // Handle different intents
    if (suggestionIntent === "replace") {
      // Replace: Remove original text and keep only the suggestion
      const docEndPos = editor.state.doc.content.size - 1;
      editor
        .chain()
        .focus()
        .deleteRange({ from: originalRange.from, to: docEndPos })
        .insertContent(suggestionText)
        .run();
    } else if (suggestionIntent === "add_after") {
      // Add after: Keep original text, remove marks, and keep suggestion after it
      editor
        .chain()
        .focus()
        .setTextSelection({ from: originalRange.from, to: originalRange.to })
        .unsetMark(OriginalTextMark.name)
        .setTextSelection({
          from: suggestionRange.from,
          to: suggestionRange.to,
        })
        .unsetMark(SuggestionMark.name)
        .run();
    } else if (suggestionIntent === "add_before") {
      // Add before: Keep original text, remove marks, suggestion should already be positioned correctly
      editor
        .chain()
        .focus()
        .setTextSelection({ from: originalRange.from, to: originalRange.to })
        .unsetMark(OriginalTextMark.name)
        .setTextSelection({
          from: suggestionRange.from,
          to: suggestionRange.to,
        })
        .unsetMark(SuggestionMark.name)
        .run();
    }

    resetSuggestionState();
  };

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
      // You could add a toast notification here to inform the user
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

      // Set the imported HTML content in the editor
      editor.commands.setContent(result.html);

      // Log any conversion messages/warnings
      if (result.messages.length > 0) {
        console.log("Import messages:", result.messages);
      }
    } catch (error) {
      console.error("Error importing DOCX:", error);
      throw error; // Re-throw so the Upload component can handle the error display
    }
  };

  // Get selected text as markdown for AI processing
  const selectedText = editor
    ? (() => {
        const { from, to, empty } = editor.state.selection;

        if (empty) {
          // No selection - use entire document content
          try {
            const html = editor.getHTML();
            return htmlToMarkdown(html) || editor.state.doc.textContent;
          } catch {
            console.warn("Failed to extract document HTML, using plain text");
            return editor.state.doc.textContent;
          }
        }

        // Has selection - use selected content
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const contents = range.cloneContents();
            const div = document.createElement("div");
            div.appendChild(contents);
            return (
              htmlToMarkdown(div.innerHTML) ||
              editor.state.doc.textBetween(from, to)
            );
          }
        } catch {
          console.warn(
            "Failed to extract HTML selection, falling back to plain text",
          );
        }

        // Fallback to plain text
        return editor.state.doc.textBetween(from, to);
      })()
    : "";

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

// Function to apply markdown formatting using Showdown
const applyMarkdownFormatting = (
  editor: ReturnType<typeof useEditor>,
  markdown: string,
  originalFrom: number,
  originalTo: number,
  intent: SuggestionIntent,
) => {
  if (!editor) return;

  console.log("🔧 Applying markdown formatting:", {
    markdown,
    originalFrom,
    originalTo,
    intent,
  });

  // Check if the text actually contains markdown syntax
  const hasMarkdownSyntax =
    markdown.includes("**") ||
    markdown.includes("*") ||
    markdown.includes("#") ||
    markdown.includes("`") ||
    markdown.includes("[") ||
    markdown.includes("]") ||
    markdown.includes("_") ||
    markdown.includes("~");

  // Check if text has paragraph breaks (double newlines or multiple lines)
  const hasMultipleParagraphs =
    markdown.includes("\n\n") ||
    markdown.split("\n").filter((line) => line.trim().length > 0).length > 1;

  let content: string;

  if (hasMarkdownSyntax || hasMultipleParagraphs) {
    // Use Showdown for markdown content or text with paragraph breaks
    content = markdownToHtml(markdown);
    console.log("🔧 Converted markdown to HTML with Showdown:", content);
  } else {
    // For plain text without paragraph breaks, just use it directly
    content = markdown;
    console.log("🔧 Using plain text directly:", content);
  }

  // Apply the content based on intent
  if (intent === "replace") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: originalFrom, to: originalTo })
      .insertContent(content)
      .run();
  } else {
    const insertPos = intent === "add_before" ? originalFrom : originalTo;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: insertPos, to: insertPos })
      .insertContent(content)
      .run();
  }
};

const findSuggestionRanges = (editor: ReturnType<typeof useEditor>) => {
  const originalRange = { from: -1, to: -1 };
  const suggestionRange = { from: -1, to: -1 };

  editor?.state.doc.descendants((node, pos: number) => {
    const hasOriginalMark = node.marks.some(
      (mark) => mark.type.name === OriginalTextMark.name,
    );
    const hasSuggestionMark = node.marks.some(
      (mark) => mark.type.name === SuggestionMark.name,
    );

    if (hasOriginalMark) {
      if (originalRange.from === -1) originalRange.from = pos;
      originalRange.to = pos + node.nodeSize;
    }

    if (hasSuggestionMark) {
      if (suggestionRange.from === -1) suggestionRange.from = pos;
      suggestionRange.to = pos + node.nodeSize;
    }
  });

  return { originalRange, suggestionRange };
};

export default TiptapEditor;
