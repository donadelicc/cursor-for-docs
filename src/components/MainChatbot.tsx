import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./MainChatbot.module.css";
import { useChatbotState } from "@/hooks/useChatbotState";

interface MainChatbotProps {
  documentContent: string;
}

const MainChatbot = ({ documentContent }: MainChatbotProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatbotContainerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"ask" | "edit">("ask");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isActive,
    sendMessage,
    clearChat,
  } = useChatbotState({ documentContent, uploadedFiles });

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
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
    // Textarea will be resized automatically via useEffect when inputValue is cleared
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleModeChange = (newMode: "ask" | "edit") => {
    setMode(newMode);
    setShowModeDropdown(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingFiles(true);
      processFiles(files);
      setTimeout(() => setIsUploadingFiles(false), 2000);
    }

    // Clear the input so the same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
    const errors: string[] = [];

    pdfFiles.forEach((file) => {
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileArray.length !== pdfFiles.length) {
      errors.push("Only PDF files are supported");
    }

    if (errors.length > 0) {
      console.warn("File upload errors:", errors);
      // TODO: Show user notification with errors
    }

    if (validFiles.length > 0) {
      // Add files to uploading state
      const fileNames = validFiles.map((f) => f.name);
      setUploadingFiles((prev) => new Set([...prev, ...fileNames]));

      // Add files to the list
      setUploadedFiles((prev) => [...prev, ...validFiles]);

      // Simulate upload completion after 2 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          fileNames.forEach((name) => newSet.delete(name));
          return newSet;
        });
      }, 2000);
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
        {uploadedFiles.length > 0 && (
          <div className={styles.sourceFilesContainer}>
            {uploadedFiles.map((file, index) => {
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
                          style={{ cursor: "pointer" }}
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
                mode === "ask"
                  ? `Ask me anything...`
                  : `Ask me to edit your document...`
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
                    {mode === "ask" ? "Ask" : "Edit"}
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
                        mode === "ask" ? styles.modeOptionActive : ""
                      }`}
                      onClick={() => handleModeChange("ask")}
                    >
                      Ask
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeOption} ${
                        mode === "edit" ? styles.modeOptionActive : ""
                      }`}
                      onClick={() => handleModeChange("edit")}
                    >
                      Edit
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
