import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, updateDocument } from '@/utils/firestore';

// Generate a unique client-side ID for new documents
const generateClientId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

interface UseAutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-save triggers
  enabled?: boolean; // Whether auto-save is enabled
  onAutoSave?: (documentId: string) => void; // Callback when auto-save completes
}

interface UseAutoSaveParams {
  content: string;
  title: string;
  documentId?: string;
  initialContent?: string; // To distinguish new vs existing documents
  options?: UseAutoSaveOptions;
}

export const useAutoSave = ({
  content,
  title,
  documentId,
  initialContent = '',
  options = {},
}: UseAutoSaveParams) => {
  const {
    delay = 300, // Default 300ms for near-instant saving
    enabled = true,
    onAutoSave,
  } = options;

  const { currentUser } = useAuth();
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: 'idle',
  });

  // Use refs to store the latest values without causing effect re-runs
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const documentIdRef = useRef(documentId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track last saved content to avoid unnecessary saves
  const lastSavedContentRef = useRef<string>('');

  // Track whether document exists in database (vs just having a client-generated ID)
  const documentExistsInDbRef = useRef<boolean>(false);

  // Update refs when values change
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    documentIdRef.current = documentId;

    // Document exists in DB if we have both documentId and initialContent
    // (meaning it was loaded from database)
    documentExistsInDbRef.current = !!(documentId && initialContent);

    // Set initial "already saved" content for existing documents
    if (documentExistsInDbRef.current) {
      lastSavedContentRef.current = initialContent;
    }
  }, [documentId, initialContent]);

  const performAutoSave = useCallback(async () => {
    if (!currentUser || !enabled) return;

    const currentContent = contentRef.current;
    const currentTitle = titleRef.current || 'Untitled Document';
    const currentDocumentId = documentIdRef.current;

    // Don't save if content is empty
    if (!currentContent.trim()) return;

    // Don't save if content hasn't changed since last save
    if (currentContent === lastSavedContentRef.current) {
      return;
    }

    setAutoSaveStatus({ status: 'saving' });

    try {
      let savedDocumentId = currentDocumentId;

      if (currentDocumentId && documentExistsInDbRef.current) {
        // Update existing document that exists in database
        await updateDocument(currentDocumentId, {
          title: currentTitle,
          content: currentContent,
          lastModified: new Date(),
        });
      } else {
        // Create new document (either no ID or client-generated ID that doesn't exist in DB)
        savedDocumentId = currentDocumentId || generateClientId();

        await createDocument({
          id: savedDocumentId,
          userId: currentUser.uid,
          title: currentTitle,
          content: currentContent,
        });

        // Update refs so subsequent saves update instead of create
        documentIdRef.current = savedDocumentId;
        documentExistsInDbRef.current = true;
      }

      // Update last saved content to prevent unnecessary future saves
      lastSavedContentRef.current = currentContent;

      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
      });

      // Call the callback if provided
      if (onAutoSave && savedDocumentId) {
        onAutoSave(savedDocumentId);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus((prev) => ({ ...prev, status: 'idle' }));
      }, 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus({
        status: 'error',
        error: 'Failed to auto-save document',
      });

      // Reset to idle after showing error for 5 seconds
      setTimeout(() => {
        setAutoSaveStatus((prev) => ({ ...prev, status: 'idle' }));
      }, 5000);
    }
  }, [currentUser, enabled, onAutoSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled || !currentUser) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only trigger auto-save if we have content
    if (content.trim()) {
      timeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, delay);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, currentUser, delay, performAutoSave]);

  // Manual save function that can be called immediately
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performAutoSave();
  }, [performAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    autoSaveStatus,
    saveNow,
    isAutoSaving: autoSaveStatus.status === 'saving',
  };
};
