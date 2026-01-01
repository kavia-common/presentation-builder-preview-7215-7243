import React, { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Minimal, dependency-free Masonry-ish layout using CSS columns + drag-anywhere reordering.
 * Notes:
 * - Uses HTML5 drag events (supported broadly) and a small pointer-move heuristic so users
 *   can start dragging from anywhere on the tile.
 * - Does not attempt virtualization (smooth for typical small image counts).
 */

/**
 * PUBLIC_INTERFACE
 */
export default function MasonryDnD({
  items,
  getItemKey,
  renderItem,
  onReorder,
  onRemoveItem,
  columns = 4,
  gapPx = 8,
  ariaLabel = "Masonry list"
}) {
  /** Masonry grid with drag-anywhere reordering and optional removal. */
  const listId = useId();
  const dragFromIndexRef = useRef(null);
  const dragToIndexRef = useRef(null);

  // Pointer-based "drag anywhere" enabling:
  // We set draggable=true only after a small pointer move to avoid accidental drags when clicking.
  const [dragEnabledKey, setDragEnabledKey] = useState(null);
  const pointerStartRef = useRef(null);

  // Debounce reorder commits to parent (which persists to localStorage).
  const reorderTimerRef = useRef(null);

  const safeItems = Array.isArray(items) ? items : [];

  const keys = useMemo(() => {
    return safeItems.map((it, idx) => String(getItemKey?.(it, idx) ?? idx));
  }, [safeItems, getItemKey]);

  useEffect(() => {
    return () => {
      if (reorderTimerRef.current) window.clearTimeout(reorderTimerRef.current);
    };
  }, []);

  const scheduleReorderCommit = (fromIdx, toIdx) => {
    if (!Number.isFinite(fromIdx) || !Number.isFinite(toIdx)) return;
    if (fromIdx === toIdx) return;

    if (reorderTimerRef.current) window.clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = window.setTimeout(() => {
      onReorder?.(fromIdx, toIdx);
    }, 80);
  };

  const onPointerDownTile = (e, tileKey) => {
    // Only left click / primary touch
    if (e.button != null && e.button !== 0) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, key: tileKey };
    setDragEnabledKey(null);
  };

  const onPointerMoveTile = (e) => {
    const start = pointerStartRef.current;
    if (!start) return;

    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx + dy >= 6) {
      setDragEnabledKey(start.key);
    }
  };

  const onPointerUpTile = () => {
    pointerStartRef.current = null;
    // Keep drag enabled until dragend; but if no drag happened, clear.
    // We clear on next tick so click handlers aren't affected.
    window.setTimeout(() => setDragEnabledKey(null), 0);
  };

  const onDragStart = (idx) => (e) => {
    dragFromIndexRef.current = idx;
    dragToIndexRef.current = idx;

    // Required for Firefox to start a drag.
    try {
      e.dataTransfer.setData("text/plain", String(idx));
      e.dataTransfer.effectAllowed = "move";
    } catch (_err) {
      // ignore
    }
  };

  const onDragEnter = (idx) => (e) => {
    e.preventDefault();
    dragToIndexRef.current = idx;
  };

  const onDragOver = (e) => {
    // Required to allow drop.
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch (_err) {
      // ignore
    }
  };

  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragFromIndexRef.current;
    const to = idx;
    scheduleReorderCommit(from, to);
  };

  const onDragEnd = () => {
    // Commit if the user dragged and ended without an explicit drop target.
    const from = dragFromIndexRef.current;
    const to = dragToIndexRef.current;
    scheduleReorderCommit(from, to);

    dragFromIndexRef.current = null;
    dragToIndexRef.current = null;
    setDragEnabledKey(null);
  };

  return (
    <div
      aria-label={ariaLabel}
      role="list"
      id={listId}
      className="masonry"
      style={{
        columnCount: columns,
        columnGap: gapPx
      }}
      onDragOver={onDragOver}
    >
      {safeItems.map((item, idx) => {
        const key = keys[idx];
        const draggable = dragEnabledKey === key;

        return (
          <div
            key={key}
            role="listitem"
            className="masonryItem"
            style={{
              breakInside: "avoid",
              marginBottom: gapPx
            }}
            draggable={draggable}
            onPointerDown={(e) => onPointerDownTile(e, key)}
            onPointerMove={onPointerMoveTile}
            onPointerUp={onPointerUpTile}
            onPointerCancel={onPointerUpTile}
            onDragStart={onDragStart(idx)}
            onDragEnter={onDragEnter(idx)}
            onDrop={onDrop(idx)}
            onDragEnd={onDragEnd}
          >
            {renderItem?.(item, {
              index: idx,
              draggable,
              onRemove: onRemoveItem ? () => onRemoveItem(idx) : null
            })}
          </div>
        );
      })}
    </div>
  );
}
