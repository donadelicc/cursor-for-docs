import React, { useState, useRef, useEffect } from "react";
import styles from "./SaveButton.module.css";

export type SaveFormat = "markdown" | "docx";

interface SaveButtonProps {
  onSave: (format: SaveFormat) => void;
  disabled?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  disabled = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [shouldDropUp, setShouldDropUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveClick = (format: SaveFormat) => {
    onSave(format);
    setIsDropdownOpen(false);
  };

  const handleMainButtonClick = () => {
    // Default action: save as markdown
    onSave("markdown");
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isDropdownOpen) {
      // Check if there's enough space below for the dropdown
      const buttonRect = dropdownRef.current?.getBoundingClientRect();
      if (buttonRect) {
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const dropdownHeight = 120; // Approximate height of dropdown with 2 items
        setShouldDropUp(spaceBelow < dropdownHeight);
      }
    }

    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={styles.saveButtonContainer} ref={dropdownRef}>
      <button
        className={styles.saveButton}
        onClick={handleMainButtonClick}
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

      <button
        className={styles.dropdownToggle}
        onClick={handleDropdownToggle}
        disabled={disabled}
        title="Choose save format"
        aria-label="Choose save format"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div
          className={`${styles.dropdown} ${shouldDropUp ? styles.dropup : ""}`}
        >
          <button
            className={styles.dropdownItem}
            onClick={() => handleSaveClick("markdown")}
            disabled={disabled}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Save as Markdown (.md)
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => handleSaveClick("docx")}
            disabled={disabled}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Save as Word (.docx)
          </button>
        </div>
      )}
    </div>
  );
};

export default SaveButton;
