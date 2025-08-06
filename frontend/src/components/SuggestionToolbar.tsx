import React from "react";
import styles from "./SuggestionToolbar.module.css";

interface SuggestionToolbarProps {
  onAccept: () => void;
  onReject: () => void;
  intent?: "replace" | "add_after" | "add_before";
  hasActiveSuggestion?: boolean;
}

const SuggestionToolbar: React.FC<SuggestionToolbarProps> = ({
  onAccept,
  onReject,
  intent,
  hasActiveSuggestion = false,
}) => {
  const handleAccept = () => {
    try {
      onAccept();
    } catch (error) {
      console.error("Error accepting suggestion:", error);
    }
  };

  const handleReject = () => {
    try {
      onReject();
    } catch (error) {
      console.error("Error rejecting suggestion:", error);
    }
  };

  return (
    <div className={styles.toolbar} aria-live="polite">
      <button
        onClick={handleAccept}
        className={`${styles.button} ${styles.accept}`}
        title={`Accept suggestion (${intent || "replace"})`}
        disabled={!hasActiveSuggestion}
      >
        ✓
      </button>
      <button
        onClick={handleReject}
        className={`${styles.button} ${styles.reject}`}
        title="Reject suggestion"
        disabled={!hasActiveSuggestion}
      >
        ✕
      </button>
    </div>
  );
};

export default SuggestionToolbar;
