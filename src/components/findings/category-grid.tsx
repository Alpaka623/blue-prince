"use client";

import { useMemo } from "react";
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
import { SortableCategoryCard } from "./sortable-category-card";
import { getCategoryConfig } from "@/lib/categories";
import type { Finding } from "@/lib/types";
import { useSettings, updateCategoryOrder } from "@/hooks/use-findings";
import { useSession } from "@/components/auth/session-context";

interface CategoryGridProps {
  findings: Finding[];
}

export function CategoryGrid({ findings }: CategoryGridProps) {
  const { currentSession } = useSession();
  const { categoryOrder, loading: settingsLoading } = useSettings();

  // Calculate unique categories and merge with global order
  const items = useMemo(() => {
    const uniqueCategories = Array.from(new Set((findings || []).map(f => f.category)));
    
    // Sort based on global categoryOrder, then append new ones
    const sorted = [...categoryOrder];
    
    // Remove categories from order that no longer exist in findings
    const existing = sorted.filter(cat => uniqueCategories.includes(cat));
    
    // Add new categories that are not yet in the order
    const newOnes = uniqueCategories.filter(cat => !existing.includes(cat));
    
    return [...existing, ...newOnes];
  }, [findings, categoryOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);

      const newItems = arrayMove(items, oldIndex, newIndex);

      try {
        if (!currentSession) return;
        await updateCategoryOrder(currentSession.inviteCode, newItems);
      } catch (error) {
        console.error("Failed to save category order:", error);
      }
    }
  }

  if (settingsLoading) return null;

  const categoryGroups = items.map((cat) => {
    const groupItems = findings.filter((f) => f.category === cat);
    return {
      key: cat,
      config: getCategoryConfig(cat),
      items: groupItems,
    };
  }).filter(g => g.items.length > 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryGroups.map((group) => (
            <SortableCategoryCard
              key={group.key}
              id={group.key}
              config={group.config}
              items={group.items}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
