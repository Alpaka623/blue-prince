"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  preview?: React.ReactNode;
}

export function EditableField({
  value,
  onSave,
  multiline = false,
  className = "",
  placeholder = "Klicke zum Bearbeiten...",
  preview,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  function handleSave() {
    if (draft !== value) {
      onSave(draft);
    }
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    const Component = multiline ? Textarea : Input;
    return (
      <div className="space-y-2">
        <Component
          ref={inputRef as never}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !multiline) handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          rows={multiline ? 4 : undefined}
          className={className}
        />
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="w-3.5 h-3.5 mr-1" /> Speichern
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="w-3.5 h-3.5 mr-1" /> Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors ${className}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      <div className="flex items-start gap-2">
        <div className={`flex-1 ${!value ? "text-muted-foreground italic" : ""}`}>
          {preview || value || placeholder}
        </div>
        <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
      </div>
    </div>
  );
}
