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
  const chatbotContainerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"ask" | "edit">("ask");
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isActive,
    sendMessage,
    clearChat,
  } = useChatbotState({ documentContent });

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div ref={chatbotContainerRef} className={styles.chatbotContainer}>
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
                  <div className={styles.messageBody}>
                    {message.role === "assistant" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
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

              {/* Send Button - Bottom Right */}
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
        </form>
      </div>
    </div>
  );
};

export default MainChatbot;
