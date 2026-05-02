"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FindingCard } from "./finding-card";
import type { Finding } from "@/lib/types";
import { GripVertical } from "lucide-react";

interface SortableFindingCardProps {
  finding: Finding;
}

export function SortableFindingCard({ finding }: SortableFindingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: finding.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <FindingCard finding={finding} />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-black/60"
        title="Verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
