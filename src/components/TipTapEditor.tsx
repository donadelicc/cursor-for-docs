import styles from './TipTapEditor.module.css'

import { useEditor, EditorContent } from '@tiptap/react'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'
import ShortcutsInfoBox from './ShortcutsInfoBox'
import SaveButton from './SaveButton'
import { htmlToMarkdown, downloadMarkdown } from '../utils/markdownConverter'

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Highlight,
  Typography,
]

export const TiptapEditor = () => {
  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: styles.tiptap,
      },
    },
  })

  const handleSave = () => {
    if (!editor) return;
    
    const html = editor.getHTML();
    const markdown = htmlToMarkdown(html);
    
    // Generate filename with current date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `document-${dateString}.md`;
    
    downloadMarkdown(markdown, filename);
  };

  return (
    <div className={styles.tiptapEditor}>
      <ShortcutsInfoBox />
      <EditorContent editor={editor} />
      <SaveButton onSave={handleSave} disabled={!editor} />
    </div>
  )
}

export default TiptapEditor