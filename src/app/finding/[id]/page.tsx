"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFinding, updateFinding } from "@/hooks/use-findings";
import { EditableField } from "@/components/findings/editable-field";
import { ContentRenderer } from "@/components/findings/content-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCategoryConfig } from "@/lib/categories";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Tag,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  NotebookPen,
  DoorClosed,
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "@/components/auth/session-context";

export default function FindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentSession } = useSession();
  const { finding, loading } = useFinding(id);
  const [imageOpen, setImageOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
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

  const cat = getCategoryConfig(finding.category);

  async function handleDelete() {
    if (!finding || !currentSession) return;
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
    await deleteDoc(
      doc(db, "sessions", currentSession.inviteCode, "findings", finding.id)
    );
    toast.success("Fund gelöscht.");
    router.push("/");
  }

  async function saveFinding(data: Parameters<typeof updateFinding>[2]) {
    if (!currentSession || !finding) return;
    await updateFinding(currentSession.inviteCode, finding.id, data);
  }

  function handleWheel(e: React.WheelEvent) {
    const zoomSpeed = 0.0005;
    setZoom((z) => {
      // Use a more granular approach for the initial zoom
      const factor = 1 - e.deltaY * zoomSpeed;
      const newZoom = z * factor;
      // Strictly limit minimum zoom to 1.0
      const clampedZoom = Math.min(5, Math.max(1, newZoom));
      
      // If we are zooming back to near 1, reset the offset to center the image
      if (clampedZoom <= 1.01) {
        setOffset({ x: 0, y: 0 });
      }
      
      return clampedZoom;
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1.01) return; // Allow small margin for zoom
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      if (zoom <= 1.01) return;
      setIsDragging(true);
      const touch = e.touches[0];
      setStartPos({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialDistance(dist);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - startPos.x,
        y: touch.clientY - startPos.y,
      });
    } else if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistance;
      setInitialDistance(dist);
      setZoom((z) => {
        const newZoom = z * factor;
        const clampedZoom = Math.min(5, Math.max(1, newZoom));
        if (clampedZoom <= 1.01) setOffset({ x: 0, y: 0 });
        return clampedZoom;
      });
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
    setInitialDistance(null);
  }

  function resetZoom() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Dialog open={imageOpen} onOpenChange={(open) => { setImageOpen(open); if (!open) resetZoom(); }}>
          <DialogTrigger
            className="overflow-hidden cursor-zoom-in group rounded-lg border border-border w-full bg-muted/30"
            onClick={() => setImageOpen(true)}
          >
            <div className="relative w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finding.imageUrl}
                alt={finding.title}
                className="w-full h-auto max-h-[60vh] object-contain group-hover:brightness-110 transition-all"
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
              <Button size="sm" variant="ghost" onClick={() => {
                setZoom((z) => {
                  const next = Math.max(1, z - 0.1);
                  if (next <= 1.01) setOffset({ x: 0, y: 0 });
                  return next;
                });
              }}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(5, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={resetZoom}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {/* Scrollable image container */}
            <div
              ref={imgContainerRef}
              className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 select-none touch-none relative"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finding.imageUrl}
                alt={finding.title}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  cursor: zoom > 1.01 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                }}
                draggable={false}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Details */}
        <div className="space-y-4">
          <EditableField
            value={finding.title}
            onSave={(title) => saveFinding({ title })}
            className="text-xl font-bold"
          />

          <div className="flex flex-col gap-3">
            {/* Category — now fully editable as text */}
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${cat.color} flex items-center justify-center min-w-7 h-7`}>
                {cat.icon && <cat.icon className="w-4 h-4" />}
              </div>
              <EditableField
                value={finding.category}
                onSave={(category) => saveFinding({ category })}
                className="text-sm font-medium"
                placeholder="Kategorie..."
              />
            </div>

            {/* Room — new editable field */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-muted">
                <DoorClosed className="w-4 h-4 text-muted-foreground" />
              </div>
              <EditableField
                value={finding.room || ""}
                onSave={(room) => saveFinding({ room })}
                className="text-sm text-muted-foreground"
                placeholder="Raum hinzufügen..."
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              {Array.isArray(finding.tags) && finding.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
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
                onSave={(extractedText) => saveFinding({ extractedText })}
                multiline
                className="font-mono text-xs whitespace-pre-wrap"
              />
            </div>
          )}

          {/* Description — secondary */}
          {finding.description && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> KI-Beschreibung
              </h3>
              <EditableField
                value={finding.description}
                onSave={(description) => saveFinding({ description })}
                multiline
                preview={
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finding.description}
                    </ReactMarkdown>
                  </div>
                }
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <NotebookPen className="w-3.5 h-3.5 text-primary" /> Notizen
            </h3>
            <EditableField
              value={finding.notes || ""}
              onSave={(notes) => saveFinding({ notes })}
              multiline
              placeholder="Eigene Notizen hinzufügen (Markdown unterstützt)..."
              preview={
                finding.notes ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finding.notes}
                    </ReactMarkdown>
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* Custom Content (Checklisten etc.) */}
      {finding.customContent && finding.customContent.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ContentRenderer
              blocks={finding.customContent}
              findingId={finding.id}
              inviteCode={currentSession?.inviteCode || ""}
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
