import { useState, useEffect, useCallback } from "react";
import { isModifierPressed } from "@/utils/platformDetection";

interface Message {
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

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return undefined;

      // Validate Sources mode before proceeding
      if (mode === "sources" && uploadedFiles.length === 0) {
        return {
          validationError:
            "Sources mode requires uploaded PDF files. Please upload some files first.",
        };
      }

      // Validate file size for Sources mode (Vercel 4.5MB limit)
      if (mode === "sources") {
        const maxPayloadSize = 4.5 * 1024 * 1024; // 4.5MB in bytes
        let totalSize = 0;
        
        // Calculate total size of all files
        uploadedFiles.forEach((file) => {
          totalSize += file.size;
        });
        
        // Add approximate size of query and FormData overhead (usually small)
        totalSize += query.trim().length * 2; // UTF-8 can be up to 2 bytes per char
        totalSize += 1024; // Add 1KB for FormData overhead
        
        if (totalSize > maxPayloadSize) {
          const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
          return {
            validationError: `Files are too big. Max 4.5MB combined (current: ${totalSizeMB}MB)`,
          };
        }
      }

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
        let response: Response;

        // Choose API endpoint based on mode
        if (mode === "sources") {
          const formData = new FormData();
          formData.append("query", query.trim());

          // Append all uploaded files
          uploadedFiles.forEach((file) => {
            formData.append("files", file);
          });

          response = await fetch("/api/ai/sources-vector", {
            method: "POST",
            body: formData,
          });
        } else if (mode === "focused") {
          // Focused mode - uses document content
          response = await fetch("/api/ai/focus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: query.trim(),
              documentContent: documentContent,
            }),
          });
        } else {
          // General mode - general AI queries
          response = await fetch("/api/ai/ask", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: query.trim(),
            }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to get response from AI assistant",
          );
        }

        const data = await response.json();

        // Use the AI response directly without footer text
        const messageContent = data.answer;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: messageContent,
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

      // Return undefined for successful execution
      return undefined;
    },
    [documentContent, uploadedFiles, mode, isLoading],
  );

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
    isActive,
    setIsActive,
    sendMessage,
    clearChat,
  };
};
