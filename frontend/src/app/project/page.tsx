'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Editor } from '@tiptap/react';
import EditorContainer from '@/components/EditorContainer';
import HeaderDocument from '@/components/HeaderDocument';
import { SaveFormat } from '@/components/SaveButton';

import { getProject, renameProject } from '@/utils/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRef } from 'react';

export default function ProjectPage() {
  const [documentContent, setDocumentContent] = useState('');
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  // Track the initial URL ID to distinguish existing vs new documents
  const initialUrlId = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  // Function to update document title from TipTapEditor
  const updateProjectTitle = (newTitle: string) => {
    setCurrentProjectTitle(newTitle);
  };

  // Function to be passed to TiptapEditor to update document content
  const updateDocumentContent = (content: string) => {
    console.log('📝 [Project Page] Content updated from TipTap:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...',
    });
    setDocumentContent(content);
  };

  // Function to handle editor instance ready
  const handleEditorReady = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  // Functions for FormattingToolbar (moved from TipTapEditor)
  const handleSave = async (format: SaveFormat, customFilename: string) => {
    if (!editor) return;

    const html = editor.getHTML();

    try {
      const { downloadAsDocx } = await import('@/utils/docxConverter');
      const { downloadAsPdf } = await import('@/utils/pdfConverter');
      const { htmlToMarkdown, downloadMarkdown } = await import('@/utils/markdownConverter');

      if (format === 'docx') {
        const filename = `${customFilename}.docx`;
        await downloadAsDocx(html, filename);
      } else if (format === 'pdf') {
        const filename = `${customFilename}.pdf`;
        await downloadAsPdf(html, filename);
      } else {
        // Default to markdown
        const markdown = htmlToMarkdown(html);
        const filename = `${customFilename}.md`;
        downloadMarkdown(markdown, filename);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + (error as Error).message);
    }
  };

  const handleUpload = async (file: File) => {
    if (!editor) return;

    try {
      const { importDocxFile } = await import('@/utils/docxImporter');
      const result = await importDocxFile(file);
      editor.commands.setContent(result.html);

      if (result.messages.length > 0) {
        console.log('Import messages:', result.messages);
      }
    } catch (error) {
      console.error('Error importing DOCX:', error);
      throw error;
    }
  };

  // Removed legacy autosave - EditorContainer handles project document autosave
  const autoSaveStatus = { status: 'idle' as const };

  // Legacy loadDocument function removed - EditorContainer handles project document loading

  // Load project info if ID is provided in URL
  useEffect(() => {
    const projectId = searchParams.get('id');

    // On first run, capture the initial URL ID
    if (!hasInitialized.current) {
      initialUrlId.current = projectId;
      hasInitialized.current = true;
    }

    if (currentUser && projectId) {
      getProject(projectId)
        .then((project) => {
          if (project && project.userId === currentUser.uid) {
            setCurrentProjectTitle(project.name);
          }
        })
        .catch(() => undefined);
    }
  }, [searchParams, currentUser]);

  // Ensure page starts at top when loaded (this won't work with overflow:hidden)
  // Instead, we'll handle this in the editor component

  // Keyboard shortcut for manual save (Ctrl+S) - removed since EditorContainer handles saving

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Project Header */}
      <HeaderDocument
        title={currentProjectTitle}
        onTitleChange={updateProjectTitle}
        currentDocumentId={undefined}
        documentContent={documentContent}
        autoSaveStatus={autoSaveStatus}
        disabled={!currentUser}
        editor={editor}
        onExportSave={handleSave}
        onUpload={handleUpload}
        contextLabel="Project"
        onTitlePersist={async (name: string) => {
          const projectId = searchParams.get('id');
          if (!projectId) return;
          await renameProject(projectId, name);
        }}
        projectId={searchParams.get('id') || undefined}
        activeDocumentId="main"
        onProjectSave={() => {
          console.log('📄 [Project Page] Manual save completed');
        }}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {false ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <EditorContainer
            documentContent={documentContent}
            onContentChange={updateDocumentContent}
            initialContent={documentContent}
            onFileUpload={() => {}}
            onEditorReady={handleEditorReady}
            documentTitle={currentProjectTitle}
            userId={currentUser?.uid}
            projectId={searchParams.get('id') || undefined}
          />
        )}
      </div>
    </div>
  );
}
