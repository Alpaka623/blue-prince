"use client";

import { use, useMemo, useState } from "react";
import { useFindings } from "@/hooks/use-findings";
import { FindingsGrid } from "@/components/findings/findings-grid";
import { getCategoryConfig } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/findings/search-bar";
import { TagFilter } from "@/components/findings/tag-filter";
import { CategoryFilter } from "@/components/findings/category-filter";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const { findings, loading } = useFindings();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const cat = getCategoryConfig(category);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const f of findings) {
      if (f.category === category) {
        f.tags.forEach((t) => tags.add(t));
      }
    }
    return Array.from(tags).sort();
  }, [findings, category]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of findings) {
      c[f.category] = (c[f.category] || 0) + 1;
    }
    return c;
  }, [findings]);

  const filtered = useMemo(() => {
    let result = findings.filter((f) => f.category === category);
    
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
  }, [findings, category, selectedTags, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Alle Kategorien
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${cat.color}`}>
            <cat.icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cat.label}</h1>
            <p className="text-muted-foreground text-sm">
              {filtered.length} {filtered.length === 1 ? "Fund" : "Funde"}
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
            selected={category}
            counts={counts}
          />
        </div>
      </div>

      <FindingsGrid findings={filtered} loading={loading} />
    </div>
  );
}
