// Type for storing original content before a suggestion is applied
export type OriginalContent = {
  text: string;
  from: number;
  to: number;
};

// Type for suggestion intent
export type SuggestionIntent = "replace" | "add_after" | "add_before";

// Type for position coordinates
export type Position = {
  x: number;
  y: number;
} | null;
