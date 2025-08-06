import { useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { findSuggestionRanges } from "@/utils/suggestionUtils";
import { OriginalContent, Position } from "@/types/editor";

interface UseEditorUtilsProps {
  editor: ReturnType<typeof useEditor>;
  suggestionToolbarVisible: boolean;
  originalContent: OriginalContent | null;
  calculatePosition: (rect: DOMRect) => Position;
  resetSuggestionState: () => void;
  setSuggestionToolbarVisible: (visible: boolean) => void;
  setSuggestionToolbarPosition: (position: Position) => void;
  setOriginalContent: (content: OriginalContent | null) => void;
}

export const useEditorUtils = ({
  editor,
  suggestionToolbarVisible,
  originalContent,
  calculatePosition,
  resetSuggestionState,
  setSuggestionToolbarVisible,
  setSuggestionToolbarPosition,
  setOriginalContent,
}: UseEditorUtilsProps) => {
  // Function to sync component state with document state
  const syncStateWithDocument = useCallback(() => {
    if (!editor) return;

    const { originalRange, suggestionRange } = findSuggestionRanges(editor);
    const hasOriginalMark = originalRange.from !== -1;
    const hasSuggestionMark = suggestionRange.from !== -1;

    if (hasOriginalMark && hasSuggestionMark) {
      // Both marks exist - we're in suggestion state
      if (!suggestionToolbarVisible) {
        console.log("🎯 Showing suggestion toolbar");
        setSuggestionToolbarVisible(true);

        // Calculate toolbar position with multiple attempts for reliability
        const calculateToolbarPosition = (attempts = 0) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const position = calculatePosition(rect);

            if (position) {
              setSuggestionToolbarPosition(position);
              return true;
            }
          }

          // Retry if position calculation failed
          if (attempts < 3) {
            setTimeout(() => calculateToolbarPosition(attempts + 1), 50);
          }
          return false;
        };

        // Start position calculation
        setTimeout(() => calculateToolbarPosition(), 10);

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
    } else if (!hasOriginalMark && !hasSuggestionMark) {
      // No marks exist - we're not in suggestion state
      if (suggestionToolbarVisible) {
        console.log("🎯 Hiding suggestion toolbar");
        resetSuggestionState();
      }
    }
  }, [
    editor,
    suggestionToolbarVisible,
    originalContent,
    calculatePosition,
    setSuggestionToolbarVisible,
    setSuggestionToolbarPosition,
    setOriginalContent,
    resetSuggestionState,
  ]);

  // Function to get selected text for AI processing
  const getSelectedText = useCallback(() => {
    if (!editor) return "";

    const { from, to, empty } = editor.state.selection;

    if (empty) {
      // No selection - return entire document content
      return editor.state.doc.textContent;
    } else {
      // Has selection - return selected text
      return editor.state.doc.textBetween(from, to);
    }
  }, [editor]);

  return {
    syncStateWithDocument,
    getSelectedText,
  };
};
