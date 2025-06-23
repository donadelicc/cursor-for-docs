import React, { useState, useEffect, useRef } from 'react';
import styles from './InlineChatbot.module.css';

interface InlineChatbotProps {
  isVisible: boolean;
  position: { x: number; y: number } | null;
  selectedText: string;
  onClose: () => void;
  onSuggest: (suggestion: string) => void;
}

const InlineChatbot = React.forwardRef<HTMLDivElement, InlineChatbotProps>(({
  isVisible,
  position,
  selectedText,
  onClose,
  onSuggest,
}, ref) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      setQuery('');
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, selectedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch suggestion');
      }

      const data = await response.json();
      onSuggest(data.suggestion);
      
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      onClose();
    }
  };

  if (!isVisible || !position) return null;

  return (
    <div
      ref={ref}
      className={styles.inlineChatbot}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI to edit..."
          className={styles.input}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? '...' : 'Generate'}
        </button>
      </form>
    </div>
  );
});

InlineChatbot.displayName = 'InlineChatbot';

export default InlineChatbot;