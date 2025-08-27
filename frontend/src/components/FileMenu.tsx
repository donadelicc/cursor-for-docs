import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, updateDocument, generateDocumentTitle, updateProjectDocument } from '@/utils/firestore';
import { SaveFormat } from './SaveButton';

interface FileMenuProps {
  onSave: (format: SaveFormat, filename: string) => void;
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  documentContent: string;
  currentDocumentId?: string;
  currentDocumentTitle?: string;
  // New props for project saving
  projectId?: string;
  activeDocumentId?: string;
  onProjectSave?: () => void; // Callback to notify parent that save completed
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: SaveFormat, filename: string) => void;
  onCloudSave: (title: string) => void;
  documentContent: string;
  mode: 'new' | 'copy' | 'export';
}

const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onCloudSave,
  documentContent,
  mode,
}) => {
  const [filename, setFilename] = useState('document');
  const [format, setFormat] = useState<SaveFormat>('pdf');
  const [documentTitle, setDocumentTitle] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate default title from content when modal opens
  useEffect(() => {
    if (isOpen && !documentTitle) {
      const defaultTitle = generateDocumentTitle(documentContent);
      setDocumentTitle(mode === 'copy' ? `Copy of ${defaultTitle}` : defaultTitle);
    }
  }, [isOpen, documentContent, documentTitle, mode]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

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
    if (mode === 'export') {
      if (filename.trim()) {
        onSave(format, filename.trim());
        onClose();
      }
    } else {
      if (documentTitle.trim()) {
        onCloudSave(documentTitle.trim());
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

  const getModalTitle = () => {
    switch (mode) {
      case 'copy':
        return 'Save as Copy';
      case 'export':
        return 'Export Document';
      default:
        return 'Save Document';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" ref={modalRef}>
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{getModalTitle()}</h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {mode === 'export' ? (
            <>
              <div className="mb-4">
                <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
                  File Name:
                </label>
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <input
                    ref={inputRef}
                    type="text"
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 px-3 py-2 outline-none"
                    placeholder="Enter filename"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-50 text-gray-600 text-sm border-l">
                    {getFileExtension()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                  Format:
                </label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as SaveFormat)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="markdown">Markdown (.md)</option>
                </select>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <label
                htmlFor="documentTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Title:
              </label>
              <input
                ref={inputRef}
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter document title"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'export' ? !filename.trim() : !documentTitle.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'export' ? 'Export' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FileMenu: React.FC<FileMenuProps> = ({
  onSave,
  onUpload,
  disabled = false,
  documentContent,
  currentDocumentId,
  currentDocumentTitle,
  projectId,
  activeDocumentId,
  onProjectSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'new' | 'copy' | 'export';
  }>({ isOpen: false, mode: 'new' });
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSave = async () => {
    if (!currentUser || !documentContent) return;

    setIsSaving(true);
    try {
      if (projectId && activeDocumentId) {
        // Save to PROJECT documents (new structure)
        console.log('💾 [Manual Save] Saving to project document...', {
          projectId,
          activeDocumentId,
          contentLength: documentContent.length
        });
        
        await updateProjectDocument(projectId, activeDocumentId, {
          content: documentContent,
        });
        
        console.log('✅ [Manual Save] SUCCESS! Document saved to project');
        onProjectSave?.(); // Notify parent component
      } else if (currentDocumentId && currentDocumentTitle) {
        // Fallback: Save to legacy documents (old structure)
        await updateDocument(currentDocumentId, {
          title: currentDocumentTitle,
          content: documentContent,
          lastModified: new Date(),
        });
        console.log('Document saved successfully to legacy structure!');
      } else {
        // For new documents, open the save modal
        setModalState({ isOpen: true, mode: 'new' });
      }
    } catch (error) {
      console.error('❌ [Manual Save] Error saving document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file).catch(console.error);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleCloudSave = async (title: string) => {
    if (!currentUser || !documentContent) return;

    setIsSaving(true);
    try {
      if (modalState.mode === 'copy' || !currentDocumentId) {
        // Create new document (either copy or new)
        await createDocument({
          userId: currentUser.uid,
          title,
          content: documentContent,
        });
      } else {
        // Update existing document
        await updateDocument(currentDocumentId, {
          title,
          content: documentContent,
          lastModified: new Date(),
        });
      }
      console.log('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalSave = (format: SaveFormat, filename: string) => {
    onSave(format, filename);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>File</span>
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[1100]">
            {/* Save Section */}
            <div className="py-1">
              <button
                onClick={() => {
                  handleQuickSave();
                  setIsOpen(false);
                }}
                disabled={!currentUser || isSaving}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="mr-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                {isSaving ? 'Saving...' : currentDocumentId ? 'Save' : 'Save to Cloud'}
              </button>

              {currentDocumentId && (
                <button
                  onClick={() => {
                    setModalState({ isOpen: true, mode: 'copy' });
                    setIsOpen(false);
                  }}
                  disabled={!currentUser}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg
                    className="mr-3 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Save as Copy
                </button>
              )}
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Import Section */}
            <div className="py-1">
              <label className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <svg className="mr-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Import Document
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Export Section */}
            <div className="py-1">
              <button
                onClick={() => {
                  setModalState({ isOpen: true, mode: 'export' });
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg className="mr-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export as...
              </button>
            </div>
          </div>
        )}
      </div>

      <SaveModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'new' })}
        onSave={handleModalSave}
        onCloudSave={handleCloudSave}
        documentContent={documentContent}
        mode={modalState.mode}
      />
    </>
  );
};

export default FileMenu;
