import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, updateDocument } from "@/utils/firestore";

export interface AutoSaveStatus {
  status: "idle" | "saving" | "saved" | "error";
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
  options?: UseAutoSaveOptions;
}

export const useAutoSave = ({
  content,
  title,
  documentId,
  options = {},
}: UseAutoSaveParams) => {
  const {
    delay = 3000, // Default 3 seconds
    enabled = true,
    onAutoSave,
  } = options;

  const { currentUser } = useAuth();
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: "idle",
  });

  // Use refs to store the latest values without causing effect re-runs
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const documentIdRef = useRef(documentId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when values change
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  const performAutoSave = useCallback(async () => {
    if (!currentUser || !enabled) return;

    const currentContent = contentRef.current;
    const currentTitle = titleRef.current || "Untitled Document";
    const currentDocumentId = documentIdRef.current;

    // Don't save if content is empty
    if (!currentContent.trim()) return;

    setAutoSaveStatus({ status: "saving" });

    try {
      let savedDocumentId = currentDocumentId;

      if (currentDocumentId) {
        // Update existing document
        await updateDocument(currentDocumentId, {
          title: currentTitle,
          content: currentContent,
          lastModified: new Date(),
        });
      } else {
        // Create new document
        savedDocumentId = await createDocument({
          userId: currentUser.uid,
          title: currentTitle,
          content: currentContent,
        });

        // Update the ref so subsequent saves update instead of create
        documentIdRef.current = savedDocumentId;
      }

      setAutoSaveStatus({
        status: "saved",
        lastSaved: new Date(),
      });

      // Call the callback if provided
      if (onAutoSave && savedDocumentId) {
        onAutoSave(savedDocumentId);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus((prev) => ({ ...prev, status: "idle" }));
      }, 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setAutoSaveStatus({
        status: "error",
        error: "Failed to auto-save document",
      });

      // Reset to idle after showing error for 5 seconds
      setTimeout(() => {
        setAutoSaveStatus((prev) => ({ ...prev, status: "idle" }));
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
  }, [content, title, enabled, currentUser, delay, performAutoSave]);

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
    isAutoSaving: autoSaveStatus.status === "saving",
  };
};
