import React from "react";
import { AutoSaveStatus } from "@/hooks/useAutoSave";
import styles from "./AutoSaveIndicator.module.css";

interface AutoSaveIndicatorProps {
  autoSaveStatus: AutoSaveStatus;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  autoSaveStatus,
  className = "",
}) => {
  const { status, lastSaved, error } = autoSaveStatus;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "saving":
        return (
          <svg
            className={styles.spinningIcon}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        );
      case "saved":
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        );
      case "error":
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "saving":
        return "Saving...";
      case "saved":
        return lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : "Saved";
      case "error":
        return error || "Save failed";
      default:
        return "";
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case "saving":
        return styles.saving;
      case "saved":
        return styles.saved;
      case "error":
        return styles.error;
      default:
        return styles.idle;
    }
  };

  if (status === "idle") return null;

  return (
    <div
      className={`${styles.autoSaveIndicator} ${getStatusClass()} ${className}`}
    >
      {getStatusIcon()}
      <span className={styles.statusText}>{getStatusText()}</span>
    </div>
  );
};

export default AutoSaveIndicator;
