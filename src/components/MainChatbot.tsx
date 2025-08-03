import React, { useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./MainChatbot.module.css";
import { useChatbotState } from "@/hooks/useChatbotState";
import { isMacOS } from "@/utils/platformDetection";

interface MainChatbotProps {
  documentContent: string;
}

const MainChatbot = ({ documentContent }: MainChatbotProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect platform for correct shortcut display
  const shortcutKey = useMemo(() => {
    return isMacOS() ? "Cmd+L" : "Ctrl+L";
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={styles.chatbotContainer}>
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
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask me anything about your document... (${shortcutKey} to focus)`}
              className={styles.textInput}
              rows={1}
              disabled={isLoading}
              data-chatbot-input="true"
            />
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
        </form>
      </div>
    </div>
  );
};

export default MainChatbot;
