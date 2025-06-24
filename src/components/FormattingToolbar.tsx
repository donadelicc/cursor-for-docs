import React, { ReactNode } from "react";
import { Editor } from "@tiptap/react";
import styles from "./FormattingToolbar.module.css";
import Upload from "./Upload";

interface FormattingToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  children?: ReactNode;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  onSave,
  onUpload,
  disabled = false,
  children,
}) => {
  if (!editor) return null;

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          {/* Undo/Redo */}
          <button
            className={styles.toolbarButton}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            className={styles.toolbarButton}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </button>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Text Styles Dropdown - Shorter Labels */}
          <select
            className={styles.styleSelect}
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : "paragraph"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else if (value === "h1") {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (value === "h2") {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (value === "h3") {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }
            }}
          >
            <option value="paragraph">Normal</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Font Family Dropdown - Shorter Labels */}
          <select
            className={styles.formatSelect}
            value={(() => {
              const currentFont = editor.getAttributes("textStyle").fontFamily;
              if (!currentFont) return "Arial";

              // Normalize the font value for better matching
              const normalized = currentFont.toLowerCase().replace(/['"]/g, "");

              if (normalized.includes("arial")) return "Arial";
              if (normalized.includes("helvetica")) return "Helvetica";
              if (normalized.includes("times")) return "Times New Roman, serif";
              if (normalized.includes("georgia")) return "Georgia, serif";
              if (normalized.includes("courier"))
                return "Courier New, monospace";
              if (normalized.includes("monaco")) return "Monaco, monospace";
              if (normalized.includes("verdana")) return "Verdana, sans-serif";
              if (normalized.includes("tahoma")) return "Tahoma, sans-serif";
              if (normalized.includes("comic sans"))
                return "Comic Sans MS, cursive";
              if (normalized.includes("impact")) return "Impact, sans-serif";

              return currentFont;
            })()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "Arial") {
                // For Arial, we can either set it explicitly or unset to use default
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(value).run();
              }
            }}
            title="Font Family"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman, serif">Times</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Text Formatting Dropdown */}
          <select
            className={styles.formatSelect}
            value={
              editor.isActive("bold") &&
              editor.isActive("italic") &&
              editor.isActive("underline") &&
              editor.isActive("strike")
                ? "all"
                : editor.isActive("bold") &&
                    editor.isActive("italic") &&
                    editor.isActive("underline")
                  ? "biu"
                  : editor.isActive("bold") && editor.isActive("italic")
                    ? "bi"
                    : editor.isActive("bold") && editor.isActive("underline")
                      ? "bu"
                      : editor.isActive("bold") && editor.isActive("strike")
                        ? "bs"
                        : editor.isActive("italic") &&
                            editor.isActive("underline")
                          ? "iu"
                          : editor.isActive("italic") &&
                              editor.isActive("strike")
                            ? "is"
                            : editor.isActive("underline") &&
                                editor.isActive("strike")
                              ? "us"
                              : editor.isActive("bold")
                                ? "bold"
                                : editor.isActive("italic")
                                  ? "italic"
                                  : editor.isActive("underline")
                                    ? "underline"
                                    : editor.isActive("strike")
                                      ? "strike"
                                      : "none"
            }
            onChange={(e) => {
              const value = e.target.value;
              // First clear all formatting
              editor
                .chain()
                .focus()
                .unsetBold()
                .unsetItalic()
                .unsetUnderline()
                .unsetStrike()
                .run();

              // Then apply the selected format(s)
              if (value.includes("bold") || value.includes("b")) {
                editor.chain().focus().toggleBold().run();
              }
              if (value.includes("italic") || value.includes("i")) {
                editor.chain().focus().toggleItalic().run();
              }
              if (value.includes("underline") || value.includes("u")) {
                editor.chain().focus().toggleUnderline().run();
              }
              if (value.includes("strike") || value.includes("s")) {
                editor.chain().focus().toggleStrike().run();
              }
            }}
            title="Text Formatting"
          >
            <option value="none">Format</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="underline">Underline</option>
            <option value="strike">Strike</option>
          </select>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Code Dropdown */}
          <select
            className={styles.formatSelect}
            value={
              editor.isActive("codeBlock")
                ? "codeBlock"
                : editor.isActive("code")
                  ? "code"
                  : "none"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "code") {
                editor.chain().focus().toggleCode().run();
              } else if (value === "codeBlock") {
                editor.chain().focus().toggleCodeBlock().run();
              }
            }}
            title="Code Options"
          >
            <option value="none">Code</option>
            <option value="code">Inline</option>
            <option value="codeBlock">Block</option>
          </select>
          {/* Keep Highlight Button */}
          <button
            className={`${styles.toolbarButton} ${editor.isActive("highlight") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11H1v3h8v3l3-3-3-3v3z" />
              <path d="M22 6L12 16l-3-3 10-10z" />
            </svg>
          </button>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Lists */}
          <button
            className={`${styles.toolbarButton} ${editor.isActive("bulletList") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive("orderedList") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 6h1v4" />
              <path d="M4 10h2" />
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </svg>
          </button>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Text Alignment Dropdown */}
          <select
            className={styles.formatSelect}
            value={
              editor.isActive({ textAlign: "center" })
                ? "center"
                : editor.isActive({ textAlign: "right" })
                  ? "right"
                  : editor.isActive({ textAlign: "justify" })
                    ? "justify"
                    : "left"
            }
            onChange={(e) => {
              const value = e.target.value;
              editor.chain().focus().setTextAlign(value).run();
            }}
            title="Text Alignment"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        {/* Upload and Save Buttons - Right aligned */}
        <div className={styles.saveSection}>
          <Upload onUpload={onUpload} disabled={disabled} />
          <button
            className={styles.saveButton}
            onClick={onSave}
            disabled={disabled}
            title="Save document"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          </button>
        </div>
      </div>
      {children && <div className={styles.toolbarChatbotRow}>{children}</div>}
    </div>
  );
};

export default FormattingToolbar;
