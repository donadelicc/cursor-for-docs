import React, { useState, useRef, useEffect } from 'react';

interface UnifiedSource {
  id: string;
  name: string;
  type: 'pdf' | 'docx';
  size: number;
  uploadDate: Date;
  isSelected: boolean;
  file?: File; // For newly uploaded/external files
  storagePath?: string; // For stored files from Firestore
  sourceType: 'local' | 'stored' | 'external'; // Track source origin
  isUploading?: boolean; // Loading state
}

// New type to handle both File objects and stored source references
export interface SourceSelection {
  type: 'file' | 'stored';
  file?: File;
  storedSource?: { id: string; name: string; storagePath: string };
}

interface KnowledgeBaseProps {
  onFileUpload?: (files: File[]) => void;
  onSelectedSourcesChange?: (selections: SourceSelection[]) => void; // Changed to handle both types
  externalFiles?: File[];
  onExternalFileRemove?: (file: File) => void;
  currentAttachedCount?: number; // Current count of files attached to chatbot
  onOpenSource?: (file: File) => void;
  documents?: { id: string; title: string }[];
  onCreateDocument?: () => void;
  onOpenDocument?: (id: string) => void;
  onRenameDocument?: (id: string, newTitle: string) => void;
  onDeleteDocument?: (id: string) => void;
  storedSources?: { id: string; name: string; storagePath: string }[];
  onOpenStoredSource?: (name: string, storagePath: string) => void;
  onDeleteStoredSource?: (id: string, storagePath: string) => void;
  // New callback for DOCX to document conversion
  onConvertDocxToDocument?: (file: File, filename: string) => Promise<void>;
  // New callback for converting documents to sources
  onConvertDocumentToSource?: (docId: string, docTitle: string) => Promise<void>;
  // New callbacks for deleted items management
  deletedItems?: { id: string; name: string; type: 'document' | 'source'; deletedAt: Date }[];
  onRestoreItem?: (deletedItemId: string) => Promise<void>;
  onPermanentlyDeleteItem?: (deletedItemId: string) => Promise<void>;
}

const KnowledgeBase = ({
  onFileUpload,
  onSelectedSourcesChange,
  externalFiles = [],
  onExternalFileRemove,
  currentAttachedCount = 0,
  onOpenSource,
  documents = [],
  onCreateDocument,
  onOpenDocument,
  onRenameDocument,
  onDeleteDocument,
  storedSources = [],
  onOpenStoredSource,
  onDeleteStoredSource,
  onConvertDocxToDocument,
  onConvertDocumentToSource,
  deletedItems = [],
  onRestoreItem,
  onPermanentlyDeleteItem,
}: KnowledgeBaseProps) => {
  const [allSources, setAllSources] = useState<UnifiedSource[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocValue, setEditingDocValue] = useState('');

  const [showDeletedItems, setShowDeletedItems] = useState(false);
  const fileRegistryRef = useRef<Map<string, File>>(new Map()); // Keep track of uploaded files
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const validPdfFiles: File[] = [];
    const validDocxFiles: File[] = [];
    const fileArray = Array.from(files);
    const duplicateFiles: string[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach((file) => {
      // Check if file is PDF, DOCX, HTML, or Markdown
      const isPdf = file.type === 'application/pdf';
      const isDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx');
      const isHtml = file.type === 'text/html' || file.name.toLowerCase().endsWith('.html');
      const isMarkdown = file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md');

      if (!isPdf && !isDocx && !isHtml && !isMarkdown) {
        invalidFiles.push(file.name);
        return;
      }

      // Check for duplicates across all sources (for non-DOCX files since DOCX become documents)
      if (isPdf || isHtml || isMarkdown) {
        const isDuplicate = allSources.some(
          (source) => source.name === file.name && source.size === file.size,
        );

        if (isDuplicate) {
          duplicateFiles.push(file.name);
          return;
        }
        validPdfFiles.push(file); // Treat HTML and Markdown as sources like PDFs
      } else if (isDocx) {
        validDocxFiles.push(file);
      }
    });

    // Show user feedback for issues
    if (duplicateFiles.length > 0 || invalidFiles.length > 0) {
      const messages = [];
      if (duplicateFiles.length > 0) {
        messages.push(`Duplicate file`);
      }
      if (invalidFiles.length > 0) {
        messages.push(
          `Invalid files (only PDF, DOCX, HTML, and Markdown supported): ${invalidFiles.join(', ')}`,
        );
      }

      const fullMessage = messages.join(' | ');
      setNotification(fullMessage);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }

    // Handle PDF files - upload as sources
    if (validPdfFiles.length > 0) {
      // Store files in registry for later access (for chat functionality)
      validPdfFiles.forEach((file) => {
        const key = `${file.name}_${file.size}`;
        fileRegistryRef.current.set(key, file);
      });

      // Create temporary uploading sources for immediate feedback
      const tempUploadingSources: UnifiedSource[] = validPdfFiles.map((file) => ({
        id: `temp-${Math.random().toString(36).substring(2)}`,
        name: file.name,
        type: 'pdf' as const,
        size: file.size,
        uploadDate: new Date(),
        isSelected: false,
        file: file,
        sourceType: 'local',
        isUploading: true,
      }));

      // Add temporary sources to show uploading state
      setAllSources((prev) => [...prev, ...tempUploadingSources]);

      // Call parent callback - this will upload to Firestore and reload data
      onFileUpload?.(validPdfFiles);

      // Remove temporary sources after upload completes (they'll be replaced by stored sources)
      setTimeout(() => {
        setAllSources((prev) =>
          prev.filter((source) => !tempUploadingSources.some((temp) => temp.id === source.id)),
        );
      }, 3000);
    }

    // Handle DOCX files - convert to documents immediately
    if (validDocxFiles.length > 0 && onConvertDocxToDocument) {
      for (const file of validDocxFiles) {
        const filename = file.name; // Keep full filename with .docx extension
        try {
          await onConvertDocxToDocument(file, filename);
          console.log('✅ [DOCX Upload] Converted to document:', filename);
        } catch (error) {
          console.error('❌ [DOCX Upload] Error converting file:', file.name, error);
        }
      }
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

  // Unified effect to manage all source types (stored, external, local)
  useEffect(() => {
    const updatedSources: UnifiedSource[] = [];

    // 1. Process stored sources from Firestore
    storedSources.forEach((storedSource) => {
      const existingStored = allSources.find(
        (existing) =>
          existing.sourceType === 'stored' && existing.storagePath === storedSource.storagePath,
      );

      if (existingStored) {
        updatedSources.push(existingStored);
      } else {
        const fileKey = `${storedSource.name}_0`;
        let registryFile = fileRegistryRef.current.get(fileKey);
        if (!registryFile) {
          for (const [key, file] of fileRegistryRef.current.entries()) {
            if (key.startsWith(`${storedSource.name}_`)) {
              registryFile = file;
              break;
            }
          }
        }

        // Determine file type from name/extension
        const isPdf = storedSource.name.toLowerCase().endsWith('.pdf');
        const isDocx = storedSource.name.toLowerCase().endsWith('.docx');
        const isHtml = storedSource.name.toLowerCase().endsWith('.html');
        const isMarkdown = storedSource.name.toLowerCase().endsWith('.md');

        // Determine the display type
        let displayType: 'pdf' | 'docx' = 'pdf'; // Default for backwards compatibility
        if (isPdf) displayType = 'pdf';
        else if (isDocx || isHtml || isMarkdown) displayType = 'docx'; // Use docx icon for document-like files

        updatedSources.push({
          id: storedSource.id,
          name: storedSource.name,
          type: displayType,
          size: registryFile?.size || 0,
          uploadDate: new Date(),
          isSelected: false,
          storagePath: storedSource.storagePath,
          sourceType: 'stored',
          file: registryFile,
        });
      }
    });

    // 2. Add external files from chatbot (auto-selected) – preserve existing entries if present
    externalFiles.forEach((file) => {
      // Handle PDF, HTML, and Markdown files as external files - DOCX files are converted to documents
      const isPdf = file.type === 'application/pdf';
      const isHtml = file.type === 'text/html' || file.name.toLowerCase().endsWith('.html');
      const isMarkdown = file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md');
      if (!isPdf && !isHtml && !isMarkdown) return;
      const existingExternal = allSources.find(
        (existing) =>
          existing.sourceType === 'external' &&
          existing.name === file.name &&
          existing.size === file.size,
      );
      if (existingExternal) {
        updatedSources.push(existingExternal);
      } else {
        // Determine display type for external files
        let externalDisplayType: 'pdf' | 'docx' = 'pdf';
        if (isPdf) externalDisplayType = 'pdf';
        else if (isHtml || isMarkdown) externalDisplayType = 'docx'; // Use docx icon for document-like files

        updatedSources.push({
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: file.name,
          type: externalDisplayType,
          size: file.size,
          uploadDate: new Date(),
          isSelected: true,
          file: file,
          sourceType: 'external',
        });
      }
    });

    // 3. Keep temporary uploading sources (they'll be cleaned up by timeout)
    const tempSources = allSources.filter(
      (source) => source.sourceType === 'local' && source.isUploading,
    );
    updatedSources.push(...tempSources);

    // Update state only if content actually changed (by reference and order)
    const isSameByReference =
      updatedSources.length === allSources.length &&
      updatedSources.every((src, idx) => src === allSources[idx]);
    if (!isSameByReference) {
      setAllSources(updatedSources);
    }
  }, [storedSources, externalFiles, allSources]); // fileRegistry intentionally excluded to avoid infinite loop

  // Use useEffect to notify parent of selected sources changes
  useEffect(() => {
    const selections: SourceSelection[] = [];

    for (const source of allSources.filter((s) => s.isSelected)) {
      if (source.file) {
        // Source has a File object (local/external sources)
        selections.push({
          type: 'file',
          file: source.file,
        });
      } else if (source.sourceType === 'stored' && source.storagePath) {
        // Stored source - pass reference instead of trying to download
        selections.push({
          type: 'stored',
          storedSource: {
            id: source.id,
            name: source.name,
            storagePath: source.storagePath,
          },
        });
      }
    }

    onSelectedSourcesChange?.(selections);
  }, [allSources, onSelectedSourcesChange]);

  const removeSource = (id: string) => {
    const sourceToRemove = allSources.find((source) => source.id === id);

    if (!sourceToRemove) return;

    if (sourceToRemove.sourceType === 'external' && sourceToRemove.file) {
      // Notify parent to remove from external files
      onExternalFileRemove?.(sourceToRemove.file);
    } else if (sourceToRemove.sourceType === 'stored' && sourceToRemove.storagePath) {
      // Handle stored source deletion
      onDeleteStoredSource?.(sourceToRemove.id, sourceToRemove.storagePath);
    } else {
      // Handle local source removal
      setAllSources((prev) => prev.filter((source) => source.id !== id));
    }
  };

  const toggleSourceSelection = (id: string) => {
    const sourceToToggle = allSources.find((source) => source.id === id);
    const maxAttachedFiles = 3;

    if (!sourceToToggle) return;

    if (
      sourceToToggle.sourceType === 'external' &&
      sourceToToggle.isSelected &&
      sourceToToggle.file
    ) {
      // If deselecting an external file (uploaded to chat), remove it from chat entirely
      onExternalFileRemove?.(sourceToToggle.file);
    } else {
      // Check if trying to select (not deselect) and if it would exceed the limit
      if (!sourceToToggle.isSelected && currentAttachedCount >= maxAttachedFiles) {
        setNotification('Maximum documents 3');
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNotification(null);
        }, 5000);
        return;
      }

      // Normal toggle for stored and local files
      setAllSources((prev) =>
        prev.map((source) =>
          source.id === id ? { ...source, isSelected: !source.isSelected } : source,
        ),
      );
    }
  };

  const truncateFilename = (filename: string, maxLength: number = 25): string => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);

    return `${truncatedName}...${extension}`;
  };

  // Document editing functions
  const startEditingDoc = (docId: string, currentTitle: string) => {
    setEditingDocId(docId);
    setEditingDocValue(currentTitle);
    // Focus will be handled in useEffect
  };

  const finishEditingDoc = (docId: string) => {
    if (editingDocValue.trim() && onRenameDocument) {
      onRenameDocument(docId, editingDocValue.trim());
    }
    setEditingDocId(null);
    setEditingDocValue('');
  };

  const cancelEditingDoc = () => {
    setEditingDocId(null);
    setEditingDocValue('');
  };

  const handleDocInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, docId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditingDoc(docId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingDoc();
    }
  };

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingDocId && docInputRef.current) {
      docInputRef.current.focus();
      docInputRef.current.select();
    }
  }, [editingDocId]);

  // Document delete function (no confirmation needed since it's recoverable)
  const handleDeleteDocument = (docId: string) => {
    if (onDeleteDocument) {
      onDeleteDocument(docId);
    }
  };

  // Convert document to source function
  const handleConvertToSource = async (docId: string, docTitle: string) => {
    console.log('🔧 [KnowledgeBase] Starting conversion:', { docId, docTitle });

    if (!onConvertDocumentToSource) {
      console.error('❌ [KnowledgeBase] onConvertDocumentToSource callback not provided');
      setNotification('Conversion function not available');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      console.log('🔧 [KnowledgeBase] Calling conversion function...');

      await onConvertDocumentToSource(docId, docTitle);

      console.log('✅ [KnowledgeBase] Document converted successfully:', docTitle);
    } catch (error) {
      console.error('❌ [KnowledgeBase] Error converting document:', {
        error,
        docId,
        docTitle,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setNotification(`Failed to convert "${docTitle}": ${errorMessage}`);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Restore deleted item function
  const handleRestoreItem = async (deletedItemId: string) => {
    if (!onRestoreItem) return;

    try {
      await onRestoreItem(deletedItemId);
    } catch (error) {
      console.error('❌ [Restore Item] Error restoring item:', error);
    }
  };

  // Permanently delete item function (no confirmation needed - user intent is clear)
  const handlePermanentlyDeleteItem = async (deletedItemId: string) => {
    if (!onPermanentlyDeleteItem) return;

    try {
      await onPermanentlyDeleteItem(deletedItemId);
    } catch (error) {
      console.error('❌ [Permanent Delete] Error permanently deleting item:', error);
    }
  };

  return (
    <div className="flex flex-col w-full h-full font-sans relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Notification */}
      {notification && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg p-3 flex items-center justify-between z-50 shadow-lg">
          <span className="text-sm text-yellow-800 dark:text-yellow-200 flex-1 mr-2">
            {notification}
          </span>
          <button
            className="bg-none border-none text-yellow-800 dark:text-yellow-200 cursor-pointer text-xl leading-none p-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-200 hover:bg-yellow-100 dark:hover:bg-yellow-800"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Add Files Button - Drag & Drop */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 ${isDragOver ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Files</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.html,.md"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Content Area */}
      <div
        className={`flex-1 overflow-y-auto ${isDragOver ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Documents Section */}
        {documents.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Documents
                </h3>
                <button
                  onClick={onCreateDocument}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  New
                </button>
              </div>
            </div>
            <div className="pb-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 group"
                  onDoubleClick={() => onOpenDocument?.(doc.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                    {editingDocId === doc.id ? (
                      <input
                        ref={docInputRef}
                        type="text"
                        value={editingDocValue}
                        onChange={(e) => setEditingDocValue(e.target.value)}
                        onKeyDown={(e) => handleDocInputKeyDown(e, doc.id)}
                        onBlur={() => finishEditingDoc(doc.id)}
                        className="text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0"
                        title={doc.title}
                      >
                        {truncateFilename(doc.title, 30)}
                      </span>
                    )}
                  </div>
                  {editingDocId !== doc.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        className="appearance-none border-none bg-transparent text-gray-400 dark:text-gray-500 cursor-pointer p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                        onClick={(e) => {
                          console.log('🔧 [KnowledgeBase] Convert to Source button clicked:', {
                            docId: doc.id,
                            docTitle: doc.title,
                          });
                          e.stopPropagation();
                          handleConvertToSource(doc.id, doc.title);
                        }}
                        title="Convert to Source"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                      </button>

                      <button
                        className="appearance-none border-none bg-transparent text-gray-400 dark:text-gray-500 cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingDoc(doc.id, doc.title);
                        }}
                        title="Rename document"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      <button
                        className="appearance-none border-none bg-transparent text-gray-400 dark:text-gray-500 cursor-pointer p-1 rounded hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                        title="Delete document"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Section */}
        <div>
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Sources
            </h3>
          </div>
          <div className="pb-4">
            {allSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  No sources uploaded yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  Drop PDF, DOCX, HTML, or Markdown files here to get started
                </p>
              </div>
            ) : (
              allSources.map((source) => {
                const handleSourceClick = () => {
                  // Handle all source files (PDF, HTML, Markdown) - DOCX files are converted to documents immediately
                  if (source.sourceType === 'stored' && source.storagePath) {
                    onOpenStoredSource?.(source.name, source.storagePath);
                  } else if (source.file) {
                    onOpenSource?.(source.file);
                  }
                };

                return (
                  <div
                    key={source.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                    onDoubleClick={handleSourceClick}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {source.isUploading ? (
                        <div className="w-5 h-5 flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
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
                      ) : source.type === 'pdf' ? (
                        <svg
                          className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.60v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      )}
                      <span
                        className="text-sm text-gray-800 dark:text-gray-200 truncate"
                        title={source.name}
                      >
                        {truncateFilename(source.name, 30)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={source.isSelected}
                        onChange={() => toggleSourceSelection(source.id)}
                        disabled={source.isUploading}
                        className="w-4 h-4 border-gray-300 dark:border-gray-600 rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                      />
                      {!source.isUploading && source.sourceType === 'stored' && (
                        <button
                          className="appearance-none border-none bg-transparent text-gray-400 dark:text-gray-500 cursor-pointer p-1 rounded hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSource(source.id);
                          }}
                          title="Delete source"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Deleted Section */}
        {deletedItems.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Recently Deleted
                </h3>
                <button
                  onClick={() => setShowDeletedItems(!showDeletedItems)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {showDeletedItems ? 'Hide' : `Show (${deletedItems.length})`}
                </button>
              </div>
            </div>
            {showDeletedItems && (
              <div className="pb-4">
                {deletedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.type === 'document' ? (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.60v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-sm text-gray-800 dark:text-gray-200 truncate block"
                          title={item.name}
                        >
                          {truncateFilename(item.name, 25)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Deleted {new Date(item.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="px-2 py-1 text-xs bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        onClick={() => handleRestoreItem(item.id)}
                        title="Restore item"
                      >
                        Restore
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                        onClick={() => handlePermanentlyDeleteItem(item.id)}
                        title="Permanently delete"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
