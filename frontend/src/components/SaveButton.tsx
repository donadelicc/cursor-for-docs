import React, { useState, useRef, useEffect } from 'react';
import styles from './SaveButton.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, updateDocument, generateDocumentTitle } from '@/utils/firestore';

export type SaveFormat = 'markdown' | 'docx' | 'pdf';
export type SaveMode = 'cloud' | 'export';

interface SaveButtonProps {
  onSave: (format: SaveFormat, filename: string) => void;
  disabled?: boolean;
  documentContent: string;
  currentDocumentId?: string;
  currentDocumentTitle?: string;
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: SaveFormat, filename: string) => void;
  onCloudSave: (title: string) => void;
  documentContent: string;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onCloudSave,
  documentContent,
}) => {
  const [filename, setFilename] = useState('document');
  const [format, setFormat] = useState<SaveFormat>('pdf');
  const [saveMode, setSaveMode] = useState<SaveMode>('cloud');
  const [documentTitle, setDocumentTitle] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate default title from content when modal opens
  useEffect(() => {
    if (isOpen && !documentTitle) {
      const defaultTitle = generateDocumentTitle(documentContent);
      setDocumentTitle(defaultTitle);
    }
  }, [isOpen, documentContent, documentTitle]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen, saveMode]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (saveMode === 'cloud') {
      if (documentTitle.trim()) {
        onCloudSave(documentTitle.trim());
        onClose();
      }
    } else {
      if (filename.trim()) {
        onSave(format, filename.trim());
        onClose();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const getFileExtension = () => {
    switch (format) {
      case 'pdf':
        return '.pdf';
      case 'docx':
        return '.docx';
      case 'markdown':
        return '.md';
      default:
        return '.pdf';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3>Save Document</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          {/* Save Mode Selection */}
          <div className={styles.inputGroup}>
            <label>Save Option:</label>
            <div className={styles.saveModeButtons}>
              <button
                type="button"
                className={`${styles.saveModeButton} ${saveMode === 'cloud' ? styles.active : ''}`}
                onClick={() => setSaveMode('cloud')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
                Save to Cloud
              </button>
              <button
                type="button"
                className={`${styles.saveModeButton} ${saveMode === 'export' ? styles.active : ''}`}
                onClick={() => setSaveMode('export')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export File
              </button>
            </div>
          </div>

          {saveMode === 'cloud' ? (
            <div className={styles.inputGroup}>
              <label htmlFor="documentTitle">Document Title:</label>
              <input
                ref={inputRef}
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className={styles.titleInput}
                placeholder="Enter document title"
                required
              />
            </div>
          ) : (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="filename">File Name:</label>
                <div className={styles.filenameContainer}>
                  <input
                    ref={inputRef}
                    type="text"
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className={styles.filenameInput}
                    placeholder="Enter filename"
                    required
                  />
                  <span className={styles.fileExtension}>{getFileExtension()}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="format">Format:</label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as SaveFormat)}
                  className={styles.formatSelect}
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="markdown">Markdown (.md)</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saveMode === 'cloud' ? !documentTitle.trim() : !filename.trim()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {saveMode === 'cloud' ? (
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                ) : (
                  <>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </>
                )}
              </svg>
              {saveMode === 'cloud' ? 'Save to Cloud' : 'Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  disabled = false,
  documentContent,
  currentDocumentId,
  currentDocumentTitle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuth();

  const handleSaveClick = async () => {
    // If we have an existing document, save it directly without modal
    if (currentDocumentId && currentDocumentTitle) {
      await handleCloudSave(currentDocumentTitle);
    } else {
      // For new documents, open the modal
      setIsModalOpen(true);
    }
  };

  const handleModalSave = (format: SaveFormat, filename: string) => {
    onSave(format, filename);
  };

  const handleCloudSave = async (title: string) => {
    if (!currentUser || !documentContent) return;

    setIsSaving(true);
    try {
      if (currentDocumentId) {
        // Update existing document
        await updateDocument(currentDocumentId, {
          title,
          content: documentContent,
          lastModified: new Date(),
        });
      } else {
        // Create new document
        await createDocument({
          userId: currentUser.uid,
          title,
          content: documentContent,
        });
      }

      // Show success feedback (you might want to add a toast notification here)
      console.log('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      // Show error feedback (you might want to add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={styles.saveButtonContainer}>
        <button
          className={styles.saveButton}
          onClick={handleSaveClick}
          disabled={disabled || isSaving || !currentUser}
          title={!currentUser ? 'Sign in to save documents' : 'Save document'}
          aria-label="Save document"
        >
          {isSaving ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.spinning}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          )}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      <SaveModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        onCloudSave={handleCloudSave}
        documentContent={documentContent}
      />
    </>
  );
};

export default SaveButton;
