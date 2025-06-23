import React from 'react';
import styles from './SuggestionToolbar.module.css';

interface SuggestionToolbarProps {
  onAccept: () => void;
  onReject: () => void;
  position: { x: number; y: number } | null;
}

const SuggestionToolbar: React.FC<SuggestionToolbarProps> = ({ onAccept, onReject, position }) => {
  if (!position) {
    return null;
  }

  return (
    <div
      className={styles.toolbar}
      style={{
        left: position.x,
        top: position.y,
      }}
      aria-live="polite"
    >
      <button onClick={onAccept} className={`${styles.button} ${styles.accept}`}>
        Accept
      </button>
      <button onClick={onReject} className={`${styles.button} ${styles.reject}`}>
        Reject
      </button>
    </div>
  );
};

export default SuggestionToolbar; 