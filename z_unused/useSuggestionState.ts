import { useState, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { OriginalContent, SuggestionIntent, Position } from "@/types/editor";
import {
  findSuggestionRanges,
  applyMarkdownFormatting,
} from "@/utils/suggestionUtils";
import { SuggestionMark, OriginalTextMark } from "@/utils/suggestion-mark";

export const useSuggestionState = (editor: ReturnType<typeof useEditor>) => {
  const [suggestionToolbarVisible, setSuggestionToolbarVisible] =
    useState(false);
  const [isSuggestionActive, setIsSuggestionActive] = useState(false);
  const [suggestionToolbarPosition, setSuggestionToolbarPosition] =
    useState<Position>(null);
  const [originalContent, setOriginalContent] =
    useState<OriginalContent | null>(null);
  const [suggestionIntent, setSuggestionIntent] =
    useState<SuggestionIntent>("replace");

  const resetSuggestionState = useCallback(() => {
    setSuggestionToolbarVisible(false);
    setSuggestionToolbarPosition(null);
    setOriginalContent(null);
    setSuggestionIntent("replace");
    setIsSuggestionActive(false);
  }, []);

  const handleSuggestion = useCallback(
    (suggestion: string, intent: SuggestionIntent) => {
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
      setOriginalContent({
        text: originalText,
        from: actualFrom,
        to: actualTo,
      });
      setSuggestionIntent(intent);
      setIsSuggestionActive(true);

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

      // After applying the suggestion, set the toolbar to visible.
      // The position is no longer needed as it's statically placed.
      setTimeout(() => {
        setSuggestionToolbarVisible(true);
      }, 100); // A small delay to ensure the editor state has updated

      // Debug logging
      console.log("🎯 Suggestion applied, showing toolbar:", {
        suggestion:
          suggestion.substring(0, 50) + (suggestion.length > 50 ? "..." : ""),
        intent,
        toolbarVisible: true,
        originalFrom: actualFrom,
        originalTo: actualTo,
      });
    },
    [editor],
  );

  const handleAcceptSuggestion = useCallback(() => {
    if (!editor || !originalContent) return;

    // Find both the original text and suggestion ranges
    const { originalRange, suggestionRange } = findSuggestionRanges(editor);

    if (originalRange.from === -1 || suggestionRange.from === -1) {
      resetSuggestionState();
      return;
    }

    // Handle different intents
    if (suggestionIntent === "replace") {
      // Replace: Remove original text and keep only the suggestion
      // First, remove the suggestion mark from the suggestion text
      editor
        .chain()
        .focus()
        .setTextSelection({
          from: suggestionRange.from,
          to: suggestionRange.to,
        })
        .unsetMark(SuggestionMark.name)
        .run();

      // Then delete the original text (which is marked with OriginalTextMark)
      editor
        .chain()
        .focus()
        .deleteRange({ from: originalRange.from, to: originalRange.to })
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
  }, [editor, originalContent, suggestionIntent, resetSuggestionState]);

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

  return {
    suggestionToolbarVisible,
    suggestionToolbarPosition,
    originalContent,
    suggestionIntent,
    isSuggestionActive,
    resetSuggestionState,
    handleSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
  };
};
