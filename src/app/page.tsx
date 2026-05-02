"use client";

import { useState, useMemo } from "react";
import { useFindings } from "@/hooks/use-findings";
import { FindingsGrid } from "@/components/findings/findings-grid";
import { CategoryFilter } from "@/components/findings/category-filter";
import { SearchBar } from "@/components/findings/search-bar";
import { CategoryGrid } from "@/components/findings/category-grid";
import { TagFilter } from "@/components/findings/tag-filter";
import type { FindingCategory } from "@/lib/types";

export default function HomePage() {
  const { findings, loading } = useFindings();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const f of findings) {
      f.tags.forEach((t) => tags.add(t));
    }
    return Array.from(tags).sort();
  }, [findings]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of findings) {
      c[f.category] = (c[f.category] || 0) + 1;
    }
    return c;
  }, [findings]);

  const filtered = useMemo(() => {
    let result = findings;
    if (selectedTags.length > 0) {
      result = result.filter((f) =>
        selectedTags.every((tag) => f.tags.includes(tag))
      );
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
  }, [findings, selectedTags, search]);

  const isFiltering = search || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funde</h1>
          <p className="text-muted-foreground mt-1">
            {findings.length} {findings.length === 1 ? "Fund" : "Funde"} gesammelt
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onToggleTag={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
            onClear={() => setSelectedTags([])}
          />
        </div>
        <CategoryFilter
          selected={null}
          counts={counts}
        />
      </div>

      {isFiltering ? (
        <FindingsGrid findings={filtered} loading={loading} />
      ) : (
        <CategoryGrid
          findings={findings}
        />
      )}
    </div>
  );
}
