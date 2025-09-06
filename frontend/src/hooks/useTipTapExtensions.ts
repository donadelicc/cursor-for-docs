import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { SuggestionMark, OriginalTextMark } from '@/utils/suggestion-mark';
import { FontSizeLineHeight } from '@/app/project/editor/tiptap/FontSize';

export const useTipTapExtensions = () => {
  const extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Highlight,
    Typography,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    TextStyle,
    FontFamily.configure({
      types: ['textStyle'],
    }),
    Color,
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'tiptap-image',
      },
    }),
    Dropcursor,
    FontSizeLineHeight,
    SuggestionMark,
    OriginalTextMark,
  ];

  return extensions;
};
