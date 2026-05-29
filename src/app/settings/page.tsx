"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save, Settings, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  deleteTagFromFindings,
  renameCategoryInFindings,
  useFindings,
  useSettings,
} from "@/hooks/use-findings";
import { useSession } from "@/components/auth/session-context";
import { getExistingCategories, getExistingTags } from "@/lib/finding-options";
import { getCategoryConfig } from "@/lib/categories";

type PendingAction =
  | { type: "category"; value: string }
  | { type: "tag"; value: string }
  | null;

export default function SettingsPage() {
  const { currentSession } = useSession();
  const { findings, loading: findingsLoading } = useFindings();
  const { categoryOrder, loading: settingsLoading } = useSettings();
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PendingAction>(null);

  const categories = useMemo(() => getExistingCategories(findings), [findings]);
  const tags = useMemo(() => getExistingTags(findings), [findings]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const finding of findings) {
      counts[finding.category] = (counts[finding.category] || 0) + 1;
    }

    return counts;
  }, [findings]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const finding of findings) {
      const findingTags = Array.isArray(finding.tags) ? finding.tags : [];

      for (const tag of new Set(findingTags)) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }

    return counts;
  }, [findings]);

  const loading = findingsLoading || settingsLoading;

  function updateCategoryDraft(category: string, value: string) {
    setCategoryDrafts((drafts) => ({
      ...drafts,
      [category]: value,
    }));
  }

  async function handleRenameCategory(event: FormEvent, category: string) {
    event.preventDefault();
    if (!currentSession) return;

    const nextCategory = (categoryDrafts[category] ?? category).trim();
    if (!nextCategory || nextCategory === category) return;

    const mergeHint =
      categories.includes(nextCategory) &&
      !confirm(
        `"${nextCategory}" existiert schon. Kategorien wirklich zusammenführen?`
      );

    if (mergeHint) return;

    setPending({ type: "category", value: category });
    try {
      const count = await renameCategoryInFindings(
        currentSession.inviteCode,
        findings,
        categoryOrder,
        category,
        nextCategory
      );
      toast.success(`${count} ${count === 1 ? "Fund" : "Funde"} aktualisiert.`);
    } catch (error) {
      console.error("Failed to rename category:", error);
      toast.error("Kategorie konnte nicht umbenannt werden.");
    } finally {
      setPending(null);
    }
  }

  async function handleDeleteTag(tag: string) {
    if (!currentSession) return;

    const count = tagCounts[tag] || 0;
    if (!confirm(`"${tag}" aus ${count} ${count === 1 ? "Fund" : "Funden"} entfernen?`)) {
      return;
    }

    setPending({ type: "tag", value: tag });
    try {
      const updatedCount = await deleteTagFromFindings(
        currentSession.inviteCode,
        findings,
        tag
      );
      toast.success(`${updatedCount} ${updatedCount === 1 ? "Fund" : "Funde"} aktualisiert.`);
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Tag konnte nicht gelöscht werden.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Settings className="w-6 h-6 text-primary" />
            Einstellungen
          </h1>
          <p className="text-sm text-muted-foreground">
            Kategorien und Tags für das ganze Board verwalten.
          </p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/" />}>
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Darstellung</h2>
              <p className="text-sm text-muted-foreground">
                Zwischen heller und dunkler Oberfläche wechseln.
              </p>
            </div>
            <ThemeToggle />
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Kategorien</h2>
              <p className="text-sm text-muted-foreground">
                Umbenennen wirkt auf alle Funde mit dieser Kategorie.
              </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {categories.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Noch keine Kategorien vorhanden.
                </p>
              ) : (
                categories.map((category) => {
                  const categoryConfig = getCategoryConfig(category);
                  const Icon = categoryConfig.icon;
                  const draft = categoryDrafts[category] ?? category;
                  const isPending =
                    pending?.type === "category" && pending.value === category;

                  return (
                    <form
                      key={category}
                      onSubmit={(event) => handleRenameCategory(event, category)}
                      className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)_auto] sm:items-center"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={categoryConfig.color}>
                          {Icon && <Icon className="w-3 h-3" />}
                          {category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {categoryCounts[category] || 0}
                        </span>
                      </div>

                      <Input
                        value={draft}
                        onChange={(event) =>
                          updateCategoryDraft(category, event.target.value)
                        }
                        aria-label={`Kategorie ${category} umbenennen`}
                      />

                      <Button
                        type="submit"
                        size="sm"
                        disabled={!draft.trim() || draft.trim() === category || pending !== null}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Speichern
                      </Button>
                    </form>
                  );
                })
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Tags</h2>
              <p className="text-sm text-muted-foreground">
                Löschen entfernt den Tag aus jedem Fund.
              </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {tags.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Noch keine Tags vorhanden.
                </p>
              ) : (
                tags.map((tag) => {
                  const isPending = pending?.type === "tag" && pending.value === tag;

                  return (
                    <div
                      key={tag}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {tagCounts[tag] || 0}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={pending !== null}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Löschen
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
