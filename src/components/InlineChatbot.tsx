import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import styles from "./InlineChatbot.module.css";

interface InlineChatbotProps {
  selectedText: string;
  onSuggest: (
    suggestion: string,
    intent: "replace" | "add_after" | "add_before",
  ) => void;
}

export interface InlineChatbotRef {
  focus: () => void;
}

const InlineChatbot = React.forwardRef<InlineChatbotRef, InlineChatbotProps>(
  ({ selectedText, onSuggest }, ref) => {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    useEffect(() => {
      setIsLoading(false);
      // Remove auto-focus since component is always visible
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;

      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/suggestion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query.trim(),
            selectedText: selectedText || "",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch suggestion");
        }

        const data = await response.json();
        const detectedIntent = data.intent || "add_after";

        // Log the detected intent for testing/debugging
        console.log("🤖 AI Intent Detection:", {
          query: query,
          selectedText: selectedText || "[Empty document]",
          detectedIntent: detectedIntent,
          suggestion:
            data.suggestion.substring(0, 50) +
            (data.suggestion.length > 50 ? "..." : ""),
        });

        onSuggest(data.suggestion, detectedIntent);
        setQuery(""); // Clear the input after successful suggestion
      } catch (error) {
        console.error("AI request failed:", error);
        // Show user-friendly error message
        alert("Failed to get AI suggestion. Please try again.");
        // Don't call onClose since component is always visible
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className={styles.inlineChatbotRow}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedText
                ? "Ask AI to edit document inline..."
                : "Ask AI to create content..."
            }
            className={styles.input}
            disabled={isLoading}
          />
        </form>
        {isLoading && (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
      </div>
    );
  },
);

InlineChatbot.displayName = "InlineChatbot";

export default InlineChatbot;
