import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { Position } from "@/types/editor";

interface UseKeyboardShortcutsProps {
  editor: ReturnType<typeof useEditor>;
  suggestionToolbarVisible: boolean;
  chatbotVisible: boolean;
  calculatePosition: (rect: DOMRect) => Position;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  showChatbot: (position: Position) => void;
  resetChatbotState: () => void;
  handleRejectSuggestion: () => void;
}

export const useKeyboardShortcuts = ({
  editor,
  suggestionToolbarVisible,
  chatbotVisible,
  calculatePosition,
  editorContainerRef,
  showChatbot,
  resetChatbotState,
  handleRejectSuggestion,
}: UseKeyboardShortcutsProps) => {
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
              showChatbot(position);
            }
          }
        } else {
          // No selection - position chatbot in center of editor
          const editorRect = editorContainerRef.current?.getBoundingClientRect();
          if (editorRect) {
            const position = {
              x: editorRect.width / 2,
              y: editorRect.height / 3, // Position in upper third of editor
            };
            showChatbot(position);
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
    editorContainerRef,
    showChatbot,
  ]);

  // Handle closing popups with Escape key
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
}; 