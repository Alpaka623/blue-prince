"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionChips } from "@/components/findings/option-chips";
import { parseTagInput } from "@/lib/finding-options";
import { Check, Pencil, X } from "lucide-react";

interface TagsEditorProps {
  tags: string[];
  suggestions: string[];
  onSave: (tags: string[]) => void;
}

function formatTags(tags: string[]) {
  return tags.join(", ");
}

export function TagsEditor({ tags, suggestions, onSave }: TagsEditorProps) {
  const safeTags = Array.isArray(tags) ? tags : [];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatTags(safeTags));
  const draftTags = parseTagInput(draft);

  function addTag(tag: string) {
    setDraft(formatTags(Array.from(new Set([...draftTags, tag]))));
  }

  function handleSave() {
    onSave(draftTags);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(formatTags(safeTags));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSave();
            if (event.key === "Escape") handleCancel();
          }}
          placeholder="Tags mit Komma trennen"
        />
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="w-3.5 h-3.5 mr-1" /> Speichern
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="w-3.5 h-3.5 mr-1" /> Abbrechen
          </Button>
        </div>
        <OptionChips
          label="Vorhandene Tags"
          options={suggestions}
          selected={draftTags}
          onSelect={addTag}
        />
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors"
      onClick={() => {
        setDraft(formatTags(safeTags));
        setEditing(true);
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          {safeTags.length > 0 ? (
            safeTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Tags hinzufügen...
            </span>
          )}
        </div>
        <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
      </div>
    </div>
  );
}
