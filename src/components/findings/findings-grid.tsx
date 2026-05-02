"use client";

import { FindingCard } from "./finding-card";
import type { Finding } from "@/lib/types";
import { Loader2, SearchX } from "lucide-react";

interface FindingsGridProps {
  findings: Finding[];
  loading: boolean;
}

export function FindingsGrid({ findings, loading }: FindingsGridProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
