import { useState, useEffect, useCallback } from "react";
import { isModifierPressed } from "@/utils/platformDetection";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface UseChatbotStateProps {
  documentContent: string;
  uploadedFiles?: File[];
  mode: "general" | "sources" | "focused";
}

export const useChatbotState = ({
  documentContent,
  uploadedFiles = [],
  mode,
}: UseChatbotStateProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { documentContent, uploadedFiles, mode };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI assistant. Switch between modes to ask general questions, analyze your documents, or explore your uploaded sources!",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Keyboard shortcut for Ctrl+L (Windows) / Cmd+L (Mac) to activate/focus chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModifierPressed(e) && e.key === "l") {
        e.preventDefault();
        setIsActive(true);

        // Focus will be handled by the component after state update
        setTimeout(() => {
          const chatInput = document.querySelector(
            '[data-chatbot-input="true"]',
          ) as HTMLTextAreaElement;
          if (chatInput) {
            chatInput.focus();
          }
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Simplified: no API logic, only state utilities
  type AddMessageInput = { role: "user" | "assistant"; content: string };

  const addMessage = useCallback((message: AddMessageInput) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.content,
      role: message.role,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const updateLastMessage = useCallback((chunk: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        content: `${updated[lastIndex].content}${chunk}`,
      };
      return updated;
    });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        content:
          "Hello! I'm your AI assistant. Switch between modes to ask general questions, analyze your documents, or explore your uploaded sources!",
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    isActive,
    setIsActive,
    addMessage,
    updateLastMessage,
    clearChat,
  };
};
