import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatbotState } from '@/hooks/useChatbotState';
// apiClient removed; no longer sending files to /documents

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
  const [mode, setMode] = useState<'general' | 'sources' | 'focused'>('general');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);

  // Combine selected sources from KnowledgeBase with directly uploaded files
  // Remove duplicates based on file name and size to avoid conflicts
  const allUploadedFiles = [...selectedSources, ...uploadedFiles].filter(
    (file, index, self) =>
      index === self.findIndex((f) => f.name === file.name && f.size === file.size),
  );

  // Auto-switch to Sources mode when files are available
  useEffect(() => {
    if (allUploadedFiles.length > 0 && mode !== 'sources') {
      setMode('sources');
    } else if (allUploadedFiles.length === 0 && mode === 'sources') {
      // Switch back to General mode when no files remain
      setMode('general');
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
  } = useChatbotState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      if (!target.closest('[data-mode-selector]')) {
        setShowModeDropdown(false);
      }
    };

    if (showModeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    // Add the user's message to the state immediately for a responsive UI
    addMessage({ role: 'user', content: query });
    setInputValue('');
    setIsLoading(true);

    try {
      let response: Response;

      if (mode === 'sources') {
        const formData = new FormData();
        formData.append('query', query);
        // Attach currently available uploaded/selected PDF files for analysis
        allUploadedFiles.forEach((file) => formData.append('files', file));
        console.log(`[chat] → POST /api/ai/sources`, { query });
        response = await fetch('/api/ai/sources', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } else if (mode === 'general') {
        console.log(`[chat] → POST /api/ai/general`, { query });
        response = await fetch('/api/ai/general', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // focused
        console.log(`[chat] → POST /api/ai/focus`, { query });
        response = await fetch('/api/ai/focus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, documentContent }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      if (!response.body) throw new Error('Response body is empty.');

      // Add an empty placeholder message for the assistant
      addMessage({ role: 'assistant', content: '' });

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
      console.error('Error fetching chat response:', error);
      addMessage({ role: 'assistant', content: 'Sorry, an error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleModeChange = (newMode: 'general' | 'sources' | 'focused') => {
    setMode(newMode);
    setShowModeDropdown(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // File ingestion to backend has been removed; keep UI state only
  const handleIngestFiles = async () => {
    setIsUploadingFiles(false);
    setUploadingFiles(new Set());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingFiles(true);
      processFiles(files);
    }

    // Clear the input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeUploadedFile = async (index: number) => {
    const fileToRemove = allUploadedFiles[index];
    if (!fileToRemove) return;

    // Update local state only; no backend deletion
    const isFromSelectedSources = selectedSources.some(
      (f) => f.name === fileToRemove.name && f.size === fileToRemove.size,
    );

    const isFromUploadedFiles = uploadedFiles.some(
      (f) => f.name === fileToRemove.name && f.size === fileToRemove.size,
    );

    if (isFromSelectedSources) {
      onFileRemove?.(fileToRemove);
    }

    if (isFromUploadedFiles) {
      setUploadedFiles((prev) =>
        prev.filter((f) => !(f.name === fileToRemove.name && f.size === fileToRemove.size)),
      );
      onChatbotFileRemove?.(fileToRemove);
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
    const pdfFiles = fileArray.filter((file) => file.type === 'application/pdf');
    const validFiles: File[] = [];
    const duplicateFiles: string[] = [];
    const errors: string[] = [];

    // Check if adding new files would exceed the 3-file limit
    const currentAttachedCount = allUploadedFiles.length;
    const maxAttachedFiles = 3;

    if (currentAttachedCount >= maxAttachedFiles) {
      setNotification('Maximum documents 3');
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
        (existingFile) => existingFile.name === file.name && existingFile.size === file.size,
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
      errors.push('Maximum documents 3');
    }

    // Collect all error messages
    if (fileArray.length !== pdfFiles.length) {
      errors.push('Only PDF files are supported');
    }

    if (duplicateFiles.length > 0) {
      errors.push(`Duplicate file`);
    }

    if (errors.length > 0) {
      const fullMessage = errors.join(' | ');
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

      // No backend ingestion; clear any uploading UI state
      handleIngestFiles();
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
    textarea.style.height = 'auto';

    // Calculate max height (30% of chatbot container) with minimum
    const containerHeight = container.offsetHeight;
    const maxHeight = Math.max(Math.floor(containerHeight * 0.3), 80); // Minimum 80px to account for button space
    const minHeight = 60; // Minimum height to account for embedded buttons (40px text + 20px button space)

    // Calculate new height based on content
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));

    textarea.style.height = `${newHeight}px`;

    // Enable/disable scrolling based on whether we've reached max height
    textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  };

  return (
    <div
      ref={chatbotContainerRef}
      className="flex flex-col w-full h-full bg-white font-sans relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Notification */}
      {notification && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-50 border border-yellow-400 rounded-lg p-3 flex items-center justify-between z-50 shadow-lg">
          <span className="text-sm text-yellow-800 flex-1 mr-2">{notification}</span>
          <button className="bg-none border-none text-yellow-800 cursor-pointer text-xl leading-none p-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-200 hover:bg-yellow-100" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200" title="New Chat" onClick={clearChat}>
            <svg
              className="w-4 h-4"
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-lg rounded-br-sm' 
                  : 'bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm'
              }`}>
                <div className="px-4 py-3">
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-gray prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm">
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
      <div className="border-t border-gray-200 bg-white p-4 shrink-0">
        {/* Individual Source Files - Above Input */}
        {allUploadedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {allUploadedFiles.map((file, index) => {
              const isUploading = uploadingFiles.has(file.name);
              return (
                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {isUploading ? (
                        <div className="relative">
                          <svg
                            className="w-4 h-4 text-blue-600 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
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
                          className="cursor-pointer relative group"
                        >
                          <svg
                            className="w-4 h-4 text-red-600"
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
                            className="absolute top-0 right-0 w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-x-1 -translate-y-1"
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
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 text-sm font-medium truncate block">{file.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Text Input with Embedded Buttons */}
          <div className="relative flex items-end bg-gray-50 border border-gray-300 rounded-xl p-3 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize will be handled by useEffect
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'general'
                  ? `Ask me anything...`
                  : mode === 'sources'
                    ? `Ask questions about your uploaded sources...`
                    : `Ask questions about your document...`
              }
              className="flex-1 resize-none border-none bg-transparent outline-none text-gray-900 text-sm leading-relaxed min-h-[20px] max-h-32"
              rows={1}
              disabled={isLoading}
              data-chatbot-input="true"
            />

            {/* Embedded Buttons */}
            <div className="flex items-end gap-2 ml-2">
              {/* Mode Selector - Bottom Left */}
              <div className="relative" data-mode-selector>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                >
                  <span className="font-medium">
                    {mode === 'general' ? 'General' : mode === 'sources' ? 'Sources' : 'Focused'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showModeDropdown ? 'rotate-180' : ''
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
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50 ${
                        mode === 'general' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleModeChange('general')}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50 ${
                        mode === 'sources' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleModeChange('sources')}
                    >
                      Sources
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50 ${
                        mode === 'focused' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleModeChange('focused')}
                    >
                      Focused
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side Buttons */}
              <div className="flex items-center gap-2">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isLoading || isUploadingFiles}
                  className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload PDF files"
                >
                  <svg
                    className="w-4 h-4"
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
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
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
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default MainChatbot;
