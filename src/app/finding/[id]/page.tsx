"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFinding, updateFinding } from "@/hooks/use-findings";
import { EditableField } from "@/components/findings/editable-field";
import { ContentRenderer } from "@/components/findings/content-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import type { FindingCategory } from "@/lib/types";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
  Tag,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  NotebookPen,
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function FindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { finding, loading } = useFinding(id);
  const [imageOpen, setImageOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Fund nicht gefunden</h2>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </div>
    );
  }

  const cat = CATEGORIES[finding.category];

  async function handleDelete() {
    if (!finding) return;
    if (!confirm("Diesen Fund wirklich löschen?")) return;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: finding.imagePath }),
      });
    } catch {
      // best-effort
    }
    await deleteDoc(doc(db, "findings", finding.id));
    toast.success("Fund gelöscht.");
    router.push("/");
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.5, z - e.deltaY * 0.001)));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Dialog open={imageOpen} onOpenChange={(open) => { setImageOpen(open); if (!open) setZoom(1); }}>
          <DialogTrigger
            className="overflow-hidden cursor-zoom-in group rounded-lg border border-border"
            onClick={() => setImageOpen(true)}
          >
            <div className="relative aspect-video">
              <Image
                src={finding.imageUrl}
                alt={finding.title}
                fill
                className="object-contain bg-black/20 group-hover:brightness-110 transition-all"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 rounded-full p-2">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 flex flex-col overflow-hidden">
            {/* Zoom controls */}
            <div className="flex items-center gap-2 p-2 border-b border-border bg-background/80 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(5, z + 0.25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(1)}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {/* Scrollable image container */}
            <div
              ref={imgContainerRef}
              className="flex-1 overflow-auto flex items-center justify-center bg-black/50"
              onWheel={handleWheel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finding.imageUrl}
                alt={finding.title}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.1s ease",
                  maxWidth: zoom <= 1 ? "100%" : "none",
                  maxHeight: zoom <= 1 ? "100%" : "none",
                  cursor: zoom > 1 ? "grab" : "zoom-in",
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Details */}
        <div className="space-y-4">
          <EditableField
            value={finding.title}
            onSave={(title) => updateFinding(finding.id, { title })}
            className="text-xl font-bold"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={finding.category}
              onValueChange={(v) =>
                updateFinding(finding.id, { category: v as FindingCategory })
              }
            >
              <SelectTrigger className="w-fit">
                <SelectValue>
                  <Badge variant="outline" className={cat.color}>
                    <cat.icon className="w-3 h-3 mr-1" />
                    {cat.label}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {finding.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Extracted Text — shown prominently */}
          {finding.extractedText && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Text
              </h3>
              <EditableField
                value={finding.extractedText}
                onSave={(extractedText) => updateFinding(finding.id, { extractedText })}
                multiline
                className="font-mono text-xs whitespace-pre-wrap"
              />
            </div>
          )}

          {/* Description — secondary */}
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> KI-Beschreibung
            </h3>
            <EditableField
              value={finding.description}
              onSave={(description) => updateFinding(finding.id, { description })}
              multiline
              placeholder="Keine Beschreibung..."
              className="text-sm text-muted-foreground"
            />
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <NotebookPen className="w-3.5 h-3.5 text-primary" /> Notizen
            </h3>
            <EditableField
              value={finding.notes || ""}
              onSave={(notes) => updateFinding(finding.id, { notes })}
              multiline
              placeholder="Eigene Notizen hinzufügen..."
            />
          </div>

          {finding.customPrompt && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> KI-Anweisung
              </h3>
              <p className="text-xs text-muted-foreground italic">
                &quot;{finding.customPrompt}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Content (Checklisten etc.) */}
      {finding.customContent && finding.customContent.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ContentRenderer
              blocks={finding.customContent}
              findingId={finding.id}
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Fund löschen
        </Button>
      </div>
    </div>
  );
}
