'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Editor } from '@tiptap/react';
import { useAuth } from '@/contexts/AuthContext';
import { updateDocument } from '@/utils/firestore';
import { AutoSaveStatus } from '@/hooks/useAutoSave';
import { SaveFormat } from './SaveButton';
import UserDropdown from './UserDropdown';
import FormattingToolbar from './FormattingToolbar';

interface HeaderDocumentProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  currentDocumentId?: string;
  documentContent: string;
  autoSaveStatus?: AutoSaveStatus;
  disabled?: boolean;
  // Formatting toolbar props
  editor?: Editor | null;
  onExportSave?: (format: SaveFormat, filename: string) => void;
  onUpload?: (file: File) => Promise<void>;
  contextLabel?: 'Project' | 'Document';
  onTitlePersist?: (newTitle: string) => Promise<void>;
  // Project saving props
  projectId?: string;
  activeDocumentId?: string;
  onProjectSave?: () => void;
}

const HeaderDocument: React.FC<HeaderDocumentProps> = ({
  title,
  onTitleChange,
  currentDocumentId,
  documentContent,
  autoSaveStatus,
  disabled = false,
  editor,
  onExportSave,
  contextLabel = 'Document',
  onTitlePersist,
  projectId,
  activeDocumentId,
}) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

    if (onTitlePersist) {
      setIsSaving(true);
      try {
        await onTitlePersist(newTitle);
        onTitleChange(newTitle);
      } catch (err) {
        console.error('Error updating title:', err);
        setEditingTitle(title);
      } finally {
        setIsSaving(false);
      }
    } else if (currentDocumentId && currentUser) {
      // Save to Firestore for existing documents
      setIsSaving(true);
      try {
        await updateDocument(currentDocumentId, {
          title: newTitle,
          content: documentContent,
          lastModified: new Date(),
        });
        onTitleChange(newTitle);
        console.log('Document title updated successfully!');
      } catch (error) {
        console.error('Error updating document title:', error);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
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

  const displayTitle =
    title || (contextLabel === 'Project' ? 'Untitled Project' : 'Untitled Document');

  const renderDocumentStatus = () => {
    if (autoSaveStatus?.status === 'saving') {
      return (
        <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Saving...
        </div>
      );
    } else if (
      autoSaveStatus?.status === 'saved' ||
      currentDocumentId ||
      (projectId && activeDocumentId)
    ) {
      // Show "Saved" if:
      // 1. AutoSave status is 'saved' (legacy system)
      // 2. currentDocumentId exists (legacy system)
      // 3. We have both projectId and activeDocumentId (new project system with auto-save)
      return (
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Saved
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Not saved
        </div>
      );
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-[1050] transition-colors duration-200">
        {/* Top Row: Logo, Title, Status, User Profile */}
        <div className="flex items-center justify-between px-6 py-3 h-16">
          {/* Left: Logo, Document Title, and Save Status */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
              <Image
                src="/useful-icon.png"
                alt="Useful logo"
                width={40}
                height={40}
                className="cursor-pointer"
              />
            </Link>

            {/* Document Title */}
            <div className="flex items-center min-w-0">
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="text-lg text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-blue-500 outline-none px-2 py-1 min-w-0 w-64"
                    placeholder={
                      contextLabel === 'Project' ? 'Enter project title' : 'Enter document title'
                    }
                    disabled={isSaving}
                  />
                </div>
              ) : (
                <button
                  onClick={handleStartEditing}
                  disabled={disabled}
                  className="text-lg text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none outline-none px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900 dark:disabled:hover:text-gray-100 text-left truncate max-w-xs"
                  title={
                    disabled
                      ? `Sign in to edit ${contextLabel.toLowerCase()} title`
                      : 'Click to edit title'
                  }
                >
                  {displayTitle}
                </button>
              )}
            </div>

            {/* Document Status */}
            <div className="flex-shrink-0">{renderDocumentStatus()}</div>
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center">
            <UserDropdown showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu} />
          </div>
        </div>

        {/* Bottom Row: Formatting Toolbar - Centered */}
        {editor && (
          <div className="bg-white dark:bg-gray-800 flex justify-center py-2 transition-colors duration-200">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <FormattingToolbar
                editor={editor}
                disabled={disabled}
                onExportSave={onExportSave}
                documentContent={documentContent}
              />
            </div>
          </div>
        )}
      </header>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
};

export default HeaderDocument;
