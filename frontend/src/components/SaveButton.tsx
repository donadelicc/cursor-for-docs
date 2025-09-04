import React, { useState, useRef, useEffect } from 'react';
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
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] animate-[fadeIn_0.2s_ease]">
      <div
        className="bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-[90%] max-w-md animate-[slideIn_0.2s_ease]"
        ref={modalRef}
      >
        <div className="flex justify-between items-center px-6 pt-5 pb-0 border-b border-gray-100 mb-5">
          <h3 className="m-0 text-lg font-semibold text-gray-800">Save Document</h3>
          <button
            className="bg-none border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-100 hover:text-gray-800"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Save Mode Selection */}
          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-800 text-sm">Save Option:</label>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none bg-transparent text-gray-600 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 ${saveMode === 'cloud' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : ''}`}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none bg-transparent text-gray-600 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 ${saveMode === 'export' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : ''}`}
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
            <div className="mb-5">
              <label
                htmlFor="documentTitle"
                className="block mb-2 font-medium text-gray-800 text-sm"
              >
                Document Title:
              </label>
              <input
                ref={inputRef}
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-sm outline-none transition-colors duration-200 text-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                placeholder="Enter document title"
                required
              />
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label htmlFor="filename" className="block mb-2 font-medium text-gray-800 text-sm">
                  File Name:
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden transition-colors duration-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10">
                  <input
                    ref={inputRef}
                    type="text"
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 border-none py-3 px-4 text-sm outline-none bg-transparent text-black"
                    placeholder="Enter filename"
                    required
                  />
                  <span className="py-3 px-4 bg-gray-50 text-gray-600 text-sm font-medium border-l border-gray-200">
                    {getFileExtension()}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="format" className="block mb-2 font-medium text-gray-800 text-sm">
                  Format:
                </label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as SaveFormat)}
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-sm bg-white text-black cursor-pointer transition-colors duration-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="markdown">Markdown (.md)</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 border-2 border-gray-200 bg-white text-gray-600 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none rounded-lg py-3 px-4 text-sm font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-600/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/60 active:translate-y-0 active:shadow-lg active:shadow-indigo-600/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg disabled:shadow-indigo-600/20"
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
      <div className="relative flex">
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none rounded-lg py-3 px-4 text-sm font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-600/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/60 active:translate-y-0 active:shadow-lg active:shadow-indigo-600/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg disabled:shadow-indigo-600/20 md:py-2.5 md:px-3.5 md:text-xs md:gap-1.5 md:min-h-[40px]"
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
              className="animate-spin md:w-[18px] md:h-[18px]"
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
              className="md:w-[18px] md:h-[18px]"
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
