import React from 'react';
import styles from './SaveButton.module.css';

interface SaveButtonProps {
  onSave: () => void;
  disabled?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ onSave, disabled = false }) => {
  return (
    <button
      className={styles.saveButton}
      onClick={onSave}
      disabled={disabled}
      title="Save as Markdown"
      aria-label="Save document as markdown file"
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
  );
};

export default SaveButton; 