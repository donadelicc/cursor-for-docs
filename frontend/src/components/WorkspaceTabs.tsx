import React from 'react';
import styles from './WorkspaceTabs.module.css';

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
}

const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({ items, activeId, onActivate, onClose }) => {
  return (
    <div className={styles.tabs}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${styles.tab} ${activeId === item.id ? styles.active : ''}`}
          onClick={() => onActivate(item.id)}
        >
          <span className={styles.title}>{item.title}</span>
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              onClose(item.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default WorkspaceTabs;
