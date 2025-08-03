import React, { useState, useRef } from "react";
import styles from "./KnowledgeBase.module.css";

interface UploadedSource {
  id: string;
  name: string;
  type: "pdf" | "docx";
  size: number;
  uploadDate: Date;
}

interface KnowledgeBaseProps {
  onFileUpload?: (files: File[]) => void;
}

const KnowledgeBase = ({ onFileUpload }: KnowledgeBaseProps) => {
  const [sources, setSources] = useState<UploadedSource[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newSources: UploadedSource[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      // Check if file is PDF or DOCX
      const isPdf = file.type === "application/pdf";
      const isDocx =
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (isPdf || isDocx) {
        const newSource: UploadedSource = {
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: file.name,
          type: isPdf ? "pdf" : "docx",
          size: file.size,
          uploadDate: new Date(),
        };
        newSources.push(newSource);
      }
    });

    if (newSources.length > 0) {
      setSources((prev) => [...prev, ...newSources]);
      onFileUpload?.(
        fileArray.filter(
          (file) =>
            file.type === "application/pdf" ||
            file.type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      );
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id));
  };

  return (
    <div className={styles.sourcesContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Knowledge Base</h3>
        <span className={styles.count}>{sources.length}</span>
      </div>

      {/* Upload Area */}
      <div
        className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.uploadContent}>
          <svg
            className={styles.uploadIcon}
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
          <p className={styles.uploadText}>
            Drag & drop PDF or DOCX files here, or{" "}
            <button className={styles.uploadButton} onClick={handleButtonClick}>
              browse
            </button>
          </p>
          <p className={styles.uploadSubtext}>PDF and DOCX files only</p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />

      {/* Sources List */}
      <div className={styles.sourcesList}>
        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No sources uploaded yet</p>
          </div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className={styles.sourceItem}>
              <div className={styles.sourceIcon}>
                {source.type === "pdf" ? (
                  <svg
                    className={styles.pdfIcon}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                  </svg>
                ) : (
                  <svg
                    className={styles.docxIcon}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16.5 18.5h-9v-1h9v1zm0-2.5h-9v-1h9v1zm0-2.5h-9v-1h9v1zM14 9V4l5 5h-5z" />
                  </svg>
                )}
              </div>
              <div className={styles.sourceInfo}>
                <p className={styles.sourceName}>{source.name}</p>
                <p className={styles.sourceDetails}>
                  {formatFileSize(source.size)} •{" "}
                  {formatDate(source.uploadDate)}
                </p>
              </div>
              <button
                className={styles.removeButton}
                onClick={() => removeSource(source.id)}
                title="Remove source"
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
          ))
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
