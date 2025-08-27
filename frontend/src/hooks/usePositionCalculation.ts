import { useCallback, RefObject } from 'react';
import { Position } from '@/types/editor';

export const usePositionCalculation = (editorContainerRef: RefObject<HTMLDivElement | null>) => {
  const calculatePosition = useCallback(
    (rect: DOMRect): Position => {
      const editorRect = editorContainerRef.current?.getBoundingClientRect();
      if (!editorRect) return null;

      return {
        x: rect.left - editorRect.left + rect.width / 2,
        y: rect.bottom - editorRect.top + 10,
      };
    },
    [editorContainerRef],
  );

  return { calculatePosition };
};
