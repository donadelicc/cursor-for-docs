import React, { useState, useRef, useCallback } from "react";
import styles from "./ResizableContainer.module.css";

interface ResizableContainerProps {
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
  className?: string;
  minWidth?: number; // Minimum width percentage for each panel
  onResize?: (widths: [number, number, number]) => void;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
  children,
  className = "",
  minWidth = 20, // 20% minimum width
  onResize,
}) => {
  // State to track the width of each panel (as percentages)
  const [panelWidths, setPanelWidths] = useState<[number, number, number]>([
    33.33, 33.33, 33.34,
  ]);
  const [draggingDivider, setDraggingDivider] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    isDragging: number | null;
    startX: number;
    startWidths: [number, number, number];
  }>({
    isDragging: null,
    startX: 0,
    startWidths: [33.33, 33.33, 33.34],
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { isDragging, startX, startWidths } = dragStateRef.current;
      if (isDragging === null || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      const newWidths: [number, number, number] = [...startWidths];

      if (isDragging === 0) {
        // Dragging divider between Sources and Editor
        const leftChange = deltaPercent;
        const rightChange = -deltaPercent;

        const newLeftWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[0] + leftChange),
        );
        const newMiddleWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[1] + rightChange),
        );

        // Only update if both panels respect minimum width
        if (newLeftWidth >= minWidth && newMiddleWidth >= minWidth) {
          newWidths[0] = newLeftWidth;
          newWidths[1] = newMiddleWidth;
          // Keep the third panel unchanged
        }
      } else if (isDragging === 1) {
        // Dragging divider between Editor and Chatbot
        const leftChange = deltaPercent;
        const rightChange = -deltaPercent;

        const newMiddleWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[1] + leftChange),
        );
        const newRightWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[2] + rightChange),
        );

        // Only update if both panels respect minimum width
        if (newMiddleWidth >= minWidth && newRightWidth >= minWidth) {
          newWidths[1] = newMiddleWidth;
          newWidths[2] = newRightWidth;
          // Keep the first panel unchanged
        }
      }

      setPanelWidths(newWidths);
      onResize?.(newWidths);
    },
    [minWidth, onResize],
  );

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = null;
    setDraggingDivider(null);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (dividerIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragStateRef.current = {
        isDragging: dividerIndex,
        startX: e.clientX,
        startWidths: [...panelWidths],
      };
      setDraggingDivider(dividerIndex);

      // Add global mouse event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [panelWidths, handleMouseMove, handleMouseUp],
  );

  // Handle touch events for mobile
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const { isDragging, startX, startWidths } = dragStateRef.current;
      if (isDragging === null || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.touches[0].clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      const newWidths: [number, number, number] = [...startWidths];

      if (isDragging === 0) {
        const leftChange = deltaPercent;
        const rightChange = -deltaPercent;

        const newLeftWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[0] + leftChange),
        );
        const newMiddleWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[1] + rightChange),
        );

        if (newLeftWidth >= minWidth && newMiddleWidth >= minWidth) {
          newWidths[0] = newLeftWidth;
          newWidths[1] = newMiddleWidth;
        }
      } else if (isDragging === 1) {
        const leftChange = deltaPercent;
        const rightChange = -deltaPercent;

        const newMiddleWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[1] + leftChange),
        );
        const newRightWidth = Math.max(
          minWidth,
          Math.min(80, newWidths[2] + rightChange),
        );

        if (newMiddleWidth >= minWidth && newRightWidth >= minWidth) {
          newWidths[1] = newMiddleWidth;
          newWidths[2] = newRightWidth;
        }
      }

      setPanelWidths(newWidths);
      onResize?.(newWidths);
    },
    [minWidth, onResize],
  );

  const handleTouchEnd = useCallback(() => {
    dragStateRef.current.isDragging = null;
    setDraggingDivider(null);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  }, [handleTouchMove]);

  const handleTouchStart = useCallback(
    (dividerIndex: number, e: React.TouchEvent) => {
      e.preventDefault();
      dragStateRef.current = {
        isDragging: dividerIndex,
        startX: e.touches[0].clientX,
        startWidths: [...panelWidths],
      };
      setDraggingDivider(dividerIndex);

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [panelWidths, handleTouchMove, handleTouchEnd],
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.resizableContainer} ${className}`}
      style={
        {
          "--panel-1-width": `${panelWidths[0]}%`,
          "--panel-2-width": `${panelWidths[1]}%`,
          "--panel-3-width": `${panelWidths[2]}%`,
        } as React.CSSProperties
      }
    >
      {/* First Panel */}
      <div
        className={styles.panel}
        style={{
          flexBasis: `${panelWidths[0]}%`,
          width: `${panelWidths[0]}%`,
        }}
      >
        {children[0]}
      </div>

      {/* First Divider */}
      <div
        className={`${styles.divider} ${draggingDivider === 0 ? styles.dragging : ""}`}
        onMouseDown={(e) => handleMouseDown(0, e)}
        onTouchStart={(e) => handleTouchStart(0, e)}
      >
        <div className={styles.dividerHandle} />
      </div>

      {/* Second Panel */}
      <div
        className={styles.panel}
        style={{
          flexBasis: `${panelWidths[1]}%`,
          width: `${panelWidths[1]}%`,
        }}
      >
        {children[1]}
      </div>

      {/* Second Divider */}
      <div
        className={`${styles.divider} ${draggingDivider === 1 ? styles.dragging : ""}`}
        onMouseDown={(e) => handleMouseDown(1, e)}
        onTouchStart={(e) => handleTouchStart(1, e)}
      >
        <div className={styles.dividerHandle} />
      </div>

      {/* Third Panel */}
      <div
        className={styles.panel}
        style={{
          flexBasis: `${panelWidths[2]}%`,
          width: `${panelWidths[2]}%`,
        }}
      >
        {children[2]}
      </div>
    </div>
  );
};

export default ResizableContainer;
