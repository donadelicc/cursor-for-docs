import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import CollapsiblePanel from './chatbot/CollapsiblePanel';
import KnowledgeBase, { SourceSelection, UploadedImage } from './knowledgeBase/KnowledgeBase';
import MainChatbot from './chatbot/MainChatbot';
import { TiptapEditor } from './tiptap/TipTapEditor';
import PdfViewer from './knowledgeBase/PdfViewer';
import WorkspaceTabs, { OpenItem } from './WorkspaceTabs';
import ImagePreviewModal from './knowledgeBase/ImagePreviewModal';
import {
  createProject,
  getUserProjects,
  getProjectDocuments,
  createProjectDocument,
  updateProjectDocument,
  getProjectDocument,
  deleteProjectDocument,
  listProjectSources,
  uploadProjectSource,
  deleteProjectSource,
  getProjectSourceDownloadURL,
  getDeletedItems,
  restoreDeletedItem,
  permanentlyDeleteItem,
} from '@/utils/firestore';
import { ProjectDocumentMeta, ProjectSource, DeletedItem } from '@/types/projects';

interface EditorContainerProps {
  documentContent: string;
  onContentChange?: (content: string) => void;
  initialContent?: string;
  onFileUpload?: (files: File[]) => void;
  onEditorReady?: (editor: Editor) => void;
  documentTitle?: string;
  mainDocumentId?: string;
  userId?: string;
  projectId?: string; // Optional: if provided, use this project instead of auto-creating
  onActiveDocumentIdChange?: (documentId: string | undefined) => void;
}

const EditorContainer = ({
  documentContent,
  onContentChange,
  onFileUpload,
  onEditorReady,
  documentTitle,
  userId,
  projectId: providedProjectId,
  onActiveDocumentIdChange,
}: EditorContainerProps) => {
  const [selectedSources, setSelectedSources] = useState<File[]>([]);
  const [chatbotUploadedFiles, setChatbotUploadedFiles] = useState<File[]>([]);

  // Documents state removed - using project documents instead
  const [projectId, setProjectId] = useState<string | undefined>(providedProjectId);
  const [projectDocs, setProjectDocs] = useState<ProjectDocumentMeta[]>([]);
  const [projectSources, setProjectSources] = useState<ProjectSource[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  // Document state management
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(undefined);
  const [documentContents, setDocumentContents] = useState<Map<string, string>>(new Map());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentEditorRef = useRef<Editor | null>(null);

  // Track activeDocumentId changes with wrapper function
  const setActiveDocumentIdWithLogging = React.useCallback(
    (id: string | undefined) => {
      console.log('🔧 [ActiveDocumentId] Setting to:', id, 'from:', activeDocumentId);
      console.trace('🔧 [ActiveDocumentId] Call stack:');
      setActiveDocumentId(id);
      onActiveDocumentIdChange?.(id);
    },
    [activeDocumentId, onActiveDocumentIdChange],
  );

  // Track activeDocumentId changes
  React.useEffect(() => {
    console.log('🔧 [ActiveDocumentId] State changed to:', activeDocumentId);
  }, [activeDocumentId]);

  // Calculate current attached file count (same logic as MainChatbot's allUploadedFiles)
  const currentAttachedCount = [...selectedSources, ...chatbotUploadedFiles].filter(
    (file, index, self) =>
      index === self.findIndex((f) => f.name === file.name && f.size === file.size),
  ).length;

  // Auto-save function for documents (defined early to avoid hoisting issues)
  const saveDocumentContent = useCallback(
    async (documentId: string, content: string) => {
      if (!projectId || !documentId) return;

      try {
        await updateProjectDocument(projectId, documentId, { content });
        console.log('💾 Auto-saved document:', documentId);
      } catch (error) {
        console.error('❌ Failed to auto-save document:', documentId, error);
      }
    },
    [projectId],
  );

  // Handle editor ready and capture editor instance
  const handleEditorReady = useCallback(
    (editor: Editor) => {
      currentEditorRef.current = editor;
      onEditorReady?.(editor);
    },
    [onEditorReady]
  );

  // Image insertion callback for KnowledgeBase
  const handleInsertImage = useCallback(
    (imageDataUrl: string, imageName: string) => {
      const editor = currentEditorRef.current;
      if (!editor) {
        console.warn('⚠️ [Image Insert] No editor available');
        return;
      }

      try {
        editor
          .chain()
          .focus()
          .setImage({
            src: imageDataUrl,
            alt: imageName,
            title: imageName,
          })
          .run();
        console.log('✅ [Image Insert] Image inserted successfully:', imageName);
      } catch (error) {
        console.error('❌ [Image Insert] Error inserting image:', error);
      }
    },
    []
  );

  // Image preview callback for KnowledgeBase
  const handleImagePreview = useCallback(
    (image: UploadedImage | null) => {
      setPreviewImage(image);
    },
    []
  );

  // Load or create a default project for the user, then load docs and sources
  const hasInitializedProjectRef = React.useRef(false);
  React.useEffect(() => {
    const run = async () => {
      try {
        if (!userId) return;
        if (hasInitializedProjectRef.current) return; // Avoid StrictMode double-run creating duplicates
        hasInitializedProjectRef.current = true;

        console.log('🚀 [Project Init] Starting project initialization for user:', userId);

        let pid = providedProjectId;
        if (!pid) {
          console.log('📋 [Project Init] No project ID provided, getting user projects...');
          const projects = await getUserProjects(userId);
          pid = projects[0]?.id;
          if (!pid) {
            console.log('📋 [Project Init] No projects found, creating new project...');
            pid = await createProject(userId, 'My Project');
          }
        }
        console.log('📋 [Project Init] Using project ID:', pid);
        setProjectId(pid);

        console.log('📋 [Project Init] Loading project data...');
        const [docs, sources, deleted] = await Promise.all([
          getProjectDocuments(pid),
          listProjectSources(pid),
          getDeletedItems(pid),
        ]);
        setProjectDocs(docs);
        setProjectSources(sources);
        setDeletedItems(deleted);

        console.log('📋 [Project Init] Project data loaded:', {
          docsCount: docs.length,
          sourcesCount: sources.length,
        });

        // If no documents exist, create the first one
        if (docs.length === 0) {
          console.log('📋 [Project Init] No documents found, creating first document');
          const firstDocId = await createProjectDocument(pid, { title: 'Untitled', content: '' });
          const updatedDocs = await getProjectDocuments(pid);
          setProjectDocs(updatedDocs);

          // Set up the first document
          setActiveDocumentIdWithLogging(firstDocId);
          setOpenItems((prev) =>
            prev.map((item) =>
              item.id === 'document' && item.kind === 'editor'
                ? { ...item, title: 'Untitled', documentId: firstDocId }
                : item,
            ),
          );
          onContentChange?.('');
          setDocumentContents((prev) => {
            const newMap = new Map(prev);
            newMap.set(firstDocId, '');
            return newMap;
          });
        } else {
          // Load the first document (treat all documents equally)
          const firstDoc = docs[0];
          console.log('📂 [Document Loading] Loading first document:', firstDoc);

          setActiveDocumentIdWithLogging(firstDoc.id);

          try {
            const full = await getProjectDocument(pid, firstDoc.id);
            console.log('📄 [Document Loading] Retrieved document:', {
              hasDocument: !!full,
              contentLength: full?.content?.length,
            });

            if (full) {
              onContentChange?.(full.content);
              setDocumentContents((prev) => {
                const newMap = new Map(prev);
                newMap.set(firstDoc.id, full.content);
                return newMap;
              });
              setOpenItems((prev) =>
                prev.map((item) =>
                  item.id === 'document' && item.kind === 'editor'
                    ? { ...item, title: firstDoc.title, documentId: firstDoc.id }
                    : item,
                ),
              );
            }
          } catch (e) {
            console.error('❌ [Document Loading] Failed to load document:', e);
          }
        }

        console.log('✅ [Project Init] Project initialization completed successfully');
      } catch (error) {
        console.error('❌ [Project Init] Error during project initialization:', error);
      }
    };
    run().catch((e) => console.error('Project init error', e));
  }, [userId, providedProjectId, onContentChange, setActiveDocumentIdWithLogging]);

  // Workspace tabs state
  type PdfItem = OpenItem & { kind: 'pdf'; file?: File; url?: string };
  type EditorItem = OpenItem & { kind: 'editor'; documentId?: string };
  const [openItems, setOpenItems] = useState<(PdfItem | EditorItem)[]>([
    { id: 'document', kind: 'editor', title: documentTitle || 'Document' },
  ]);
  const [activeId, setActiveId] = useState<string>('document');

  const activate = useCallback(
    async (id: string) => {
      // Save current document content before switching
      if (activeDocumentId && documentContents.has(activeDocumentId)) {
        const currentContent = documentContents.get(activeDocumentId)!;
        await saveDocumentContent(activeDocumentId, currentContent);
      }

      setActiveId(id);

      // If activating a document tab, load its content
      const item = openItems.find((i) => i.id === id);
      if (item?.kind === 'editor') {
        const editorItem = item as EditorItem;
        const documentId = editorItem.documentId;

        if (documentId) {
          setActiveDocumentIdWithLogging(documentId);

          // Check if we have cached content first
          if (documentContents.has(documentId)) {
            const cachedContent = documentContents.get(documentId)!;
            onContentChange?.(cachedContent);
          } else if (projectId) {
            // Load from Firestore if not cached
            const full = await getProjectDocument(projectId, documentId);
            if (full) {
              onContentChange?.(full.content);
              // Cache the loaded content
              setDocumentContents((prev) => {
                const newMap = new Map(prev);
                newMap.set(documentId, full.content);
                return newMap;
              });
            }
          }
        }
      }
    },
    [
      openItems,
      projectId,
      onContentChange,
      setActiveDocumentIdWithLogging,
      activeDocumentId,
      documentContents,
      saveDocumentContent,
    ],
  );

  // Document actions for KnowledgeBase
  const reloadProjectData = useCallback(async () => {
    if (!projectId) return;
    const [docs, sources, deleted] = await Promise.all([
      getProjectDocuments(projectId),
      listProjectSources(projectId),
      getDeletedItems(projectId),
    ]);
    setProjectDocs(docs);
    setProjectSources(sources);
    setDeletedItems(deleted);
  }, [projectId]);

  const close = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const filtered = prev.filter((i) => i.id !== id);
        // If we're closing the active tab, switch to the first available tab or create new document
        setActiveId((currentActiveId) => {
          if (currentActiveId === id) {
            const nextTab = filtered[0];
            if (nextTab) {
              // If switching to a document tab, load its content
              if (nextTab.kind === 'editor') {
                const editorItem = nextTab as EditorItem;
                if (editorItem.documentId) {
                  const loadContent = async () => {
                    if (!projectId) return;
                    const full = await getProjectDocument(projectId, editorItem.documentId!);
                    if (full) {
                      onContentChange?.(full.content);
                      setActiveDocumentIdWithLogging(editorItem.documentId!);
                    }
                  };
                  loadContent();
                }
              }
              return nextTab.id;
            } else {
              // No tabs left, create a new document
              const createNewDoc = async () => {
                if (!projectId) return;
                const newDocId = await createProjectDocument(projectId, {
                  title: 'Untitled',
                  content: '',
                });
                setActiveDocumentIdWithLogging(newDocId);
                setOpenItems([
                  {
                    id: 'document',
                    kind: 'editor' as const,
                    title: 'Untitled',
                    documentId: newDocId,
                  },
                ]);
                onContentChange?.('');
                setDocumentContents((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(newDocId, '');
                  return newMap;
                });
                await reloadProjectData();
              };
              createNewDoc();
              return 'document';
            }
          }
          return currentActiveId;
        });
        return filtered;
      });
    },
    [projectId, onContentChange, setActiveDocumentIdWithLogging, reloadProjectData],
  );

  const openPdf = useCallback((file: File) => {
    const id = `pdf:${file.name}:${file.size}`;
    setOpenItems((prev) =>
      prev.some((i) => i.id === id) ? prev : [...prev, { id, kind: 'pdf', title: file.name, file }],
    );
    setActiveId(id);
  }, []);

  const openStoredPdf = useCallback(
    async (name: string, storagePath: string) => {
      const id = `pdf-url:${storagePath}`;
      if (!projectId) return;
      const url = await getProjectSourceDownloadURL(storagePath);
      setOpenItems((prev) =>
        prev.some((i) => i.id === id) ? prev : [...prev, { id, kind: 'pdf', title: name, url }],
      );
      setActiveId(id);
    },
    [projectId],
  );

  const activeItem = openItems.find((i) => i.id === activeId) ?? openItems[0];

  // Keep editor tab title in sync with provided documentTitle
  React.useEffect(() => {
    setOpenItems((prev) =>
      prev.map((item) =>
        item.id === 'document' && item.kind === 'editor'
          ? { ...item, title: documentTitle || 'Document' }
          : item,
      ),
    );
  }, [documentTitle]);

  // Stable props for KnowledgeBase to avoid unnecessary effects downstream
  const kbDocuments = React.useMemo(
    () => projectDocs.map((d) => ({ id: d.id, title: d.title })),
    [projectDocs],
  );
  const kbStoredSources = React.useMemo(
    () => projectSources.map((s) => ({ id: s.id, name: s.name, storagePath: s.storagePath })),
    [projectSources],
  );

  const openDocument = useCallback(
    async (id: string) => {
      const docMeta = projectDocs.find((d) => d.id === id);
      if (!docMeta || !projectId) return;

      // Check if this document is already open in any tab
      const existingTab = openItems.find((item) => {
        if (item.kind === 'editor') {
          const editorItem = item as EditorItem;
          return editorItem.documentId === id;
        }
        return false;
      });

      if (existingTab) {
        setActiveId(existingTab.id);
        return;
      }

      // Save current document before opening new one
      if (activeDocumentId && documentContents.has(activeDocumentId)) {
        const currentContent = documentContents.get(activeDocumentId)!;
        await saveDocumentContent(activeDocumentId, currentContent);
      }

      const full = await getProjectDocument(projectId, id);
      if (!full) return;

      // Create new editor tab for this document
      const docTabId = `doc:${id}`;
      setOpenItems((prev) => [
        ...prev,
        { id: docTabId, kind: 'editor' as const, title: docMeta.title, documentId: id },
      ]);
      setActiveId(docTabId);

      // Update content via callback and cache it
      onContentChange?.(full.content);
      setActiveDocumentIdWithLogging(id);
      setDocumentContents((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, full.content);
        return newMap;
      });
    },
    [
      projectDocs,
      projectId,
      onContentChange,
      setActiveDocumentIdWithLogging,
      openItems,
      activeDocumentId,
      documentContents,
      saveDocumentContent,
    ],
  );

  const createNewDocument = useCallback(async () => {
    if (!projectId) return;
    const untitledIndex = projectDocs.filter((d) => d.title.startsWith('Untitled')).length + 1;
    const title = untitledIndex === 1 ? 'Untitled' : `Untitled ${untitledIndex}`;
    const newDocId = await createProjectDocument(projectId, { title, content: '' });
    await reloadProjectData();

    // Auto-open the new document in the editor
    if (newDocId) {
      await openDocument(newDocId);
    }
  }, [projectId, projectDocs, reloadProjectData, openDocument]);

  // Handle converting DOCX files to documents immediately upon upload
  const handleConvertDocxToDocument = useCallback(
    async (file: File, filename: string) => {
      if (!projectId) return;

      try {
        // Import the DOCX content
        const { importDocxFile } = await import('@/utils/docxImporter');
        const result = await importDocxFile(file);

        // Create a new document with the imported content
        const newDocId = await createProjectDocument(projectId, {
          title: filename,
          content: result.html,
        });

        await reloadProjectData();

        // Auto-open the newly created document
        if (newDocId) {
          await openDocument(newDocId);
        }

        console.log('✅ [DOCX Import] Document created and opened:', {
          title: filename,
          docId: newDocId,
        });
      } catch (error) {
        console.error('❌ [DOCX Import] Error importing DOCX file:', error);
        throw error; // Re-throw so KnowledgeBase can handle the error
      }
    },
    [projectId, reloadProjectData, openDocument],
  );

  // Handle converting documents to sources
  const handleConvertDocumentToSource = useCallback(
    async (docId: string, docTitle: string) => {
      console.log('🔧 [EditorContainer] Starting document to source conversion:', {
        docId,
        docTitle,
        projectId,
      });

      if (!projectId) {
        console.error('❌ [EditorContainer] No project ID available');
        throw new Error('No project ID available');
      }

      try {
        console.log('🔧 [EditorContainer] Fetching document content...');
        // Get the document content
        const document = await getProjectDocument(projectId, docId);
        if (!document) {
          console.error('❌ [EditorContainer] Document not found for ID:', docId);
          throw new Error('Document not found');
        }
        console.log('🔧 [EditorContainer] Document content retrieved:', {
          title: document.title,
          contentLength: document.content.length,
          contentPreview: document.content.substring(0, 100),
        });

        // Store the HTML content as an HTML file for the source
        // This preserves the document content and can be opened properly
        console.log('🔧 [EditorContainer] Preparing HTML content for source...');
        const htmlContent = document.content;

        // Change extension to .html since we're storing HTML content
        let sourceFilename = docTitle;
        if (sourceFilename.endsWith('.docx')) {
          sourceFilename = sourceFilename.replace(/\.docx$/i, '.html');
        } else if (!sourceFilename.endsWith('.html')) {
          sourceFilename = `${sourceFilename}.html`;
        }

        console.log('🔧 [EditorContainer] Source filename will be:', sourceFilename);

        // Create a proper HTML file with UTF-8 encoding
        const htmlBlob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const file = new File([htmlBlob], sourceFilename, {
          type: 'text/html',
        });

        console.log('🔧 [EditorContainer] Created HTML file for upload:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        console.log('🔧 [EditorContainer] Uploading HTML file as source...');
        // Upload as a project source
        const uploadedSource = await uploadProjectSource(projectId, file);
        console.log('✅ [EditorContainer] HTML file uploaded as source:', uploadedSource);

        // Don't delete the original document - keep it in the Documents tab
        console.log('✅ [EditorContainer] Keeping original document in Documents tab');

        console.log('🔧 [EditorContainer] Reloading project data...');
        // Reload project data to refresh both documents and sources
        await reloadProjectData();
        console.log('✅ [EditorContainer] Project data reloaded');

        console.log('✅ [Convert to Source] Document converted to source successfully:', {
          originalTitle: docTitle,
          newSourceName: sourceFilename,
          sourceId: uploadedSource.id,
        });
      } catch (error) {
        console.error('❌ [Convert to Source] Error converting document to source:', {
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          docId,
          docTitle,
          projectId,
        });
        throw error; // Re-throw so KnowledgeBase can handle the error
      }
    },
    [projectId, reloadProjectData],
  );

  // Handle restoring deleted items
  const handleRestoreItem = useCallback(
    async (deletedItemId: string) => {
      if (!projectId) return;

      try {
        await restoreDeletedItem(projectId, deletedItemId);
        await reloadProjectData(); // Refresh the data to show restored item
      } catch (error) {
        console.error('❌ [Restore Item] Error restoring item:', error);
        throw error; // Re-throw so KnowledgeBase can handle the error
      }
    },
    [projectId, reloadProjectData],
  );

  // Handle permanently deleting items
  const handlePermanentlyDeleteItem = useCallback(
    async (deletedItemId: string) => {
      if (!projectId) return;

      try {
        await permanentlyDeleteItem(projectId, deletedItemId);
        await reloadProjectData(); // Refresh the data to remove from deleted items
      } catch (error) {
        console.error('❌ [Permanent Delete] Error permanently deleting item:', error);
        throw error; // Re-throw so KnowledgeBase can handle the error
      }
    },
    [projectId, reloadProjectData],
  );

  // Enhanced content change handler with auto-save
  const handleContentChange = useCallback(
    (content: string) => {
      // Update the main documentContent state (for HeaderDocument display)
      onContentChange?.(content);

      // Update the content map for the active document
      if (activeDocumentId) {
        setDocumentContents((prev) => {
          const newMap = new Map(prev);
          newMap.set(activeDocumentId, content);
          return newMap;
        });

        // Clear previous timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // Auto-save with debounce
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveDocumentContent(activeDocumentId, content);
        }, 2000); // 2-second debounce
      }
    },
    [activeDocumentId, onContentChange, saveDocumentContent],
  );

  const handleSelectedSourcesChange = useCallback(async (selections: SourceSelection[]) => {
    const files: File[] = [];

    // Process File objects immediately
    const fileSelections = selections.filter(
      (selection) => selection.type === 'file' && selection.file,
    );
    files.push(...fileSelections.map((selection) => selection.file!));

    // Process stored sources by downloading them via API
    const storedSelections = selections.filter((selection) => selection.type === 'stored');

    for (const selection of storedSelections) {
      if (!selection.storedSource) continue;

      try {
        console.log('🔄 Downloading stored source client-side:', selection.storedSource.name);

        // Generate download URL client-side (with user authentication context)
        const downloadURL = await getProjectSourceDownloadURL(selection.storedSource.storagePath);
        console.log('📁 Got download URL client-side');

        // Fetch the file directly using the download URL
        const response = await fetch(downloadURL);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const file = new File([arrayBuffer], selection.storedSource.name, {
          type: 'application/pdf',
        });

        console.log('✅ Successfully downloaded stored source:', file.name);
        files.push(file);
      } catch (error) {
        console.error('❌ Failed to download stored source:', selection.storedSource.name, error);
        // If it's a permission error, show a helpful message
        if (error instanceof Error && error.message.includes('unauthorized')) {
          console.error('❌ Permission denied - check Firebase Storage rules and authentication');
        }
      }
    }

    setSelectedSources(files);
  }, []);

  // Handle removing files from selectedSources
  const handleFileRemove = useCallback((fileToRemove: File) => {
    setSelectedSources((prev) =>
      prev.filter((f) => !(f.name === fileToRemove.name && f.size === fileToRemove.size)),
    );
  }, []);

  // Handle removing files from chatbotUploadedFiles (files uploaded directly to chat)
  const handleChatbotFileRemove = useCallback((fileToRemove: File) => {
    setChatbotUploadedFiles((prev) =>
      prev.filter((f) => !(f.name === fileToRemove.name && f.size === fileToRemove.size)),
    );
  }, []);

  // Handle files uploaded from chatbot - add them to KnowledgeBase
  const handleChatbotFileUpload = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) return;
      setChatbotUploadedFiles((prev) => {
        // Avoid duplicates by filtering out files that already exist
        const newFiles = files.filter(
          (newFile) =>
            !prev.some(
              (existingFile) =>
                existingFile.name === newFile.name && existingFile.size === newFile.size,
            ),
        );
        return [...prev, ...newFiles];
      });

      // Also call the original callback if needed
      onFileUpload?.(files);
      // Persist as project sources if we have a projectId
      if (projectId) {
        Promise.all(
          files.map(async (file) => {
            try {
              console.log('🔧 [EditorContainer] Uploading file to storage:', file.name);
              const result = await uploadProjectSource(projectId, file);
              console.log('✅ [EditorContainer] Successfully uploaded:', result);
              return result;
            } catch (e) {
              console.error(
                '❌ [EditorContainer] Upload to storage failed for file:',
                file.name,
                e,
              );
              // Show error to user
              alert(
                `Failed to upload ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`,
              );
              return null;
            }
          }),
        )
          .then(() => reloadProjectData())
          .catch(() => undefined);
      }
    },
    [onFileUpload, projectId, reloadProjectData],
  );

  // Handle files uploaded via KnowledgeBase (persist immediately)
  const handleKnowledgeBaseFileUpload = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) return;
      console.debug(
        '[KB Upload] received files',
        files.map((f) => ({ name: f.name, size: f.size })),
      );
      onFileUpload?.(files);
      if (!projectId) {
        console.warn('[KB Upload] missing projectId, skipping persistence');
        return;
      }
      Promise.all(
        files.map(async (file) => {
          try {
            console.log('🔧 [KnowledgeBase] Uploading file to storage:', file.name);
            const result = await uploadProjectSource(projectId, file);
            console.log('✅ [KnowledgeBase] Successfully uploaded:', result);
            return result;
          } catch (e) {
            console.error('❌ [KnowledgeBase] Upload to storage failed for file:', file.name, e);
            alert(
              `Failed to upload ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
            return null;
          }
        }),
      )
        .then(() => reloadProjectData())
        .catch((e) => console.warn('[KB Upload] reload failed', e));
    },
    [onFileUpload, projectId, reloadProjectData],
  );

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 relative transition-colors duration-200">
      {/* Main Content Container */}
      <div className="w-full max-w-screen-3xl mx-auto relative h-full p-4">
        {/* Knowledge Base Panel (Left) */}
        <div className="absolute left-4 top-4 bottom-4 z-10">
          <CollapsiblePanel
            title="Files"
            position="left"
            defaultOpen={true}
            className="h-full"
            sidebarIcons={[
              // Document icon
              <svg
                key="documents"
                className="w-5 h-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>,
              // PDF/Source icon
              <svg
                key="sources"
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
              </svg>,
            ]}
          >
            <KnowledgeBase
              projectId={projectId || ''}
              onFileUpload={handleKnowledgeBaseFileUpload}
              onSelectedSourcesChange={handleSelectedSourcesChange}
              externalFiles={chatbotUploadedFiles}
              onExternalFileRemove={handleChatbotFileRemove}
              currentAttachedCount={currentAttachedCount}
              onOpenSource={openPdf}
              documents={kbDocuments}
              onCreateDocument={createNewDocument}
              onOpenDocument={openDocument}
              onRenameDocument={async (docId: string, newTitle: string) => {
                if (!projectId) return;
                try {
                  await updateProjectDocument(projectId, docId, { title: newTitle });

                  // Update any open tabs with the new title
                  setOpenItems((prev) =>
                    prev.map((item) => {
                      if (item.kind === 'editor') {
                        const editorItem = item as EditorItem;
                        if (
                          (item.id === 'document' && editorItem.documentId === docId) ||
                          (item.id === `doc:${docId}` && editorItem.documentId === docId)
                        ) {
                          return { ...item, title: newTitle };
                        }
                      }
                      return item;
                    }),
                  );

                  // Reload project data to sync
                  await reloadProjectData();
                } catch (error) {
                  console.error('Failed to rename document:', error);
                }
              }}
              onDeleteDocument={async (docId: string) => {
                if (!projectId) return;
                try {
                  // Delete the document from Firestore
                  await deleteProjectDocument(projectId, docId);

                  // Close any open tabs for this document
                  setOpenItems((prev) => {
                    const filtered = prev.filter((item) => {
                      if (item.kind === 'editor') {
                        const editorItem = item as EditorItem;
                        return editorItem.documentId !== docId;
                      }
                      return true;
                    });

                    // If we closed the active tab, switch to the first available tab or create a new document
                    if (filtered.length !== prev.length) {
                      const currentActiveItem = prev.find((item) => item.id === activeId);
                      if (currentActiveItem && currentActiveItem.kind === 'editor') {
                        const editorItem = currentActiveItem as EditorItem;
                        if (editorItem.documentId === docId) {
                          // We're closing the active tab
                          const nextTab = filtered[0];
                          if (nextTab && nextTab.kind === 'editor') {
                            // Switch to existing tab
                            setActiveId(nextTab.id);
                            const nextEditorItem = nextTab as EditorItem;
                            if (nextEditorItem.documentId) {
                              const loadContent = async () => {
                                const full = await getProjectDocument(
                                  projectId,
                                  nextEditorItem.documentId!,
                                );
                                if (full) {
                                  onContentChange?.(full.content);
                                  setActiveDocumentIdWithLogging(nextEditorItem.documentId!);
                                }
                              };
                              loadContent();
                            }
                          } else {
                            // No other tabs, create a new document
                            const createNewDoc = async () => {
                              const newDocId = await createProjectDocument(projectId, {
                                title: 'Untitled',
                                content: '',
                              });
                              setActiveDocumentIdWithLogging(newDocId);
                              setOpenItems([
                                {
                                  id: 'document',
                                  kind: 'editor' as const,
                                  title: 'Untitled',
                                  documentId: newDocId,
                                },
                              ]);
                              setActiveId('document');
                              onContentChange?.('');
                              setDocumentContents((prev) => {
                                const newMap = new Map(prev);
                                newMap.set(newDocId, '');
                                return newMap;
                              });
                              await reloadProjectData();
                            };
                            createNewDoc();
                            return prev; // Don't update openItems here, createNewDoc will handle it
                          }
                        }
                      }
                    }

                    return filtered;
                  });

                  // Remove from document contents cache
                  setDocumentContents((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(docId);
                    return newMap;
                  });

                  // Reload project data to sync
                  await reloadProjectData();
                } catch (error) {
                  console.error('Failed to delete document:', error);
                }
              }}
              storedSources={kbStoredSources}
              onOpenStoredSource={openStoredPdf}
              onDeleteStoredSource={(id) => {
                if (!projectId) return;
                deleteProjectSource(projectId, id)
                  .then(() => reloadProjectData())
                  .catch(() => undefined);
              }}
              onConvertDocxToDocument={handleConvertDocxToDocument}
              onConvertDocumentToSource={handleConvertDocumentToSource}
              deletedItems={deletedItems.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                deletedAt: item.deletedAt,
              }))}
              onRestoreItem={handleRestoreItem}
              onPermanentlyDeleteItem={handlePermanentlyDeleteItem}
              onInsertImage={handleInsertImage}
              onImagePreview={handleImagePreview}
            />
          </CollapsiblePanel>
        </div>

        {/* Editor Panel (Center) - Fixed width and centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-4 bottom-4 w-[950px] z-20">
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <WorkspaceTabs
                items={openItems}
                activeId={activeItem.id}
                onActivate={activate}
                onClose={close}
                onRename={async (tabId: string, newTitle: string) => {
                  // Find the document ID for this tab
                  const item = openItems.find((item) => item.id === tabId);
                  if (!item || item.kind !== 'editor' || !projectId) return;

                  const editorItem = item as EditorItem;
                  const documentId = editorItem.documentId;

                  if (!documentId) {
                    console.error('No document ID found for tab:', tabId);
                    return;
                  }

                  try {
                    // Update the document title in Firestore
                    await updateProjectDocument(projectId, documentId, { title: newTitle });

                    // Update the tab title in local state
                    setOpenItems((prev) =>
                      prev.map((openItem) =>
                        openItem.id === tabId ? { ...openItem, title: newTitle } : openItem,
                      ),
                    );

                    // Reload project data to sync with KnowledgeBase
                    await reloadProjectData();
                  } catch (error) {
                    console.error('Failed to rename document:', error);
                  }
                }}
              />
              <div style={{ flex: 1, minHeight: 0 }}>
                {activeItem.kind === 'editor' ? (
                  <TiptapEditor
                    key={activeItem.id} // Force re-render when switching between documents
                    onContentChange={handleContentChange}
                    initialContent={documentContent}
                    onEditorReady={handleEditorReady}
                  />
                ) : (
                  <PdfViewer
                    file={(activeItem as PdfItem).file}
                    url={(activeItem as PdfItem).url}
                    title={activeItem.title}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chatbot Panel (Right) */}
        <div className="absolute right-4 top-4 bottom-4 z-10">
          <CollapsiblePanel title="Chat" position="right" defaultOpen={true} className="h-full">
            <MainChatbot
              documentContent={documentContent}
              selectedSources={selectedSources}
              onFileUpload={handleChatbotFileUpload}
              onFileRemove={handleFileRemove}
              onChatbotFileRemove={handleChatbotFileRemove}
            />
          </CollapsiblePanel>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
        onInsert={handleInsertImage}
      />
    </div>
  );
};

export default EditorContainer;
