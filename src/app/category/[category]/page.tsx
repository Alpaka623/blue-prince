"use client";

import { use, useMemo } from "react";
import { useFindings } from "@/hooks/use-findings";
import { FindingsGrid } from "@/components/findings/findings-grid";
import { CATEGORIES } from "@/lib/categories";
import type { FindingCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const { findings, loading } = useFindings();
  const cat = CATEGORIES[category as FindingCategory];

  const filtered = useMemo(
    () => findings.filter((f) => f.category === category),
    [findings, category]
  );

  return (
    <div className="space-y-6">
      <Link href="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {cat && <cat.icon className="w-6 h-6" />}
          {cat?.label || category}
        </h1>
        <p className="text-muted-foreground mt-1">
          {filtered.length} {filtered.length === 1 ? "Fund" : "Funde"}
        </p>
      </div>

      <FindingsGrid findings={filtered} loading={loading} />
    </div>
  );
}
