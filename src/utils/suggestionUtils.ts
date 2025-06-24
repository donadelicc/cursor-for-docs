import { useEditor } from "@tiptap/react";
import { SuggestionMark, OriginalTextMark } from "@/utils/suggestion-mark";
import { markdownToHtml } from "./markdownConverter";
import { SuggestionIntent } from "@/types/editor";

export const findSuggestionRanges = (editor: ReturnType<typeof useEditor>) => {
  const originalRange = { from: -1, to: -1 };
  const suggestionRange = { from: -1, to: -1 };

  editor?.state.doc.descendants((node, pos: number) => {
    const hasOriginalMark = node.marks.some(
      (mark) => mark.type.name === OriginalTextMark.name,
    );
    const hasSuggestionMark = node.marks.some(
      (mark) => mark.type.name === SuggestionMark.name,
    );

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

  console.log("🔧 Applying markdown formatting:", {
    markdown,
    originalFrom,
    originalTo,
    intent,
  });

  // Check if the text actually contains markdown syntax
  const hasMarkdownSyntax =
    markdown.includes("**") ||
    markdown.includes("*") ||
    markdown.includes("#") ||
    markdown.includes("`") ||
    markdown.includes("[") ||
    markdown.includes("]") ||
    markdown.includes("_") ||
    markdown.includes("~");

  // Check if text has paragraph breaks (double newlines or multiple lines)
  const hasMultipleParagraphs =
    markdown.includes("\n\n") ||
    markdown.split("\n").filter((line) => line.trim().length > 0).length > 1;

  let content: string;

  if (hasMarkdownSyntax || hasMultipleParagraphs) {
    // Use Showdown for markdown content or text with paragraph breaks
    content = markdownToHtml(markdown);
    console.log("🔧 Converted markdown to HTML with Showdown:", content);
  } else {
    // For plain text without paragraph breaks, just use it directly
    content = markdown;
    console.log("🔧 Using plain text directly:", content);
  }

  // Apply the content based on intent
  if (intent === "replace") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: originalFrom, to: originalTo })
      .insertContent(content)
      .run();
  } else {
    const insertPos = intent === "add_before" ? originalFrom : originalTo;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: insertPos, to: insertPos })
      .insertContent(content)
      .run();
  }
}; 