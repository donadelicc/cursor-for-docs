import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./MainChatbot.module.css";
import { useChatbotState } from "@/hooks/useChatbotState";
import apiClient from "@/utils/apiClient";

interface MainChatbotProps {
  documentContent: string;
  selectedSources?: File[];
  onFileUpload?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  onChatbotFileRemove?: (file: File) => void;
}

const MainChatbot = ({
  documentContent,
  selectedSources = [],
  onFileUpload,
  onFileRemove,
  onChatbotFileRemove,
}: MainChatbotProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatbotContainerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"general" | "sources" | "focused">(
    "general",
  );
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);

  // Combine selected sources from KnowledgeBase with directly uploaded files
  // Remove duplicates based on file name and size to avoid conflicts
  const allUploadedFiles = [...selectedSources, ...uploadedFiles].filter(
    (file, index, self) =>
      index ===
      self.findIndex((f) => f.name === file.name && f.size === file.size),
  );

  // Auto-switch to Sources mode when files are available
  useEffect(() => {
    if (allUploadedFiles.length > 0 && mode !== "sources") {
      setMode("sources");
    } else if (allUploadedFiles.length === 0 && mode === "sources") {
      // Switch back to General mode when no files remain
      setMode("general");
    }
  }, [allUploadedFiles.length, mode]);

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isActive,
    setIsLoading,
    addMessage,
    updateLastMessage,
    clearChat,
  } = useChatbotState({
    documentContent,
    uploadedFiles: allUploadedFiles,
    mode,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatbot becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModeDropdown && !event.target) {
        return;
      }
      const target = event.target as Element;
      if (!target.closest(`.${styles.modeSelector}`)) {
        setShowModeDropdown(false);
      }
    };

    if (showModeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModeDropdown]);

  // Auto-resize textarea when input value changes
  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  // Initial resize on mount and window resize
  useEffect(() => {
    autoResizeTextarea();

    const handleResize = () => {
      autoResizeTextarea();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    // Add the user's message to the state immediately for a responsive UI
    addMessage({ role: 'user', content: query });
    setInputValue("");
    setIsLoading(true);

    try {
      let response: Response;

      if (mode === "sources") {
        const formData = new FormData();
        formData.append("query", query);
        console.log(`[chat] → POST /sources`, { query });
        response = await apiClient.post("/sources", formData);
      } else if (mode === "general") {
        console.log(`[chat] → POST /general`, { query });
        response = await fetch("http://localhost:8000/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // focused
        console.log(`[chat] → POST /api/ai/focus`, { query });
        response = await fetch("/api/ai/focus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, documentContent }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }
      
      if (!response.body) throw new Error("Response body is empty.");
      
      // Add an empty placeholder message for the assistant
      addMessage({ role: 'assistant', content: "" });
      
      // Handle the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      console.log(`[chat] ← streaming response started`);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Update the last message in the array with the new chunk
        updateLastMessage(chunk);
        // Log chunk size to avoid logging full content
        console.log(`[chat] ← chunk`, { bytes: value?.byteLength ?? 0 });
      }
      console.log(`[chat] ← streaming response completed`);

    } catch (error) {
      console.error("Error fetching chat response:", error);
      addMessage({ role: 'assistant', content: "Sorry, an error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleModeChange = (newMode: "general" | "sources" | "focused") => {
    setMode(newMode);
    setShowModeDropdown(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // NEW: The actual API call for ingestion
  const handleIngestFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    // 1. Show a spinner
    setUploadingFiles(prev => new Set([...prev, ...filesToUpload.map(f => f.name)]));

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append("files", file);
      });
    // 2. Start the REAL backend upload and WAIT for it to finish
      console.log(`[upload] → POST /documents`, { files: filesToUpload.map(f => ({ name: f.name, size: f.size })) });
      const response = await apiClient.post("/documents", formData);
      console.log(`[upload] ← /documents ${response.status}`);
    
      // 3. If it succeeds, we're done! The spinner will be hidden in the 'finally' block.
      //setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error("Error ingesting files:", error);
      setNotification(`Error: Could not upload files. Please try again.`);
      setTimeout(() => setNotification(null), 5000);
      
      // If upload fails, remove the files from the UI state
      setUploadedFiles(prev => prev.filter(f => !filesToUpload.some(fu => fu.name === f.name)));

    } finally {
      // Remove files from the "uploading" state after completion
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        filesToUpload.forEach(f => newSet.delete(f.name));
        return newSet;
      });
      // Re-enable upload button
      setIsUploadingFiles(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingFiles(true);
      processFiles(files);
    }

    // Clear the input so the same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeUploadedFile = async (index: number) => {
    const fileToRemove = allUploadedFiles[index];
    if (!fileToRemove) return;

    try {
      const endpoint = `/documents/${encodeURIComponent(fileToRemove.name)}`;
      console.log(`[upload] → DELETE ${endpoint}`);
      const resp = await apiClient.delete(endpoint);
      console.log(`[upload] ← DELETE ${endpoint} ${resp.status}`);
    
      // --- If API call is successful, then update the local state ---
      // Check if file is from selectedSources (Knowledge Base)
      const isFromSelectedSources = selectedSources.some(
        (f) => f.name === fileToRemove.name && f.size === fileToRemove.size,
      );

      // Check if file is from directly uploaded files
      const isFromUploadedFiles = uploadedFiles.some(
        (f) => f.name === fileToRemove.name && f.size === fileToRemove.size,
      );

      // Remove from Knowledge Base selection if present
      if (isFromSelectedSources) {
        onFileRemove?.(fileToRemove);
      }

      // Remove from directly uploaded files if present
      if (isFromUploadedFiles) {
        setUploadedFiles((prev) =>
          prev.filter(
            (f) =>
              !(f.name === fileToRemove.name && f.size === fileToRemove.size),
          ),
        );
        onChatbotFileRemove?.(fileToRemove);
      }
    } catch (error) {
      console.error("Failed to remove source:", error);
    }
  };

  // File size validation (max 10MB per file)
  const validateFileSize = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  };

  // Process files with validation
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter(
      (file) => file.type === "application/pdf",
    );
    const validFiles: File[] = [];
    const duplicateFiles: string[] = [];
    const errors: string[] = [];

    // Check if adding new files would exceed the 3-file limit
    const currentAttachedCount = allUploadedFiles.length;
    const maxAttachedFiles = 3;

    if (currentAttachedCount >= maxAttachedFiles) {
      setNotification("Maximum documents 3");
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
      return;
    }

    pdfFiles.forEach((file) => {
      // Check file size
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      // Check for duplicates against all uploaded files (including selected sources)
      const isDuplicate = allUploadedFiles.some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size,
      );

      if (isDuplicate) {
        duplicateFiles.push(file.name);
        return;
      }

      // Check if adding this file would exceed the limit
      if (currentAttachedCount + validFiles.length >= maxAttachedFiles) {
        // Stop processing more files - we've reached the limit
        return;
      }

      // File is valid and not duplicate
      validFiles.push(file);
    });

    // Additional check: if we would exceed the limit with valid files, show warning
    if (currentAttachedCount + validFiles.length > maxAttachedFiles) {
      const filesToAdd = maxAttachedFiles - currentAttachedCount;
      validFiles.splice(filesToAdd); // Keep only files that fit within the limit
      errors.push("Maximum documents 3");
    }

    // Collect all error messages
    if (fileArray.length !== pdfFiles.length) {
      errors.push("Only PDF files are supported");
    }

    if (duplicateFiles.length > 0) {
      errors.push(`Duplicate file`);
    }

    if (errors.length > 0) {
      const fullMessage = errors.join(" | ");
      setNotification(fullMessage);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }

    if (validFiles.length > 0) {
      // Add files to uploading state
      const fileNames = validFiles.map((f) => f.name);
      setUploadingFiles((prev) => new Set([...prev, ...fileNames]));

      // Add files to the list
      setUploadedFiles((prev) => [...prev, ...validFiles]);

      // Notify parent (EditorContainer) about new files to sync with KnowledgeBase
      onFileUpload?.(validFiles);

      handleIngestFiles(validFiles);
    } else {
      // No valid files to upload; ensure button is re-enabled
      setIsUploadingFiles(false);
    }
  };

  // Drag & Drop handlers - minimal, no visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  // Auto-resize textarea based on content
  const autoResizeTextarea = () => {
    const textarea = inputRef.current;
    const container = chatbotContainerRef.current;

    if (!textarea || !container) return;

    // Reset height to get accurate scrollHeight measurement
    textarea.style.height = "auto";

    // Calculate max height (30% of chatbot container) with minimum
    const containerHeight = container.offsetHeight;
    const maxHeight = Math.max(Math.floor(containerHeight * 0.3), 80); // Minimum 80px to account for button space
    const minHeight = 60; // Minimum height to account for embedded buttons (40px text + 20px button space)

    // Calculate new height based on content
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));

    textarea.style.height = `${newHeight}px`;

    // Enable/disable scrolling based on whether we've reached max height
    textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  };

  return (
    <div
      ref={chatbotContainerRef}
      className={styles.chatbotContainer}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Notification */}
      {notification && (
        <div className={styles.notification}>
          <span className={styles.notificationText}>{notification}</span>
          <button
            className={styles.notificationClose}
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={styles.newChatButton}
            title="New Chat"
            onClick={clearChat}
          >
            <svg
              className={styles.buttonIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageWrapper} ${
                message.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageText}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-gray prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className={styles.messageBody}>{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div
              className={`${styles.messageWrapper} ${styles.assistantMessage}`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageText}>
                  <div className={styles.loadingIndicator}>
                    <div className={styles.loadingDots}>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        {/* Individual Source Files - Above Input */}
        {allUploadedFiles.length > 0 && (
          <div className={styles.sourceFilesContainer}>
            {allUploadedFiles.map((file, index) => {
              const isUploading = uploadingFiles.has(file.name);
              return (
                <div key={index} className={styles.sourceFileItem}>
                  <div className={styles.sourceFileInfo}>
                    <div className={styles.sourceFileIcon}>
                      {isUploading ? (
                        <div className={styles.loadingSpinner}>
                          <svg
                            className={styles.spinnerIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className={styles.spinnerCircle}
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray="32"
                              strokeDashoffset="32"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div
                          onClick={() => removeUploadedFile(index)}
                          title="Remove source"
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          <svg
                            className={styles.pdfIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {/* Show remove icon for all files */}
                          <svg
                            className={styles.removeIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.sourceFileDetails}>
                      <span className={styles.sourceFileName}>{file.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          {/* Text Input with Embedded Buttons */}
          <div className={styles.textInputWrapper}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize will be handled by useEffect
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "general"
                  ? `Ask me anything...`
                  : mode === "sources"
                    ? `Ask questions about your uploaded sources...`
                    : `Ask questions about your document...`
              }
              className={styles.textInput}
              rows={1}
              disabled={isLoading}
              data-chatbot-input="true"
            />

            {/* Embedded Buttons */}
            <div className={styles.embeddedButtons}>
              {/* Mode Selector - Bottom Left */}
              <div className={styles.modeSelector}>
                <button
                  type="button"
                  className={styles.modeButton}
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                >
                  <span className={styles.modeButtonText}>
                    {mode === "general"
                      ? "General"
                      : mode === "sources"
                        ? "Sources"
                        : "Focused"}
                  </span>
                  <svg
                    className={`${styles.chevronIcon} ${
                      showModeDropdown ? styles.chevronUp : styles.chevronDown
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showModeDropdown && (
                  <div className={styles.modeDropdown}>
                    <button
                      type="button"
                      className={`${styles.modeOption} ${
                        mode === "general" ? styles.modeOptionActive : ""
                      }`}
                      onClick={() => handleModeChange("general")}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeOption} ${
                        mode === "sources" ? styles.modeOptionActive : ""
                      }`}
                      onClick={() => handleModeChange("sources")}
                    >
                      Sources
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeOption} ${
                        mode === "focused" ? styles.modeOptionActive : ""
                      }`}
                      onClick={() => handleModeChange("focused")}
                    >
                      Focused
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side Buttons */}
              <div className={styles.rightButtons}>
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isLoading || isUploadingFiles}
                  className={styles.uploadButton}
                  title="Upload PDF files"
                >
                  <svg
                    className={styles.uploadIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={styles.sendButton}
                >
                  <svg
                    className={styles.sendIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default MainChatbot;
