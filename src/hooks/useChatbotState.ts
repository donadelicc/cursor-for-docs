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
          // First, upload files to Blob Storage to handle large files
          const blobUrls: string[] = [];
          const fileMetadata: Array<{
            url: string;
            originalName: string;
            size: number;
          }> = [];

          // Import the upload function dynamically to avoid SSR issues
          const { upload } = await import("@vercel/blob/client");

          for (const file of uploadedFiles) {
            try {
              // Validate file size before upload (50MB limit for better UX)
              const maxSize = 50 * 1024 * 1024; // 50MB
              if (file.size > maxSize) {
                throw new Error(
                  `File ${file.name} exceeds 50MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
                );
              }

              // Direct upload to Blob Storage (bypasses API route limits)
              const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/upload/url", // We'll create this endpoint
              });

              blobUrls.push(blob.url);
              fileMetadata.push({
                url: blob.url,
                originalName: file.name,
                size: file.size,
              });
            } catch (error) {
              console.error(`Failed to upload file ${file.name}:`, error);
              throw new Error(
                `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }

          // Give blob storage a moment to make files available
          if (blobUrls.length > 0) {
            console.log("Waiting for blob storage to propagate...");
            await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay
          }

          // Now send the blob URLs to the sources API
          try {
            response = await fetch("/api/ai/sources", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: query.trim(),
                blobUrls: blobUrls,
                fileMetadata: fileMetadata,
              }),
            });
          } catch (sourcesError) {
            // Cleanup blob files if sources API fails
            if (blobUrls.length > 0) {
              try {
                await fetch("/api/cleanup", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ blobUrls }),
                });
                console.log("Cleaned up blob files after sources API failure");
              } catch (cleanupError) {
                console.error("Failed to cleanup blob files:", cleanupError);
              }
            }
            throw sourcesError;
          }
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
