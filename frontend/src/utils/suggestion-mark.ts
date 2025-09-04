import { Mark } from '@tiptap/core';

// Mark for original text that will be replaced (gray styling)
export const OriginalTextMark = Mark.create({
  name: 'original-text',
  exclusive: true,
  group: 'suggestion',

  parseHTML() {
    return [
      {
        tag: 'span[data-original-text]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-original-text': true }, 0];
  },
});

// Mark for suggested text (blue background)
export const SuggestionMark = Mark.create({
  name: 'suggestion',
  exclusive: true,
  group: 'suggestion',

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-suggestion': true }, 0];
  },
});
