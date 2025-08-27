import React, { useRef } from 'react';
import styles from './Upload.module.css';

interface UploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const Upload: React.FC<UploadProps> = ({ onUpload, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Please select a DOCX file');
      return;
    }

    try {
      await onUpload(file);
      // Reset the input so the same file can be selected again if needed
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(
        `Error importing document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Reset the input on error too
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Upload DOCX file"
      />
      <button
        className={styles.uploadButton}
        onClick={handleUploadClick}
        disabled={disabled}
        title="Import DOCX document"
        aria-label="Import DOCX document"
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9,15 12,12 15,15" />
        </svg>
      </button>
    </>
  );
};

export default Upload;
