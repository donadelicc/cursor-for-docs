import React, { useState, useRef, useEffect } from 'react';

interface UnifiedSource {
  id: string;
  name: string;
  type: 'pdf';
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
  documents?: { id: string; title: string; isMain: boolean }[];
  onCreateDocument?: () => void;
  onOpenDocument?: (id: string) => void;
  onSetMainDocument?: (id: string) => void;
  storedSources?: { id: string; name: string; storagePath: string }[];
  onOpenStoredSource?: (name: string, storagePath: string) => void;
  onDeleteStoredSource?: (id: string, storagePath: string) => void;
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
  onSetMainDocument,
  storedSources = [],
  onOpenStoredSource,
  onDeleteStoredSource,
}: KnowledgeBaseProps) => {
  const [allSources, setAllSources] = useState<UnifiedSource[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileRegistryRef = useRef<Map<string, File>>(new Map()); // Keep track of uploaded files
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    const duplicateFiles: string[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach((file) => {
      // Check if file is PDF
      const isPdf = file.type === 'application/pdf';

      if (!isPdf) {
        invalidFiles.push(file.name);
        return;
      }

      // Check for duplicates across all sources
      const isDuplicate = allSources.some(
        (source) => source.name === file.name && source.size === file.size,
      );

      if (isDuplicate) {
        duplicateFiles.push(file.name);
        return;
      }

      validFiles.push(file);
    });

    // Show user feedback for issues
    if (duplicateFiles.length > 0 || invalidFiles.length > 0) {
      const messages = [];
      if (duplicateFiles.length > 0) {
        messages.push(`Duplicate file`);
      }
      if (invalidFiles.length > 0) {
        messages.push(`Invalid files (only PDF supported): ${invalidFiles.join(', ')}`);
      }

      const fullMessage = messages.join(' | ');
      setNotification(fullMessage);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }

    if (validFiles.length > 0) {
      // Store files in registry for later access (for chat functionality)
      validFiles.forEach(file => {
        const key = `${file.name}_${file.size}`;
        fileRegistryRef.current.set(key, file);
      });

      // Create temporary uploading sources for immediate feedback
      const tempUploadingSources: UnifiedSource[] = validFiles.map(file => ({
        id: `temp-${Math.random().toString(36).substring(2)}`,
        name: file.name,
        type: 'pdf',
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
      onFileUpload?.(validFiles);

      // Remove temporary sources after upload completes (they'll be replaced by stored sources)
      setTimeout(() => {
        setAllSources((prev) => 
          prev.filter((source) => 
            !tempUploadingSources.some(temp => temp.id === source.id)
          )
        );
      }, 3000);
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
        (existing) => existing.sourceType === 'stored' && existing.storagePath === storedSource.storagePath
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

        updatedSources.push({
          id: storedSource.id,
          name: storedSource.name,
          type: 'pdf',
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
      if (file.type !== 'application/pdf') return;
      const existingExternal = allSources.find(
        (existing) =>
          existing.sourceType === 'external' &&
          existing.name === file.name &&
          existing.size === file.size,
      );
      if (existingExternal) {
        updatedSources.push(existingExternal);
      } else {
        updatedSources.push({
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: file.name,
          type: 'pdf',
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
  }, [storedSources, externalFiles]); // fileRegistry intentionally excluded to avoid infinite loop

  // Use useEffect to notify parent of selected sources changes
  useEffect(() => {
    const selections: SourceSelection[] = [];

    for (const source of allSources.filter(s => s.isSelected)) {
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

    if (sourceToToggle.sourceType === 'external' && sourceToToggle.isSelected && sourceToToggle.file) {
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

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 border-r border-gray-300 font-sans relative">
      {/* Notification */}
      {notification && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-50 border border-yellow-400 rounded-lg p-3 flex items-center justify-between z-50 shadow-lg">
          <span className="text-sm text-yellow-800 flex-1 mr-2">{notification}</span>
          <button className="bg-none border-none text-yellow-800 cursor-pointer text-xl leading-none p-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-200 hover:bg-yellow-100" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 m-0">Files</h3>
        <div
          className={`flex items-center gap-2 py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <svg
            className="w-4 h-4 text-gray-600"
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
          <span className="text-sm font-medium text-gray-700">Add Files</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Documents Section */}
      {documents.length > 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Documents</span>
            <button className="py-1 px-2 bg-blue-600 text-white border-none rounded text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-700" onClick={onCreateDocument}>
              + New
            </button>
          </div>
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                onDoubleClick={() => onOpenDocument?.(doc.id)}
              >
                <span className="text-sm text-gray-800 truncate flex-1 mr-2" title={doc.title}>
                  {doc.title}
                  {doc.isMain && (
                    <span className="ml-2 py-0.5 px-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-full" title="Main document">
                      ★
                    </span>
                  )}
                </span>
                {!doc.isMain && (
                  <button
                    className="py-1 px-2 bg-gray-200 text-gray-700 border-none rounded text-xs cursor-pointer transition-colors duration-200 hover:bg-gray-300"
                    onClick={() => onSetMainDocument?.(doc.id)}
                  >
                    Set main
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Sources List */}
      <div
        className={`flex-1 p-4 overflow-y-auto transition-colors duration-200 ${isDragOver ? 'bg-blue-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {allSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-gray-500 text-base mb-2">No sources uploaded yet</p>
            <p className="text-gray-400 text-sm">Drop PDF files here to get started</p>
          </div>
        ) : (
          allSources.map((source) => {
            const getSourceIcon = () => {
              if (source.sourceType === 'stored') return '💾';
              if (source.sourceType === 'external') return '📤';
              return null; // No badge for local files
            };

            const getSourceTooltip = () => {
              if (source.sourceType === 'stored') return 'Saved to project';
              if (source.sourceType === 'external') return 'Added from chatbot';
              return '';
            };

            const handleSourceClick = () => {
              if (source.sourceType === 'stored' && source.storagePath) {
                onOpenStoredSource?.(source.name, source.storagePath);
              } else if (source.file) {
                onOpenSource?.(source.file);
              }
            };

            return (
              <div
                key={source.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
                onDoubleClick={handleSourceClick}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {source.isUploading ? (
                    <div className="relative">
                      <svg
                        className="w-6 h-6 text-blue-600 animate-spin"
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
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={source.name}>
                    {truncateFilename(source.name)}
                    {getSourceIcon() && (
                      <span className="ml-2 text-xs" title={getSourceTooltip()}>
                        {getSourceIcon()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={source.isSelected}
                      onChange={() => toggleSourceSelection(source.id)}
                      className="sr-only"
                      disabled={source.isUploading}
                    />
                    <div className={`w-4 h-4 border-2 border-gray-300 rounded transition-colors duration-200 flex items-center justify-center ${source.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white'} ${source.isUploading ? 'opacity-50' : ''}`}>
                      {source.isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                  <button
                    className="w-6 h-6 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                    onClick={() => removeSource(source.id)}
                    title="Remove source"
                    disabled={source.isUploading}
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
