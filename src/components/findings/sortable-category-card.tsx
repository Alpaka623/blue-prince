"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, GripVertical } from "lucide-react";
import { DoorOpen } from "lucide-react";
import type { Finding } from "@/lib/types";

interface SortableCategoryCardProps {
  id: string;
  config: { label: string; icon?: typeof DoorOpen; color: string };
  items: Finding[];
}

export function SortableCategoryCard({ id, config, items }: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <Link href={`/category/${id}`} className="h-full block">
        <Card className="overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer h-full flex flex-col">
          {/* Collage Preview */}
          <div className="relative h-40 bg-muted flex overflow-hidden shrink-0">
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="relative flex-1 h-full border-r border-background last:border-r-0"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 33vw, 15vw"
                />
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                Keine Funde
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${config.color} flex items-center justify-center`}>
                {config.icon && <config.icon className="w-4 h-4" />}
              </div>
              <span className="text-white font-semibold">{config.label}</span>
            </div>
          </div>
          <CardContent className="p-4 flex items-center justify-between flex-1">
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "Fund" : "Funde"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </Link>
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-black/60 z-10"
        title="Verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
