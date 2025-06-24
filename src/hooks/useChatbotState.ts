import { useState, useCallback, RefObject } from "react";
import { Position } from "@/types/editor";

export const useChatbotState = (
  editorContainerRef?: RefObject<HTMLDivElement | null>,
) => {
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState<Position>(null);

  const resetChatbotState = useCallback(() => {
    setChatbotVisible(false);
    setChatbotPosition(null);
  }, []);

  // Always show chatbot at top center of editor
  const showChatbot = useCallback(() => {
    let position: Position = { x: 400, y: 24 };
    if (editorContainerRef && editorContainerRef.current) {
      const rect = editorContainerRef.current.getBoundingClientRect();
      position = {
        x: rect.width / 2,
        y: 24,
      };
    }
    setChatbotPosition(position);
    setChatbotVisible(true);
  }, [editorContainerRef]);

  return {
    chatbotVisible,
    chatbotPosition,
    resetChatbotState,
    showChatbot,
  };
};
