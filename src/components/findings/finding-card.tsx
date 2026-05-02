"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryConfig } from "@/lib/categories";
import type { Finding } from "@/lib/types";

export function FindingCard({ finding }: { finding: Finding }) {
  const cat = getCategoryConfig(finding.category);

  return (
    <Link href={`/finding/${finding.id}`}>
      <Card className="overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer h-full">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={finding.imageUrl}
            alt={finding.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <CardContent className="pt-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {finding.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cat.color}>
              {cat.icon && <cat.icon className="w-3 h-3 mr-1" />}
              {cat.label}
            </Badge>
            {Array.isArray(finding.tags) && finding.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {finding.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {finding.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
