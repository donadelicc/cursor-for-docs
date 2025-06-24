import { useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { htmlToMarkdown } from "@/utils/markdownConverter";
import { findSuggestionRanges } from "@/utils/suggestionUtils";
import { OriginalTextMark } from "@/utils/suggestion-mark";

interface UseEditorUtilsProps {
  editor: ReturnType<typeof useEditor>;
  chatbotVisible: boolean;
  suggestionToolbarVisible: boolean;
  originalContent: any;
  calculatePosition: (rect: DOMRect) => any;
  resetSuggestionState: () => void;
  resetChatbotState: () => void;
  setSuggestionToolbarVisible: (visible: boolean) => void;
  setSuggestionToolbarPosition: (position: any) => void;
  setOriginalContent: (content: any) => void;
}

export const useEditorUtils = ({
  editor,
  chatbotVisible,
  suggestionToolbarVisible,
  originalContent,
  calculatePosition,
  resetSuggestionState,
  resetChatbotState,
  setSuggestionToolbarVisible,
  setSuggestionToolbarPosition,
  setOriginalContent,
}: UseEditorUtilsProps) => {
  // Function to sync component state with document state
  const syncStateWithDocument = useCallback(() => {
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
  }, [
    editor,
    chatbotVisible,
    suggestionToolbarVisible,
    originalContent,
    calculatePosition,
    resetSuggestionState,
    resetChatbotState,
    setSuggestionToolbarVisible,
    setSuggestionToolbarPosition,
    setOriginalContent,
  ]);

  // Get selected text as markdown for AI processing
  const getSelectedText = useCallback(() => {
    if (!editor) return "";

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
  }, [editor]);

  return {
    syncStateWithDocument,
    getSelectedText,
  };
}; 