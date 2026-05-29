"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OptionChipsProps {
  label: string;
  options: string[];
  onSelect: (option: string) => void;
  selected?: string[];
}

export function OptionChips({
  label,
  options,
  onSelect,
  selected = [],
}: OptionChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Button
              key={option}
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => onSelect(option)}
            >
              <Badge
                variant={isSelected ? "default" : "secondary"}
                className="cursor-pointer"
              >
                {option}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
