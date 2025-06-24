import { useState, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { OriginalContent, SuggestionIntent, Position } from "@/types/editor";
import { findSuggestionRanges, applyMarkdownFormatting } from "@/utils/suggestionUtils";
import { SuggestionMark, OriginalTextMark } from "@/utils/suggestion-mark";

export const useSuggestionState = (
  editor: ReturnType<typeof useEditor>,
  calculatePosition: (rect: DOMRect) => Position,
) => {
  const [suggestionToolbarVisible, setSuggestionToolbarVisible] = useState(false);
  const [suggestionToolbarPosition, setSuggestionToolbarPosition] = useState<Position>(null);
  const [originalContent, setOriginalContent] = useState<OriginalContent | null>(null);
  const [suggestionIntent, setSuggestionIntent] = useState<SuggestionIntent>("replace");

  const resetSuggestionState = useCallback(() => {
    setSuggestionToolbarVisible(false);
    setSuggestionToolbarPosition(null);
    setOriginalContent(null);
    setSuggestionIntent("replace");
  }, []);

  const handleSuggestion = useCallback((suggestion: string, intent: SuggestionIntent) => {
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
  }, [editor, calculatePosition]);

  const handleAcceptSuggestion = useCallback(() => {
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
    resetSuggestionState,
    handleSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
  };
}; 