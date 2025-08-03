import React, { useState, useMemo } from "react";
import styles from "./ShortcutsInfoBox.module.css";
import { isMacOS } from "@/utils/platformDetection";

interface ShortcutItem {
  action: string;
  shortcut: string;
  description: string;
}

const getShortcuts = (isMac: boolean): ShortcutItem[] => {
  const modifier = isMac ? "Cmd" : "Ctrl";

  return [
    {
      action: "Bold",
      shortcut: `${modifier} + B`,
      description: "Make text bold",
    },
    {
      action: "Italic",
      shortcut: `${modifier} + I`,
      description: "Make text italic",
    },
    {
      action: "Heading 1",
      shortcut: `${modifier} + Shift + 1`,
      description: "Apply heading level 1",
    },
    {
      action: "Heading 2",
      shortcut: `${modifier} + Shift + 2`,
      description: "Apply heading level 2",
    },
    {
      action: "Heading 3",
      shortcut: `${modifier} + Shift + 3`,
      description: "Apply heading level 3",
    },
    {
      action: "Undo",
      shortcut: `${modifier} + Z`,
      description: "Undo last action",
    },
    {
      action: "Redo",
      shortcut: `${modifier} + Y`,
      description: "Redo last action",
    },
    {
      action: "AI Assistant (Inline)",
      shortcut: `${modifier} + K`,
      description: "Open AI assistant for selected text",
    },
    {
      action: "AI Assistant (Main)",
      shortcut: `${modifier} + L`,
      description: "Open main AI research assistant",
    },
    {
      action: "Page Break",
      shortcut: `${modifier} + Shift + P`,
      description: "Insert a page break",
    },
  ];
};

export const ShortcutsInfoBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Detect platform and get appropriate shortcuts
  const shortcuts = useMemo(() => {
    return getShortcuts(isMacOS());
  }, []);

  const toggleInfoBox = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.shortcutsContainer}>
      <button
        className={styles.infoButton}
        onClick={toggleInfoBox}
        title="Keyboard Shortcuts"
        aria-label="Toggle keyboard shortcuts info"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.infoBox}>
          <div className={styles.infoHeader}>
            <h3>Keyboard Shortcuts</h3>
            <button
              className={styles.closeButton}
              onClick={toggleInfoBox}
              aria-label="Close shortcuts info"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className={styles.shortcutsList}>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className={styles.shortcutItem}>
                <div className={styles.shortcutAction}>
                  <span className={styles.actionName}>{shortcut.action}</span>
                  <span className={styles.shortcutKeys}>
                    {shortcut.shortcut}
                  </span>
                </div>
                <p className={styles.shortcutDescription}>
                  {shortcut.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutsInfoBox;
