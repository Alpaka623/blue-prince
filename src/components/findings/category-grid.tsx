"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryConfig } from "@/lib/categories";
import type { Finding, FindingCategory } from "@/lib/types";
import { ChevronRight } from "lucide-react";

interface CategoryGridProps {
  findings: Finding[];
}

export function CategoryGrid({ findings }: CategoryGridProps) {
  // Get all unique categories from findings, with safety check
  const uniqueCategories = Array.from(new Set((findings || []).map(f => f.category)));
  
  const categoryGroups = uniqueCategories.map((cat) => {
    const items = findings.filter((f) => f.category === cat);
    return {
      key: cat,
      config: getCategoryConfig(cat),
      items,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categoryGroups.map((group) => (
        <Link key={group.key} href={`/category/${group.key}`}>
          <Card className="overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer h-full">
            {/* Collage Preview */}
            <div className="relative h-40 bg-muted flex overflow-hidden">
              {group.items.slice(0, 3).map((item) => (
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
              {group.items.length === 0 && (
                <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                  Keine Funde
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${group.config.color}`}>
                  <group.config.icon className="w-4 h-4" />
                </div>
                <span className="text-white font-semibold">{group.config.label}</span>
              </div>
            </div>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {group.items.length} {group.items.length === 1 ? "Fund" : "Funde"}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
