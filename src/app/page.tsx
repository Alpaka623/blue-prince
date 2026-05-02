"use client";

import { useState, useMemo } from "react";
import { useFindings } from "@/hooks/use-findings";
import { FindingsGrid } from "@/components/findings/findings-grid";
import { CategoryFilter } from "@/components/findings/category-filter";
import { SearchBar } from "@/components/findings/search-bar";
import type { FindingCategory } from "@/lib/types";

export default function HomePage() {
  const { findings, loading } = useFindings();
  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | null>(null);
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of findings) {
      c[f.category] = (c[f.category] || 0) + 1;
    }
    return c;
  }, [findings]);

  const filtered = useMemo(() => {
    let result = findings;
    if (selectedCategory) {
      result = result.filter((f) => f.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          (f.extractedText && f.extractedText.toLowerCase().includes(q))
      );
    }
    return result;
  }, [findings, selectedCategory, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funde</h1>
        <p className="text-muted-foreground mt-1">
          {findings.length} {findings.length === 1 ? "Fund" : "Funde"} gesammelt
        </p>
      </div>

      <div className="space-y-4">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          counts={counts}
        />
      </div>

      <FindingsGrid findings={filtered} loading={loading} />
    </div>
  );
}
