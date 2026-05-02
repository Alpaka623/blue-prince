"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableFindingCard } from "./sortable-finding-card";
import type { Finding } from "@/lib/types";
import { Loader2, SearchX } from "lucide-react";
import { updateFindingsOrder } from "@/hooks/use-findings";

interface FindingsGridProps {
  findings: Finding[];
  loading: boolean;
}

export function FindingsGrid({ findings, loading }: FindingsGridProps) {
  const [items, setItems] = useState<Finding[]>(findings);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(findings);
  }, [findings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Keine Funde</h3>
        <p className="text-muted-foreground mt-1">
          Lade den ersten Fund hoch, um loszulegen!
        </p>
      </div>
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Save new order to Firestore
      // We use a timestamp-like order but strictly sequential based on current items
      // For simplicity, we just use the current timestamps/Date.now() but in reverse order 
      // so the top item has the highest number.
      const now = Date.now();
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order: now - index, // Ensure top items have higher numbers for descending sort
      }));

      try {
        await updateFindingsOrder(updates);
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((finding) => (
            <SortableFindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
