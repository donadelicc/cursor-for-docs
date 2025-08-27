import { useEditor } from '@tiptap/react';
import { SuggestionMark, OriginalTextMark } from '@/utils/suggestion-mark';
import { markdownToHtml } from './markdownConverter';
import { SuggestionIntent } from '@/types/editor';

export const findSuggestionRanges = (editor: ReturnType<typeof useEditor>) => {
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

export const applyMarkdownFormatting = (
  editor: ReturnType<typeof useEditor>,
  markdown: string,
  originalFrom: number,
  originalTo: number,
  intent: SuggestionIntent,
) => {
  if (!editor) return;

  console.log('🔧 Applying markdown formatting:', {
    markdown,
    originalFrom,
    originalTo,
    intent,
  });

  // Check if the text actually contains markdown syntax
  const hasMarkdownSyntax =
    markdown.includes('**') ||
    markdown.includes('*') ||
    markdown.includes('#') ||
    markdown.includes('`') ||
    markdown.includes('[') ||
    markdown.includes(']') ||
    markdown.includes('_') ||
    markdown.includes('~');

  // Check if text has paragraph breaks (double newlines or multiple lines)
  const hasMultipleParagraphs =
    markdown.includes('\n\n') ||
    markdown.split('\n').filter((line) => line.trim().length > 0).length > 1;

  let content: string;

  if (hasMarkdownSyntax || hasMultipleParagraphs) {
    // Use Showdown for markdown content or text with paragraph breaks
    content = markdownToHtml(markdown);
    console.log('🔧 Converted markdown to HTML with Showdown:', content);
  } else {
    // For plain text without paragraph breaks, just use it directly
    content = markdown;
    console.log('🔧 Using plain text directly:', content);
  }

  // Helper to insert suggestion with SuggestionMark
  const insertSuggestion = (pos: number) => {
    if (content.trim().startsWith('<') || content.includes('<p>')) {
      // Insert as HTML and then mark it
      editor.chain().focus().setTextSelection({ from: pos, to: pos }).insertContent(content).run();

      // Try to mark the newly inserted content with SuggestionMark
      setTimeout(() => {
        const { suggestionRange } = findSuggestionRanges(editor);
        if (suggestionRange.from === -1) {
          // If no suggestion mark found, try to mark the content that was just inserted
          const currentDocSize = editor.state.doc.content.size;
          const estimatedStart = Math.max(0, currentDocSize - content.length - 1);
          editor
            .chain()
            .focus()
            .setTextSelection({
              from: estimatedStart,
              to: estimatedStart + content.length,
            })
            .setMark(SuggestionMark.name)
            .run();
        }
      }, 10);
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: pos, to: pos })
        .insertContent({
          type: 'text',
          text: content,
          marks: [{ type: SuggestionMark.name }],
        })
        .run();
    }
  };

  if (intent === 'replace') {
    // Mark the original text if not already
    editor
      .chain()
      .focus()
      .setTextSelection({ from: originalFrom, to: originalTo })
      .setMark(OriginalTextMark.name)
      .run();
    // Insert suggestion after the original
    insertSuggestion(originalTo);
  } else if (intent === 'add_after') {
    // Insert suggestion after the original
    insertSuggestion(originalTo);
  } else if (intent === 'add_before') {
    // Insert suggestion before the original
    insertSuggestion(originalFrom);
  }
};
