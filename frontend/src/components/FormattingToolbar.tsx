import React, { ReactNode } from 'react';
import { Editor } from '@tiptap/react';
import { Export } from './Export';
import { SaveFormat } from './SaveButton';

interface FormattingToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  // Export props
  onExportSave?: (format: SaveFormat, filename: string) => void;
  documentContent?: string;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  onSave,
  disabled = false,
  children,
  onExportSave,
  documentContent,
}) => {
  // Show simplified toolbar when editor is not ready
  if (!editor) {
    return (
      <div className="relative">
        <div className="flex items-center px-4 py-1.5 bg-transparent border-none rounded-xl gap-1 min-h-[40px] relative z-10 pointer-events-auto overflow-visible flex-nowrap">
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-gray-400 dark:text-gray-500 text-sm">Loading editor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl gap-1 min-h-[40px] relative z-10 pointer-events-auto overflow-visible flex-nowrap xl:px-3.5 xl:gap-0.5 xl:min-h-[44px] lg:px-2.5 lg:gap-px lg:min-h-[40px] transition-colors duration-200">
        {/* Export Button - Only show if required props are provided */}
        {onExportSave && documentContent !== undefined && (
          <>
            <div className="flex items-center gap-0.5 shrink-0">
              <Export onSave={onExportSave} documentContent={documentContent} disabled={disabled} />
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1.5 shrink-0"></div>
          </>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Undo/Redo */}
          <button
            className="flex items-center justify-center w-8 h-8 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 rounded-md cursor-pointer text-gray-700 dark:text-gray-200 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 active:bg-blue-100 dark:active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 xl:w-8 xl:h-8 lg:w-7 lg:h-7 shadow-sm"
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
            className="flex items-center justify-center w-8 h-8 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 rounded-md cursor-pointer text-gray-700 dark:text-gray-200 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-500 active:bg-blue-100 dark:active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 xl:w-8 xl:h-8 lg:w-7 lg:h-7 shadow-sm"
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Text Styles Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 cursor-pointer min-w-[120px] w-[120px] h-9 shrink-0 font-medium shadow-sm transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 xl:min-w-[110px] xl:w-[110px] xl:h-[34px] xl:text-xs lg:min-w-[90px] lg:w-[90px] lg:h-[30px] lg:text-xs"
            value={
              editor.isActive('heading', { level: 1 })
                ? 'h1'
                : editor.isActive('heading', { level: 2 })
                  ? 'h2'
                  : editor.isActive('heading', { level: 3 })
                    ? 'h3'
                    : 'paragraph'
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else if (value === 'h1') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (value === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (value === 'h3') {
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Font Family Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 cursor-pointer min-w-[110px] w-[110px] h-9 shrink-0 font-medium shadow-sm transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 xl:min-w-[100px] xl:w-[100px] xl:h-[34px] xl:text-xs lg:min-w-[85px] lg:w-[85px] lg:h-[30px] lg:text-xs"
            value={(() => {
              const currentFont = editor.getAttributes('textStyle').fontFamily;
              if (!currentFont) return 'Arial';

              // Normalize the font value for better matching
              const normalized = currentFont.toLowerCase().replace(/['"]/g, '');

              if (normalized.includes('arial')) return 'Arial';
              if (normalized.includes('helvetica')) return 'Helvetica';
              if (normalized.includes('times')) return 'Times New Roman, serif';
              if (normalized.includes('georgia')) return 'Georgia, serif';
              if (normalized.includes('courier')) return 'Courier New, monospace';
              if (normalized.includes('monaco')) return 'Monaco, monospace';
              if (normalized.includes('verdana')) return 'Verdana, sans-serif';
              if (normalized.includes('tahoma')) return 'Tahoma, sans-serif';
              if (normalized.includes('comic sans')) return 'Comic Sans MS, cursive';
              if (normalized.includes('impact')) return 'Impact, sans-serif';

              return currentFont;
            })()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'Arial') {
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Font Size Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 cursor-pointer min-w-[80px] w-[80px] h-9 shrink-0 font-medium shadow-sm transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 xl:min-w-[70px] xl:w-[70px] xl:h-[34px] xl:text-xs lg:min-w-[60px] lg:w-[60px] lg:h-[30px] lg:text-xs"
            value={(() => {
              const fontSize = editor.getAttributes('textStyle').fontSize;
              if (!fontSize) return '11pt';
              return fontSize;
            })()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '11pt') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(value).run();
              }
            }}
            title="Font Size"
          >
            <option value="8pt">8pt</option>
            <option value="9pt">9pt</option>
            <option value="10pt">10pt</option>
            <option value="11pt">11pt</option>
            <option value="12pt">12pt</option>
            <option value="14pt">14pt</option>
            <option value="16pt">16pt</option>
            <option value="18pt">18pt</option>
            <option value="20pt">20pt</option>
            <option value="22pt">22pt</option>
            <option value="24pt">24pt</option>
            <option value="26pt">26pt</option>
            <option value="28pt">28pt</option>
            <option value="36pt">36pt</option>
            <option value="48pt">48pt</option>
            <option value="72pt">72pt</option>
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Line Spacing Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 cursor-pointer min-w-[80px] w-[80px] h-9 shrink-0 font-medium shadow-sm transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 xl:min-w-[70px] xl:w-[70px] xl:h-[34px] xl:text-xs lg:min-w-[60px] lg:w-[60px] lg:h-[30px] lg:text-xs"
            value={(() => {
              const lineHeight = editor.getAttributes('textStyle').lineHeight;
              if (!lineHeight) return '1.15';
              return lineHeight;
            })()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '1.15') {
                editor.chain().focus().unsetLineHeight().run();
              } else {
                editor.chain().focus().setLineHeight(value).run();
              }
            }}
            title="Line Spacing"
          >
            <option value="1.0">Single</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2.0">Double</option>
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Text Formatting Buttons */}
          <button
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 dark:text-gray-300 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('bold') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 dark:text-gray-300 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('italic') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('underline') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('strike') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('highlight') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Text Alignment Buttons */}
          <button
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' })) ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Lists */}
          <button
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('bulletList') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('orderedList') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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

        <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0"></div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Code Buttons */}
          <button
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('code') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
            className={`flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer text-gray-700 transition-all duration-200 p-0 relative z-[101] pointer-events-auto shrink-0 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700 xl:w-8 xl:h-8 lg:w-7 lg:h-7 ${editor.isActive('codeBlock') ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-500 shadow-md' : ''}`}
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
          <div className="ml-5 flex items-center gap-1.5 shrink-0">
            <button
              className="flex items-center justify-center p-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer transition-all duration-200 shadow-sm w-8 h-8 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 disabled:hover:shadow-sm xl:w-8 xl:h-8 lg:w-7 lg:h-7"
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
      {children && <div>{children}</div>}
    </div>
  );
};

export default FormattingToolbar;
