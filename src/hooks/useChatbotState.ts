import { useState, useCallback } from "react";
import { Position } from "@/types/editor";

export const useChatbotState = () => {
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState<Position>(null);

  const resetChatbotState = useCallback(() => {
    setChatbotVisible(false);
    setChatbotPosition(null);
  }, []);

  const showChatbot = useCallback((position: Position) => {
    setChatbotPosition(position);
    setChatbotVisible(true);
  }, []);

  return {
    chatbotVisible,
    chatbotPosition,
    resetChatbotState,
    showChatbot,
  };
}; 