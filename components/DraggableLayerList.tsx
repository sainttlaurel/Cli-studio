"use client";

import { useRef, useState, type ReactNode } from "react";
import type { DragEvent } from "react";
import { GripVertical } from "lucide-react";

interface Props<T extends { id: string }> {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
}

/**
 * Wraps a list of layer cards with a drag handle on each card.
 * Uses pointer events so it works on both mouse and touch screens.
 * Calls onReorder(fromIndex, toIndex) when the user drops.
 */
export function DraggableLayerList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: Props<T>) {
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    setOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === toIndex) {
      dragIndex.current = null;
      setOverIndex(null);
      return;
    }
    onReorder(dragIndex.current, toIndex);
    dragIndex.current = null;
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setOverIndex(null);
  };

  // Prevent default on dragover so drop fires
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`relative rounded-xl border bg-muted/40 transition-all ${
            overIndex === index
              ? "border-primary border-dashed scale-[1.01]"
              : "border-border"
          }`}
        >
          {/* Drag handle */}
          <div
            className="absolute left-2 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors z-10"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>

          {/* Card content — offset left to make room for handle */}
          <div className="pl-7 pr-0">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  );
}
