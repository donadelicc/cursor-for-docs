import React, { useState, useRef, useEffect } from 'react';

export interface OpenItem {
  id: string;
  kind: 'editor' | 'pdf';
  title: string;
}

interface WorkspaceTabsProps {
  items: OpenItem[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
}

const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({ items, activeId, onActivate, onClose, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (item: OpenItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow renaming editor documents, not PDFs
    if (item.kind === 'editor' && onRename) {
      setEditingId(item.id);
      setEditingValue(item.title);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing(itemId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const finishEditing = (itemId: string) => {
    if (editingValue.trim() && onRename) {
      onRename(itemId, editingValue.trim());
    }
    setEditingId(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  return (
    <div className="flex gap-0.5 items-stretch px-2 h-9 border-b border-gray-300 bg-gray-50 whitespace-nowrap overflow-x-auto overflow-y-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className={`inline-flex items-center gap-2 h-7 my-1 px-2.5 rounded-t-md cursor-pointer select-none ${
            activeId === item.id 
              ? 'bg-white text-gray-900 shadow-[0_-1px_0_#ffffff,inset_0_1px_0_#e5e7eb,inset_1px_0_0_#e5e7eb,inset_-1px_0_0_#e5e7eb]' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onActivate(item.id)}
          onDoubleClick={(e) => handleDoubleClick(item, e)}
        >
          {editingId === item.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, item.id)}
              onBlur={() => finishEditing(item.id)}
              className="text-xs leading-none bg-transparent border-none outline-none min-w-0 w-20"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs leading-none">{item.title}</span>
          )}
          {item.id !== 'document' && (
            <button
              className="appearance-none border-none bg-transparent text-gray-500 cursor-pointer py-0.5 px-1 rounded hover:bg-gray-100 hover:text-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                onClose(item.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkspaceTabs;
