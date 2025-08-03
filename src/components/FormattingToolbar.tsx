import React, { ReactNode } from "react";
import { Editor } from "@tiptap/react";
import styles from "./FormattingToolbar.module.css";
import { FileMenu } from "./FileMenu";
import { SaveFormat } from "./SaveButton";

interface FormattingToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
  onUpload?: (file: File) => Promise<void>;
  disabled?: boolean;
  children?: ReactNode;
  // FileMenu props
  onExportSave?: (format: SaveFormat, filename: string) => void;
  documentContent?: string;
  currentDocumentId?: string;
  currentDocumentTitle?: string;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  onSave,
  onUpload,
  disabled = false,
  children,
  onExportSave,
  documentContent,
  currentDocumentId,
  currentDocumentTitle,
}) => {
  // Show simplified toolbar when editor is not ready
  if (!editor) {
    return (
      <div className={styles.toolbarContainer}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarSection}>
            <span className="text-gray-400 text-sm">Loading editor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbar}>
        {/* File Menu - Only show if required props are provided */}
        {onExportSave && documentContent !== undefined && (
          <>
            <div className={styles.toolbarSection}>
              <FileMenu
                onSave={onExportSave}
                onUpload={onUpload || (() => Promise.resolve())}
                documentContent={documentContent}
                currentDocumentId={currentDocumentId}
                currentDocumentTitle={currentDocumentTitle}
                disabled={disabled}
              />
            </div>
            <div className={styles.separator}></div>
          </>
        )}

        <div className={styles.toolbarSection}>
          {/* Undo/Redo */}
          <button
            className={styles.toolbarButton}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
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
            disabled={!editor.can().chain().focus().redo().run()}
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
          {/* Text Styles Dropdown */}
          <select
            className={styles.styleSelectWide}
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
            <option value="paragraph">Normal text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Font Family Dropdown */}
          <select
            className={styles.fontSelect}
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
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>

        <div className={styles.separator}></div>

        <div className={styles.toolbarSection}>
          {/* Text Formatting Buttons */}
          <button
            className={`${styles.toolbarButton} ${editor.isActive("bold") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive("italic") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive("underline") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive("strike") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 16h12" />
              <path d="M8 12h8" />
              <path d="M8.5 8.5C8.5 7.12 9.62 6 11 6h2c1.38 0 2.5 1.12 2.5 2.5" />
              <path d="M8.5 15.5C8.5 16.88 9.62 18 11 18h2c1.38 0 2.5-1.12 2.5-2.5" />
            </svg>
          </button>
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
          {/* Text Alignment Buttons */}
          <button
            className={`${styles.toolbarButton} ${editor.isActive({ textAlign: "left" }) || (!editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" }) && !editor.isActive({ textAlign: "justify" })) ? styles.active : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            title="Align Left"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="11" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive({ textAlign: "center" }) ? styles.active : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            title="Align Center"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="10" x2="6" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="16" y1="14" x2="8" y2="14" />
              <line x1="19" y1="18" x2="5" y2="18" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive({ textAlign: "right" }) ? styles.active : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            title="Align Right"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="11" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive({ textAlign: "justify" }) ? styles.active : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            title="Justify"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="3" y2="18" />
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
          {/* Code Buttons */}
          <button
            className={`${styles.toolbarButton} ${editor.isActive("code") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="16,18 22,12 16,6" />
              <polyline points="8,6 2,12 8,18" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${editor.isActive("codeBlock") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>
        </div>

        {/* Save Button - Right aligned - Only show if prop provided */}
        {onSave && (
          <div className={styles.saveSection}>
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
        )}
      </div>
      {children && <div className={styles.toolbarChatbotRow}>{children}</div>}
    </div>
  );
};

export default FormattingToolbar;
