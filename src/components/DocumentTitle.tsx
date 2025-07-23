import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateDocument, generateDocumentTitle } from "@/utils/firestore";

interface DocumentTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  currentDocumentId?: string;
  documentContent: string;
  disabled?: boolean;
}

export const DocumentTitle: React.FC<DocumentTitleProps> = ({
  title,
  onTitleChange,
  currentDocumentId,
  documentContent,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  // Update editingTitle when title prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditingTitle(title);
    }
  }, [title, isEditing]);

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSaveTitle = async () => {
    const newTitle = editingTitle.trim();

    // Don't save if title is empty or unchanged
    if (!newTitle || newTitle === title) {
      setIsEditing(false);
      setEditingTitle(title);
      return;
    }

    if (currentDocumentId && currentUser) {
      // Save to Firestore for existing documents
      setIsSaving(true);
      try {
        await updateDocument(currentDocumentId, {
          title: newTitle,
          content: documentContent,
          lastModified: new Date(),
        });
        onTitleChange(newTitle);
        console.log("Document title updated successfully!");
      } catch (error) {
        console.error("Error updating document title:", error);
        // Revert on error
        setEditingTitle(title);
      } finally {
        setIsSaving(false);
      }
    } else {
      // For new documents, just update local state
      onTitleChange(newTitle);
    }

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTitle(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleBlur = () => {
    // Small delay to allow clicking save button if needed
    setTimeout(() => {
      if (isEditing) {
        handleSaveTitle();
      }
    }, 100);
  };

  const displayTitle = title || generateDocumentTitle(documentContent);

  return (
    <div className="w-full max-w-[8.5in] mx-auto px-4 py-3 bg-white">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center flex-1 max-w-lg">
            <input
              ref={inputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="text-lg font-medium text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none px-1 py-1 flex-1 min-w-0"
              placeholder="Enter document title"
              disabled={isSaving}
            />
            <div className="flex items-center ml-3 space-x-2">
              <button
                onClick={handleSaveTitle}
                disabled={isSaving || !editingTitle.trim()}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartEditing}
            disabled={disabled}
            className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-none outline-none p-1 rounded hover:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900 max-w-lg truncate text-left"
            title={
              disabled
                ? "Sign in to edit document title"
                : "Click to edit title"
            }
          >
            {displayTitle}
          </button>
        )}

        {/* Document status indicator */}
        <div className="flex items-center text-xs text-gray-500">
          {currentDocumentId ? (
            <div className="flex items-center">
              <svg
                className="w-3 h-3 mr-1 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Saved to cloud
            </div>
          ) : (
            <div className="flex items-center">
              <svg
                className="w-3 h-3 mr-1 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Not saved
            </div>
          )}
        </div>
      </div>

      {/* Subtle divider */}
      <div className="border-b border-gray-200 mt-3"></div>
    </div>
  );
};

export default DocumentTitle;
