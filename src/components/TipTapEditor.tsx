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
import { SuggestionMark } from '@/utils/suggestion-mark'
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
  const [originalContent, setOriginalContent] = useState<OriginalContent | null>(null);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
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
          const editorRect = editorContainerRef.current?.getBoundingClientRect();

          if (editorRect) {
            setChatbotPosition({
              x: rect.left - editorRect.left + rect.width / 2,
              y: rect.bottom - editorRect.top + 10,
            });
          }
          setChatbotVisible(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, suggestionToolbarVisible]);

  const handleRejectSuggestion = useCallback(() => {
    if (!editor || !originalContent) return;
    
    // Find the marked text, delete it, and insert the original text back.
    const { from, to } = findSuggestionRange(editor);
    if(from === -1) { // Failsafe if mark not found
        setSuggestionToolbarVisible(false);
        setOriginalContent(null);
        return;
    }

    editor.chain().focus()
      .deleteRange({ from, to })
      .insertContent(originalContent.text)
      .run();

    setOriginalContent(null);
    setSuggestionToolbarVisible(false);
  }, [editor, originalContent]);

  // Handle closing popups
  useEffect(() => {
    if (!chatbotVisible && !suggestionToolbarVisible) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if(suggestionToolbarVisible) {
          handleRejectSuggestion();
        } else {
          handleCloseChatbot();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [chatbotVisible, suggestionToolbarVisible, handleRejectSuggestion]);

  const handleSuggestion = (suggestion: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const originalText = editor.state.doc.textBetween(from, to);
    
    // Save the original content
    setOriginalContent({ text: originalText, from, to });
    
    // Replace the text with the suggestion and mark it
    editor.chain().focus()
      .deleteRange({ from, to })
      .insertContent(suggestion)
      .setTextSelection({ from, to: from + suggestion.length })
      .setMark(SuggestionMark.name)
      .run();

    setSuggestionToolbarVisible(true);
  };

  const handleAcceptSuggestion = () => {
    if (!editor) return;

    // Find the suggestion mark and just remove the mark
    editor.chain().focus()
      .unsetMark(SuggestionMark.name)
      .run();

    setOriginalContent(null);
    setSuggestionToolbarVisible(false);
  };

  const handleCloseChatbot = () => {
    setChatbotVisible(false);
    setChatbotPosition(null);
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
        onClose={handleCloseChatbot}
        onSuggest={handleSuggestion}
      />
      
      {suggestionToolbarVisible && (
        <SuggestionToolbar 
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          position={chatbotPosition}
        />
      )}
    </div>
  )
}

const findSuggestionRange = (editor: ReturnType<typeof useEditor>): { from: number; to: number } => {
  let from = -1, to = -1;
  editor?.state.doc.descendants((node, pos: number) => {
    const hasMark = node.marks.some((mark) => mark.type.name === SuggestionMark.name);
    if (hasMark) {
      if (from === -1) from = pos;
      to = pos + node.nodeSize;
    }
  });
  return { from, to };
}

export default TiptapEditor