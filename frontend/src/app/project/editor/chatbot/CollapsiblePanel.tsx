import React, { useState } from 'react';

interface CollapsiblePanelProps {
  children: React.ReactNode;
  title: string;
  position: 'left' | 'right';
  defaultOpen?: boolean;
  className?: string;
  sidebarIcons?: React.ReactNode[]; // Icons to show in collapsed sidebar
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  children,
  title,
  position,
  defaultOpen = false,
  className = '',
  sidebarIcons = [],
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`
        h-full flex flex-col transition-all duration-300 ease-in-out rounded-lg shadow-sm
        ${
          isOpen
            ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-800 border-none'
        }
        ${className}
      `}
      style={{
        width: isOpen
          ? 'calc((100vw - 920px - 96px) / 2)' // Half of remaining space after editor and margins
          : '48px', // Fixed narrow width when closed
      }}
    >
      {/* Toggle button at top */}
      <div
        className={`flex-shrink-0 px-4 py-3 transition-colors duration-200 ${isOpen ? 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800'}`}
      >
        {isOpen ? (
          // Open state: title and close button separated with better spacing
          <div className="flex items-center justify-between">
            {position === 'left' ? (
              <>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {title}
                </span>
                <button
                  onClick={togglePanel}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
                  title={`Close ${title}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM18 5h-8v14h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={togglePanel}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
                  title={`Close ${title}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zm8-16H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8z" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {title}
                </span>
              </>
            )}
          </div>
        ) : (
          // Closed state: sidebar toggle icon based on position
          <button
            onClick={togglePanel}
            className="w-full flex items-center justify-center py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 rounded-md transition-all duration-200"
            title={`Open ${title}`}
          >
            {position === 'left' ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM18 5h-8v14h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1" />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zm8-16H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Sidebar Icons - Only show when closed */}
      {!isOpen && sidebarIcons.length > 0 && (
        <div className="flex flex-col gap-3 p-2 bg-transparent">
          {sidebarIcons.map((icon, index) => (
            <div key={index} className="flex justify-center">
              {icon}
            </div>
          ))}
        </div>
      )}

      {/* Panel Content - Only show when open */}
      {isOpen && <div className="flex-1 min-h-0">{children}</div>}
    </div>
  );
};

export default CollapsiblePanel;
