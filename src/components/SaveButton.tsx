import React, { useState, useRef, useEffect } from "react";
import styles from "./SaveButton.module.css";

export type SaveFormat = "markdown" | "docx" | "pdf";

interface SaveButtonProps {
  onSave: (format: SaveFormat, filename: string) => void;
  disabled?: boolean;
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: SaveFormat, filename: string) => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave }) => {
  const [filename, setFilename] = useState("document");
  const [format, setFormat] = useState<SaveFormat>("markdown");
  const modalRef = useRef<HTMLDivElement>(null);
  const filenameInputRef = useRef<HTMLInputElement>(null);

  // Focus filename input when modal opens
  useEffect(() => {
    if (isOpen && filenameInputRef.current) {
      filenameInputRef.current.focus();
      filenameInputRef.current.select();
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
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
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
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
      case "markdown": return ".md";
      case "docx": return ".docx";
      case "pdf": return ".pdf";
      default: return ".md";
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3>Save Document</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.inputGroup}>
            <label htmlFor="filename">File Name:</label>
            <div className={styles.filenameContainer}>
              <input
                ref={filenameInputRef}
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
              <option value="markdown">Markdown (.md)</option>
              <option value="docx">Word Document (.docx)</option>
              <option value="pdf">PDF Document (.pdf)</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!filename.trim()}
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              Save
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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleModalSave = (format: SaveFormat, filename: string) => {
    onSave(format, filename);
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
          disabled={disabled}
          title="Save document"
          aria-label="Save document"
        >
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
          <span>Save</span>
        </button>
      </div>

      <SaveModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </>
  );
};

export default SaveButton;
