import React, { useState, useRef, useEffect } from "react";
import styles from "./KnowledgeBase.module.css";

interface UploadedSource {
  id: string;
  name: string;
  type: "pdf";
  size: number;
  uploadDate: Date;
  isSelected: boolean;
  file: File;
  isExternal?: boolean; // Added from chatbot
}

interface KnowledgeBaseProps {
  onFileUpload?: (files: File[]) => void;
  onSelectedSourcesChange?: (selectedFiles: File[]) => void;
  externalFiles?: File[];
}

const KnowledgeBase = ({
  onFileUpload,
  onSelectedSourcesChange,
  externalFiles = [],
}: KnowledgeBaseProps) => {
  const [sources, setSources] = useState<UploadedSource[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newSources: UploadedSource[] = [];
    const fileArray = Array.from(files);
    const newUploadingFiles = new Set<string>();
    const duplicateFiles: string[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach((file) => {
      // Check if file is PDF
      const isPdf = file.type === "application/pdf";

      if (!isPdf) {
        invalidFiles.push(file.name);
        return;
      }

      // Check for duplicates
      const isDuplicate = sources.some(
        (source) => source.name === file.name && source.size === file.size,
      );

      if (isDuplicate) {
        duplicateFiles.push(file.name);
        return;
      }

      // File is valid and not duplicate
      const newSource: UploadedSource = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        name: file.name,
        type: "pdf",
        size: file.size,
        uploadDate: new Date(),
        isSelected: false,
        file: file,
        isExternal: false, // Directly uploaded to KnowledgeBase
      };
      newSources.push(newSource);
      newUploadingFiles.add(file.name);
    });

    // Show user feedback for issues
    if (duplicateFiles.length > 0 || invalidFiles.length > 0) {
      const messages = [];
      if (duplicateFiles.length > 0) {
        messages.push(`Duplicate file`);
      }
      if (invalidFiles.length > 0) {
        messages.push(
          `Invalid files (only PDF supported): ${invalidFiles.join(", ")}`,
        );
      }

      const fullMessage = messages.join(" | ");
      setNotification(fullMessage);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }

    if (newSources.length > 0) {
      // Set uploading state for new files
      setUploadingFiles(newUploadingFiles);

      // Add sources to state
      setSources((prev) => [...prev, ...newSources]);

      // Call parent callback with only valid, non-duplicate files
      onFileUpload?.(newSources.map((source) => source.file));

      // Clear uploading state after a delay to simulate processing
      setTimeout(() => {
        setUploadingFiles(new Set());
      }, 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // Use useEffect to add external files (from chatbot) to sources
  useEffect(() => {
    if (externalFiles.length > 0) {
      const newSources: UploadedSource[] = [];

      externalFiles.forEach((file) => {
        // Check if file already exists in sources
        const fileExists = sources.some(
          (source) => source.name === file.name && source.size === file.size,
        );

        if (!fileExists && file.type === "application/pdf") {
          const newSource: UploadedSource = {
            id:
              Math.random().toString(36).substring(2) + Date.now().toString(36),
            name: file.name,
            type: "pdf",
            size: file.size,
            uploadDate: new Date(),
            isSelected: false, // Don't auto-select external files
            file: file,
            isExternal: true, // Mark as external (from chatbot)
          };
          newSources.push(newSource);
        }
      });

      if (newSources.length > 0) {
        setSources((prev) => [...prev, ...newSources]);
      }
    }
  }, [externalFiles, sources]);

  // Use useEffect to notify parent of selected sources changes
  useEffect(() => {
    const selectedFiles = sources
      .filter((source) => source.isSelected)
      .map((source) => source.file);
    onSelectedSourcesChange?.(selectedFiles);
  }, [sources, onSelectedSourcesChange]);

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id));
  };

  const toggleSourceSelection = (id: string) => {
    setSources((prev) =>
      prev.map((source) =>
        source.id === id
          ? { ...source, isSelected: !source.isSelected }
          : source,
      ),
    );
  };

  const truncateFilename = (
    filename: string,
    maxLength: number = 25,
  ): string => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.substring(filename.lastIndexOf("."));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 3,
    );

    return `${truncatedName}...${extension}`;
  };

  return (
    <div className={styles.sourcesContainer}>
      {/* Notification */}
      {notification && (
        <div className={styles.notification}>
          <span className={styles.notificationText}>{notification}</span>
          <button
            className={styles.notificationClose}
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Knowledge Base</h3>
        <div
          className={`${styles.compactUploadArea} ${isDragOver ? styles.dragOver : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <svg
            className={styles.compactUploadIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className={styles.compactUploadText}>Add Sources</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />

      {/* Sources List */}
      <div
        className={`${styles.sourcesList} ${isDragOver ? styles.dragOver : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No sources uploaded yet</p>
            <p className={styles.emptySubtext}>
              Drop PDF files here to get started
            </p>
          </div>
        ) : (
          sources.map((source) => {
            const isUploading = uploadingFiles.has(source.name);
            return (
              <div key={source.id} className={styles.sourceItem}>
                <div className={styles.sourceIcon}>
                  {isUploading ? (
                    <div className={styles.loadingSpinner}>
                      <svg
                        className={styles.spinnerIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className={styles.spinnerCircle}
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="32"
                          strokeDashoffset="32"
                        />
                      </svg>
                    </div>
                  ) : (
                    <svg
                      className={styles.pdfIcon}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                    </svg>
                  )}
                </div>
                <div className={styles.sourceInfo}>
                  <p className={styles.sourceName} title={source.name}>
                    {truncateFilename(source.name)}
                    {source.isExternal && (
                      <span
                        className={styles.externalBadge}
                        title="Added from chatbot"
                      >
                        📤
                      </span>
                    )}
                  </p>
                </div>
                <div className={styles.sourceActions}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={source.isSelected}
                      onChange={() => toggleSourceSelection(source.id)}
                      className={styles.checkbox}
                      disabled={isUploading}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeSource(source.id)}
                    title="Remove source"
                    disabled={isUploading}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
