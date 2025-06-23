import { Mark } from '@tiptap/core';

export const SuggestionMark = Mark.create({
  name: 'suggestion',

  // This makes it so other marks (like bold, italic) can't be applied on top of it.
  exclusive: true,

  // This tells the editor to treat this as a single, unbreakable block when deleting.
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