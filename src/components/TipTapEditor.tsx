import styles from './TipTapEditor.module.css'

import { useEditor, EditorContent } from '@tiptap/react'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import ShortcutsInfoBox from './ShortcutsInfoBox'
import SaveButton from './SaveButton'
import InlineChatbot from './InlineChatbot'
import SuggestionToolbar from './SuggestionToolbar'
import { SuggestionMark, OriginalTextMark } from '@/utils/suggestion-mark'
import { htmlToMarkdown, downloadMarkdown } from '../utils/markdownConverter'

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Highlight,
  Typography,
  SuggestionMark,
  OriginalTextMark,
]

// Type for storing original content before a suggestion is applied
type OriginalContent = {
  text: string;
  from: number;
  to: number;
};

export const TiptapEditor = () => {
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState<{ x: number; y: number } | null>(null);
  const [suggestionToolbarVisible, setSuggestionToolbarVisible] = useState(false);
  const [suggestionToolbarPosition, setSuggestionToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [originalContent, setOriginalContent] = useState<OriginalContent | null>(null);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Helper function to reset suggestion state
  const resetSuggestionState = useCallback(() => {
    setSuggestionToolbarVisible(false);
    setSuggestionToolbarPosition(null);
    setOriginalContent(null);
  }, []);

  // Helper function to reset chatbot state
  const resetChatbotState = useCallback(() => {
    setChatbotVisible(false);
    setChatbotPosition(null);
  }, []);

  // Helper function to calculate position relative to editor
  const calculatePosition = useCallback((rect: DOMRect): { x: number; y: number } | null => {
    const editorRect = editorContainerRef.current?.getBoundingClientRect();
    if (!editorRect) return null;
    
    return {
      x: rect.left - editorRect.left + rect.width / 2,
      y: rect.bottom - editorRect.top + 10,
    };
  }, []);

  // Function to sync component state with document state
  const syncStateWithDocument = useCallback((editor: ReturnType<typeof useEditor>) => {
    if (!editor) return;

    // Don't sync if chatbot is visible and user might be typing
    if (chatbotVisible) return;

    const { originalRange, suggestionRange } = findSuggestionRanges(editor);
    const hasOriginalMark = originalRange.from !== -1;
    const hasSuggestionMark = suggestionRange.from !== -1;

    if (hasOriginalMark && hasSuggestionMark) {
      // Both marks exist - we're in suggestion state
      if (!suggestionToolbarVisible) {
        setSuggestionToolbarVisible(true);
        
        // Calculate toolbar position
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const position = calculatePosition(rect);

            if (position) {
              setSuggestionToolbarPosition(position);
            }
          }
        }, 50);

        // Restore original content info if we don't have it
        if (!originalContent) {
          const originalText = editor.state.doc.textBetween(originalRange.from, originalRange.to);
          setOriginalContent({ 
            text: originalText, 
            from: originalRange.from, 
            to: originalRange.to 
          });
        }
      }
    } else if (hasOriginalMark && !hasSuggestionMark) {
      // Only original mark exists - this is an intermediate state, remove the mark
      editor.chain().focus()
        .setTextSelection({ from: originalRange.from, to: originalRange.to })
        .unsetMark(OriginalTextMark.name)
        .run();
      
      // Reset component state
      resetSuggestionState();
    } else {
      // No marks or incomplete marks - reset state
      if (suggestionToolbarVisible) {
        resetSuggestionState();
      }
      
      // Close chatbot if it's open and we're back to clean state
      if (chatbotVisible) {
        resetChatbotState();
      }
    }
  }, [suggestionToolbarVisible, originalContent, chatbotVisible, resetSuggestionState, resetChatbotState, calculatePosition]);

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
    onUpdate: ({ editor }) => {
      // Sync component state with document state after any change (including undo/redo)
      syncStateWithDocument(editor);
    },
  })

  // Open chatbot on keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        
        if (!editor || suggestionToolbarVisible) return;
        
        const { empty } = editor.state.selection;
        if (empty) return;
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const position = calculatePosition(rect);

          if (position) {
            setChatbotPosition(position);
            setChatbotVisible(true);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, suggestionToolbarVisible, calculatePosition]);

  const handleRejectSuggestion = useCallback(() => {
    if (!editor || !originalContent) return;
    
    // Find the original text range
    const { originalRange } = findSuggestionRanges(editor);
    
    if (originalRange.from === -1) {
      resetSuggestionState();
      return;
    }

    // Simple approach: replace everything from original start to end of document with just the original text
    const docEndPos = editor.state.doc.content.size - 1;
    
    // Delete everything from the original position to the end
    editor.chain().focus()
      .deleteRange({ from: originalRange.from, to: docEndPos })
      .insertContent(originalContent.text)
      .run();

    resetSuggestionState();
  }, [editor, originalContent, resetSuggestionState]);

  // Handle closing popups
  useEffect(() => {
    if (!chatbotVisible && !suggestionToolbarVisible) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if(suggestionToolbarVisible) {
          handleRejectSuggestion();
        } else {
          resetChatbotState();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [chatbotVisible, suggestionToolbarVisible, handleRejectSuggestion, resetChatbotState]);

  const handleSuggestion = (suggestion: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const originalText = editor.state.doc.textBetween(from, to);
    
    // Save the original content
    setOriginalContent({ text: originalText, from, to });
    
    // Mark the original text as "to be replaced" (gray styling)
    editor.chain().focus()
      .setTextSelection({ from, to })
      .setMark(OriginalTextMark.name)
      .run();

    // Clean the suggestion text to prevent any unwanted formatting
    const cleanSuggestion = suggestion.replace(/^-+$/gm, '').trim();

    // Insert the suggestion using TipTap's insertContentAt command with plain text
    const newParagraph = `<p>${cleanSuggestion}</p>`;
    editor.chain().focus()
      .insertContentAt(to, newParagraph)
      .run();

    // Find and mark the suggestion text by searching for it in the document
    setTimeout(() => {
      const { suggestionRange } = findSuggestionRanges(editor);
      if (suggestionRange.from !== -1) {
        editor.chain().focus()
          .setTextSelection({ from: suggestionRange.from, to: suggestionRange.to })
          .setMark(SuggestionMark.name)
          .run();
      } else {
        // Fallback: mark the text that was just inserted
        const currentDocSize = editor.state.doc.content.size;
        const estimatedStart = currentDocSize - cleanSuggestion.length - 1;
        if (estimatedStart >= 0) {
          editor.chain().focus()
            .setTextSelection({ from: estimatedStart, to: estimatedStart + cleanSuggestion.length })
            .setMark(SuggestionMark.name)
            .run();
        }
      }
    }, 10);

    // Calculate position for suggestion toolbar
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const position = calculatePosition(rect);

        if (position) {
          setSuggestionToolbarPosition(position);
        }
      }
    }, 50);

    setSuggestionToolbarVisible(true);
  };

  const handleAcceptSuggestion = () => {
    if (!editor || !originalContent) return;

    // Find both the original text and suggestion ranges
    const { originalRange, suggestionRange } = findSuggestionRanges(editor);
    
    if (originalRange.from === -1 || suggestionRange.from === -1) {
      resetSuggestionState();
      return;
    }

    // Get the suggestion text (clean, without any markup)
    const suggestionText = editor.state.doc.textBetween(suggestionRange.from, suggestionRange.to);
    
    // Replace everything from original start to end with clean suggestion text
    const docEndPos = editor.state.doc.content.size - 1;
    editor.chain().focus()
      .deleteRange({ from: originalRange.from, to: docEndPos })
      .insertContent(suggestionText)
      .run();

    resetSuggestionState();
  };

  const handleSave = () => {
    if (!editor) return;
    
    const html = editor.getHTML();
    const markdown = htmlToMarkdown(html);
    
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const filename = `document-${dateString}.md`;
    
    downloadMarkdown(markdown, filename);
  };

  const selectedText = editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) : '';

  return (
    <div className={styles.tiptapEditor} ref={editorContainerRef}>
      <ShortcutsInfoBox />
      <EditorContent editor={editor} />
      <SaveButton onSave={handleSave} disabled={!editor} />
      
      <InlineChatbot
        ref={chatbotRef}
        isVisible={chatbotVisible}
        position={chatbotPosition}
        selectedText={selectedText}
        onClose={resetChatbotState}
        onSuggest={handleSuggestion}
      />
      
      {suggestionToolbarVisible && (
        <SuggestionToolbar 
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          position={suggestionToolbarPosition}
        />
      )}
    </div>
  )
}

const findSuggestionRanges = (editor: ReturnType<typeof useEditor>) => {
  const originalRange = { from: -1, to: -1 };
  const suggestionRange = { from: -1, to: -1 };
  
  editor?.state.doc.descendants((node, pos: number) => {
    const hasOriginalMark = node.marks.some((mark) => mark.type.name === OriginalTextMark.name);
    const hasSuggestionMark = node.marks.some((mark) => mark.type.name === SuggestionMark.name);
    
    if (hasOriginalMark) {
      if (originalRange.from === -1) originalRange.from = pos;
      originalRange.to = pos + node.nodeSize;
    }
    
    if (hasSuggestionMark) {
      if (suggestionRange.from === -1) suggestionRange.from = pos;
      suggestionRange.to = pos + node.nodeSize;
    }
  });
  
  return { originalRange, suggestionRange };
};

export default TiptapEditor