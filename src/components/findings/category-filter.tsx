"use client";

import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import type { FindingCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selected: FindingCategory | null;
  onSelect: (category: FindingCategory | null) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onSelect(null)}
        className={cn(selected === null && "text-primary")}
      >
        Alle
      </Button>
      {Object.entries(CATEGORIES).map(([key, { label, icon: Icon }]) => {
        const count = counts[key] || 0;
        if (count === 0) return null;
        return (
          <Button
            key={key}
            variant={selected === key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelect(key as FindingCategory)}
            className={cn(
              "gap-1.5",
              selected === key && "text-primary"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className="text-xs text-muted-foreground ml-0.5">
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
