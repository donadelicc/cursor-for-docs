'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Editor } from '@tiptap/react';
import { useAuth } from '@/contexts/AuthContext';
import { updateDocument } from '@/utils/firestore';
import { AutoSaveStatus } from '@/hooks/useAutoSave';
import { SaveFormat } from './SaveButton';
import Avatar from './Avatar';
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
  onUpload,
  contextLabel = 'Document',
  onTitlePersist,
  projectId,
  activeDocumentId,
  onProjectSave,
}) => {
  const { currentUser, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayTitle =
    title || (contextLabel === 'Project' ? 'Untitled Project' : 'Untitled Document');

  const renderDocumentStatus = () => {
    if (autoSaveStatus?.status === 'saving') {
      return (
        <div className="flex items-center text-sm text-blue-600">
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
    } else if (autoSaveStatus?.status === 'saved' || currentDocumentId || (projectId && activeDocumentId)) {
      // Show "Saved" if:
      // 1. AutoSave status is 'saved' (legacy system)
      // 2. currentDocumentId exists (legacy system)
      // 3. We have both projectId and activeDocumentId (new project system with auto-save)
      return (
        <div className="flex items-center text-sm text-green-600">
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
        <div className="flex items-center text-sm text-gray-500">
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
      <header className="bg-white shadow-sm sticky top-0 z-[1050]">
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
                    className="text-lg text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-2 py-1 min-w-0 w-64"
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
                  className="text-lg text-gray-900 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-none outline-none px-2 py-1 rounded-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900 text-left truncate max-w-xs"
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
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center hover:bg-gray-50 rounded-full p-1 transition-colors"
              >
                <Avatar
                  src={currentUser?.photoURL}
                  alt={currentUser?.displayName || 'Profile'}
                  size={36}
                  className="w-9 h-9"
                  fallbackText={currentUser?.displayName || currentUser?.email || 'User'}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1100]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // TODO: Add settings functionality
                      console.log('Settings clicked');
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Formatting Toolbar - Centered */}
        {editor && (
          <div className="bg-white flex justify-center py-2">
            <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
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
