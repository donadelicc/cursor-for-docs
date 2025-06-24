import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import { SuggestionMark, OriginalTextMark } from "@/utils/suggestion-mark";

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
      types: ["heading", "paragraph"],
    }),
    Underline,
    TextStyle,
    FontFamily.configure({
      types: ["textStyle"],
    }),
    Color,
    SuggestionMark,
    OriginalTextMark,
  ];

  return extensions;
}; 