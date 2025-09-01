import React from 'react';

interface SuggestionToolbarProps {
  onAccept: () => void;
  onReject: () => void;
  intent?: 'replace' | 'add_after' | 'add_before';
  hasActiveSuggestion?: boolean;
}

const SuggestionToolbar: React.FC<SuggestionToolbarProps> = ({
  onAccept,
  onReject,
  intent,
  hasActiveSuggestion = false,
}) => {
  const handleAccept = () => {
    try {
      onAccept();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const handleReject = () => {
    try {
      onReject();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  return (
    <div className="static w-auto z-[1000] flex gap-2 bg-transparent p-0 rounded-md border-none shadow-none pointer-events-auto min-w-[120px] mb-0" aria-live="polite">
      <button
        onClick={handleAccept}
        className="py-1.5 px-3 border border-gray-300 rounded bg-white text-black text-base font-medium cursor-pointer transition-all duration-200 flex-1 min-w-[50px] flex items-center justify-center hover:-translate-y-px hover:bg-gray-50 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:transform-none disabled:hover:bg-white"
        title={`Accept suggestion (${intent || 'replace'})`}
        disabled={!hasActiveSuggestion}
      >
        ✓
      </button>
      <button
        onClick={handleReject}
        className="py-1.5 px-3 border border-gray-300 rounded bg-white text-black text-base font-medium cursor-pointer transition-all duration-200 flex-1 min-w-[50px] flex items-center justify-center hover:-translate-y-px hover:bg-gray-50 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:transform-none disabled:hover:bg-white"
        title="Reject suggestion"
        disabled={!hasActiveSuggestion}
      >
        ✕
      </button>
    </div>
  );
};

export default SuggestionToolbar;
