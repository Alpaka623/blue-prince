"use client";

import { Button } from "@/components/ui/button";
import { getCategoryConfig } from "@/lib/categories";
import type { FindingCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CategoryFilterProps {
  selected: FindingCategory | null;
  counts: Record<string, number>;
}

export function CategoryFilter({ selected, counts }: CategoryFilterProps) {
  const sortedCategories = Object.keys(counts).sort((a, b) => {
    if (a === "allgemein") return -1;
    if (b === "allgemein") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/">
        <Button
          variant={selected === null ? "secondary" : "ghost"}
          size="sm"
          className={cn(selected === null && "text-primary")}
        >
          Alle
        </Button>
      </Link>
      {sortedCategories.map((key) => {
        const config = getCategoryConfig(key);
        const count = counts[key] || 0;
        return (
          <Link key={key} href={`/category/${key}`}>
            <Button
              variant={selected === key ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5",
                selected === key && "text-primary"
              )}
            >
              {config.icon && <config.icon className="w-3.5 h-3.5" />}
              {config.label}
              <span className="text-xs text-muted-foreground ml-0.5">
                {count}
              </span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
