import { useState, useEffect, useCallback } from "react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface UseChatbotStateProps {
  documentContent: string;
}

export const useChatbotState = ({ documentContent }: UseChatbotStateProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI document research assistant. I can help you understand and analyze your document. Ask me anything about the content!",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Keyboard shortcut for Ctrl+L to activate/focus chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "l") {
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

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: query.trim(),
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/main", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query.trim(),
            documentContent: documentContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to get response from AI assistant",
          );
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.answer,
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("AI request failed:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content:
            "I apologize, but I encountered an error while processing your request. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [documentContent, isLoading],
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        content:
          "Hello! I'm your AI document research assistant. I can help you understand and analyze your document. Ask me anything about the content!",
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
    isActive,
    setIsActive,
    sendMessage,
    clearChat,
  };
};
