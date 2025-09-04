import React, { useState, useRef, useEffect } from 'react';
import { SaveFormat } from './SaveButton';

interface ExportProps {
  onSave: (format: SaveFormat, filename: string) => void;
  disabled?: boolean;
  documentContent: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: SaveFormat, filename: string) => void;
  documentContent: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onSave }) => {
  const [filename, setFilename] = useState('document');
  const [format, setFormat] = useState<SaveFormat>('pdf');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (filename.trim()) {
      onSave(format, filename.trim());
      onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200]">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
        ref={modalRef}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Document
          </h3>
          <button
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="filename"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              File Name:
            </label>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-700">
              <input
                ref={inputRef}
                type="text"
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 px-3 py-2 outline-none bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="Enter filename"
                required
              />
              <span className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-sm border-l border-gray-300 dark:border-gray-600">
                {getFileExtension()}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="format"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Format:
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as SaveFormat)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="pdf">PDF Document (.pdf)</option>
              <option value="docx">Word Document (.docx)</option>
              <option value="markdown">Markdown (.md)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!filename.trim()}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Export: React.FC<ExportProps> = ({ onSave, disabled = false, documentContent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = (format: SaveFormat, filename: string) => {
    onSave(format, filename);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
        title="Export document"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleExport}
        documentContent={documentContent}
      />
    </>
  );
};

export default Export;
