import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import ResizableContainer from './ResizableContainer';
import KnowledgeBase, { SourceSelection } from './KnowledgeBase';
import MainChatbot from './MainChatbot';
import { TiptapEditor } from './TipTapEditor';
import PdfViewer from './PdfViewer';
import WorkspaceTabs, { OpenItem } from './WorkspaceTabs';
import {
  createProject,
  getUserProjects,
  getProjectDocuments,
  createProjectDocument,
  ensureMainProjectDocument,
  updateProjectDocument,
  getProjectDocument,
  listProjectSources,
  uploadProjectSource,
  deleteProjectSource,
  getProjectSourceDownloadURL,
} from '@/utils/firestore';
import { ProjectDocumentMeta, ProjectSource } from '@/types/projects';

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
}

const EditorContainer = ({
  documentContent,
  onContentChange,
  initialContent,
  onFileUpload,
  onEditorReady,
  documentTitle,
  userId,
  projectId: providedProjectId,
}: EditorContainerProps) => {
  const [selectedSources, setSelectedSources] = useState<File[]>([]);
  const [chatbotUploadedFiles, setChatbotUploadedFiles] = useState<File[]>([]);

  // Documents state removed - using project documents instead

  const [projectId, setProjectId] = useState<string | undefined>(providedProjectId);
  const [projectDocs, setProjectDocs] = useState<ProjectDocumentMeta[]>([]);
  const [projectSources, setProjectSources] = useState<ProjectSource[]>([]);

  // Document state management
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(undefined);
  const [documentContents, setDocumentContents] = useState<Map<string, string>>(new Map());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track activeDocumentId changes with wrapper function
  const setActiveDocumentIdWithLogging = React.useCallback(
    (id: string | undefined) => {
      console.log('🔧 [ActiveDocumentId] Setting to:', id, 'from:', activeDocumentId);
      console.trace('🔧 [ActiveDocumentId] Call stack:');
      setActiveDocumentId(id);
    },
    [activeDocumentId],
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (widths: [number, number, number]) => {
    // Optional: Handle resize events if needed
    // Could be used for persistence, analytics, etc.
  };

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
    [projectId]
  );

  // Load or create a default project for the user, then load docs and sources
  const hasInitializedProjectRef = React.useRef(false);
  React.useEffect(() => {
    const run = async () => {
      if (!userId) return;
      if (hasInitializedProjectRef.current) return; // Avoid StrictMode double-run creating duplicates
      hasInitializedProjectRef.current = true;

      let pid = providedProjectId;
      if (!pid) {
        const projects = await getUserProjects(userId);
        pid = projects[0]?.id;
        if (!pid) pid = await createProject(userId, 'My Project');
      }
      setProjectId(pid);
      // Ensure there is a single main doc using a fixed ID
      const mainDocId = await ensureMainProjectDocument(pid);
      console.log('📋 [Project Init] Main document ID will be:', mainDocId);

      // SET ACTIVE DOCUMENT ID FIRST, before any content loading
      setActiveDocumentIdWithLogging(mainDocId);
      console.log('🔧 [Project Init] Set activeDocumentId EARLY:', mainDocId);

      const docs = await getProjectDocuments(pid);
      setProjectDocs(docs);
      const sources = await listProjectSources(pid);
      setProjectSources(sources);

      // Load main document content into editor on first load
      const main = docs.find((d) => d.isMain) || docs[0];
      console.log('📂 [Document Loading] Found main document:', main);

      if (main) {
        try {
          console.log('📖 [Document Loading] Loading document from Firestore...', {
            projectId: pid,
            documentId: main.id,
          });

          const full = await getProjectDocument(pid, main.id);
          console.log('📄 [Document Loading] Retrieved document:', {
            hasDocument: !!full,
            contentLength: full?.content?.length,
            contentPreview: full?.content?.substring(0, 100) + '...',
          });

          if (full) {
            console.log('✅ [Document Loading] Setting content via onContentChange');
            onContentChange?.(full.content);
            // Cache the main document content
            setDocumentContents(prev => {
              const newMap = new Map(prev);
              newMap.set(mainDocId, full.content);
              return newMap;
            });
            setOpenItems((prev) =>
              prev.map((item) =>
                item.id === 'document' && item.kind === 'editor'
                  ? { ...item, title: main.title }
                  : item,
              ),
            );
          } else {
            console.log('⚠️ [Document Loading] Document exists but has no content');
          }
        } catch (e) {
          console.error('❌ [Document Loading] Failed to load document:', e);
        }
      } else {
        console.log('⚠️ [Document Loading] No main document found');
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

  const activate = useCallback(async (id: string) => {
    // Save current document content before switching
    if (activeDocumentId && documentContents.has(activeDocumentId)) {
      const currentContent = documentContents.get(activeDocumentId)!;
      await saveDocumentContent(activeDocumentId, currentContent);
    }

    setActiveId(id);
    
    // If activating a document tab, load its content
    const item = openItems.find((i) => i.id === id);
    if (item?.kind === 'editor' && (item as EditorItem).documentId) {
      const documentId = (item as EditorItem).documentId!;
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
          setDocumentContents(prev => {
            const newMap = new Map(prev);
            newMap.set(documentId, full.content);
            return newMap;
          });
        }
      }
    }
  }, [openItems, projectId, onContentChange, setActiveDocumentIdWithLogging, activeDocumentId, documentContents, saveDocumentContent]);
  const close = useCallback((id: string) => {
    setOpenItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      // If we're closing the active tab, switch to the first available tab
      setActiveId((currentActiveId) => {
        if (currentActiveId === id) {
          const nextTab = filtered[0];
          if (nextTab) {
            // If switching to a document tab, load its content
            if (nextTab.kind === 'editor' && nextTab.documentId) {
              const loadContent = async () => {
                if (!projectId) return;
                const full = await getProjectDocument(projectId, nextTab.documentId!);
                if (full) {
                  onContentChange?.(full.content);
                  setActiveDocumentIdWithLogging(nextTab.documentId!);
                }
              };
              loadContent();
            }
            return nextTab.id;
          }
          return 'document'; // fallback
        }
        return currentActiveId;
      });
      return filtered;
    });
  }, [projectId, onContentChange, setActiveDocumentIdWithLogging]);

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
    () => projectDocs.map((d) => ({ id: d.id, title: d.title, isMain: d.isMain })),
    [projectDocs],
  );
  const kbStoredSources = React.useMemo(
    () => projectSources.map((s) => ({ id: s.id, name: s.name, storagePath: s.storagePath })),
    [projectSources],
  );

  // Document actions for KnowledgeBase
  const reloadProjectData = useCallback(async () => {
    if (!projectId) return;
    const [docs, sources] = await Promise.all([
      getProjectDocuments(projectId),
      listProjectSources(projectId),
    ]);
    setProjectDocs(docs);
    setProjectSources(sources);
  }, [projectId]);

  const createNewDocument = useCallback(async () => {
    if (!projectId) return;
    const untitledIndex = projectDocs.filter((d) => d.title.startsWith('Untitled')).length + 1;
    await createProjectDocument(projectId, { title: `Untitled ${untitledIndex}`, content: '' });
    await reloadProjectData();
  }, [projectId, projectDocs, reloadProjectData]);

  const setMainDocument = useCallback(
    async (id: string) => {
      if (!projectId) return;
      // Set selected doc isMain true, others false
      await Promise.all(
        projectDocs.map((d) =>
          updateProjectDocument(projectId, d.id, { isMain: d.id === id }).catch(() => undefined),
        ),
      );
      await reloadProjectData();
    },
    [projectId, projectDocs, reloadProjectData],
  );

  const openDocument = useCallback(
    async (id: string) => {
      const docMeta = projectDocs.find((d) => d.id === id);
      if (!docMeta || !projectId) return;
      
      const docTabId = `doc:${id}`;
      
      // Check if document is already open
      const existingTab = openItems.find((item) => item.id === docTabId);
      if (existingTab) {
        setActiveId(docTabId);
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
      setOpenItems((prev) => [
        ...prev,
        { id: docTabId, kind: 'editor' as const, title: docMeta.title, documentId: id }
      ]);
      setActiveId(docTabId);
      
      // Update content via callback and cache it
      onContentChange?.(full.content);
      setActiveDocumentIdWithLogging(id);
      setDocumentContents(prev => {
        const newMap = new Map(prev);
        newMap.set(id, full.content);
        return newMap;
      });
    },
    [projectDocs, projectId, onContentChange, setActiveDocumentIdWithLogging, openItems, activeDocumentId, documentContents, saveDocumentContent],
  );

  // Enhanced content change handler with auto-save
  const handleContentChange = useCallback(
    (content: string) => {
      // Update the main documentContent state (for HeaderDocument display)
      onContentChange?.(content);
      
      // Update the content map for the active document
      if (activeDocumentId) {
        setDocumentContents(prev => {
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
    [activeDocumentId, onContentChange, saveDocumentContent]
  );

  const handleSelectedSourcesChange = useCallback(async (selections: SourceSelection[]) => {
    const files: File[] = [];
    
    // Process File objects immediately
    const fileSelections = selections.filter(selection => selection.type === 'file' && selection.file);
    files.push(...fileSelections.map(selection => selection.file!));
    
    // Process stored sources by downloading them via API
    const storedSelections = selections.filter(selection => selection.type === 'stored');
    
    for (const selection of storedSelections) {
      if (!selection.storedSource) continue;
      
      try {
        console.log('🔄 Downloading stored source via API:', selection.storedSource.name);
        
        const response = await fetch('/api/download-source', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storagePath: selection.storedSource.storagePath,
            filename: selection.storedSource.name,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const file = new File([arrayBuffer], selection.storedSource.name, { type: 'application/pdf' });
        
        console.log('✅ Successfully downloaded stored source:', file.name);
        files.push(file);
        
      } catch (error) {
        console.error('❌ Failed to download stored source:', selection.storedSource.name, error);
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
          files.map((file) =>
            uploadProjectSource(projectId, file).catch((e) => {
              console.error('Upload to storage failed', e);
              return null;
            }),
          ),
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
        files.map((file) =>
          uploadProjectSource(projectId, file).catch((e) => {
            console.error('[KB Upload] upload failed', e);
            return null;
          }),
        ),
      )
        .then(() => reloadProjectData())
        .catch((e) => console.warn('[KB Upload] reload failed', e));
    },
    [onFileUpload, projectId, reloadProjectData],
  );


  return (
    <div className="w-full h-full bg-white relative border-t border-gray-300">
      <ResizableContainer
        minWidth={15} // 15% minimum width for each panel
        onResize={handleResize}
      >
        {/* Knowledge Base Panel */}
        <div className="h-full bg-gray-50 overflow-hidden">
          <KnowledgeBase
            onFileUpload={handleKnowledgeBaseFileUpload}
            onSelectedSourcesChange={handleSelectedSourcesChange}
            externalFiles={chatbotUploadedFiles}
            onExternalFileRemove={handleChatbotFileRemove}
            currentAttachedCount={currentAttachedCount}
            onOpenSource={openPdf}
            documents={kbDocuments}
            onCreateDocument={createNewDocument}
            onOpenDocument={openDocument}
            onSetMainDocument={setMainDocument}
            storedSources={kbStoredSources}
            onOpenStoredSource={openStoredPdf}
            onDeleteStoredSource={(id, storagePath) => {
              if (!projectId) return;
              deleteProjectSource(projectId, id, storagePath)
                .then(() => reloadProjectData())
                .catch(() => undefined);
            }}
          />
        </div>

        {/* Editor Panel */}
        <div className="h-full bg-white overflow-hidden">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <WorkspaceTabs
              items={openItems}
              activeId={activeItem.id}
              onActivate={activate}
              onClose={close}
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeItem.kind === 'editor' ? (
                <TiptapEditor
                  key={activeItem.id} // Force re-render when switching between documents
                  onContentChange={handleContentChange}
                  initialContent={documentContent}
                  onEditorReady={onEditorReady}
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

        {/* Chatbot Panel */}
        <div className="h-full bg-gray-50 overflow-hidden">
          <MainChatbot
            documentContent={documentContent}
            selectedSources={selectedSources}
            onFileUpload={handleChatbotFileUpload}
            onFileRemove={handleFileRemove}
            onChatbotFileRemove={handleChatbotFileRemove}
          />
        </div>
      </ResizableContainer>
    </div>
  );
};

export default EditorContainer;
