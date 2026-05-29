"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  DoorClosed,
  FileText,
  ImagePlus,
  Loader2,
  PencilLine,
  Sparkles,
  Tag,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useFindings } from "@/hooks/use-findings";
import { useSession } from "@/components/auth/session-context";
import { OptionChips } from "@/components/findings/option-chips";
import {
  getExistingCategories,
  getExistingTags,
  parseTagInput,
} from "@/lib/finding-options";

type CreationMode = "ai" | "manual";

type FindingDetails = {
  title: string;
  category: string;
  description: string;
  extractedText?: string;
  tags: string[];
  customContent?: unknown[];
};

function getFileTitle(file: File) {
  return file.name.replace(/\.[^.]+$/, "");
}

export default function UploadPage() {
  const router = useRouter();
  const { currentSession } = useSession();
  const { findings } = useFindings();
  const existingCategories = useMemo(
    () => getExistingCategories(findings),
    [findings]
  );
  const existingTags = useMemo(() => getExistingTags(findings), [findings]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<CreationMode>("ai");
  const [customPrompt, setCustomPrompt] = useState("");
  const [room, setRoom] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("allgemein");
  const [manualDescription, setManualDescription] = useState("");
  const [manualExtractedText, setManualExtractedText] = useState("");
  const [manualTags, setManualTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const selectedManualTags = useMemo(
    () => parseTagInput(manualTags),
    [manualTags]
  );

  function toggleManualTag(tag: string) {
    setManualTags(
      selectedManualTags.includes(tag)
        ? selectedManualTags.filter((selectedTag) => selectedTag !== tag).join(", ")
        : Array.from(new Set([...selectedManualTags, tag])).join(", ")
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    setManualTitle((current) => current || getFileTitle(selected));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !currentSession) return;

    if (mode === "manual" && !manualTitle.trim()) {
      toast.error("Bitte gib einen Titel ein.");
      return;
    }

    setUploading(true);

    try {
      setStatus("Bild wird hochgeladen...");
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      const { imageUrl, imagePath } = await uploadResponse.json();

      let findingDetails: FindingDetails;

      if (mode === "ai") {
        setStatus("KI analysiert das Bild...");
        
        // Compress and resize image for AI (max 1600px)
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          const img = new window.Image();
          img.src = preview!;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxSide = 1600;

            if (width > maxSide || height > maxSide) {
              if (width > height) {
                height = (height / width) * maxSide;
                width = maxSide;
              } else {
                width = (width / height) * maxSide;
                height = maxSide;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
          };
          img.onerror = reject;
        });

        try {
          console.log("Starting AI analysis request...");
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64,
              mimeType: "image/jpeg",
              customPrompt: customPrompt || undefined,
              existingCategories,
            }),
          });

          if (response.ok) {
            findingDetails = await response.json();
            console.log("AI analysis successful:", findingDetails);
          } else {
            const status = response.status;
            const statusText = response.statusText;
            let errorMessage = "Unbekannter Fehler";
            try {
              const errData = await response.json();
              errorMessage = errData.error || errorMessage;
            } catch {
              // fallback if not JSON
            }
            console.error(`AI API Error (${status}): ${statusText}`, errorMessage);
            throw new Error(`KI-Dienst meldet Fehler (${status}): ${errorMessage}`);
          }
        } catch (err: unknown) {
          console.error("Critical AI Analysis Error:", err);
          const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
          const isTimeout =
            err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("fetch"));
          const msg = isTimeout 
            ? "Die KI-Analyse hat zu lange gedauert (Timeout). Der Fund wird ohne Analyse gespeichert."
            : `KI-Analyse fehlgeschlagen: ${errorMessage}. Speichere ohne KI-Daten.`;
          
          toast.error(msg);
          findingDetails = {
            title: getFileTitle(file),
            category: "allgemein",
            description: "",
            tags: [],
          };
        }
      } else {
        findingDetails = {
          title: manualTitle.trim(),
          category: manualCategory.trim() || "allgemein",
          description: manualDescription.trim(),
          extractedText: manualExtractedText.trim(),
          tags: selectedManualTags,
          customContent: [],
        };
      }

      setStatus("Fund wird gespeichert...");
      console.log("Saving to Firestore...");

      // Helper to sanitize data for Firestore (remove nested arrays)
      const sanitizeForFirestore = (obj: unknown): unknown => {
        if (Array.isArray(obj)) {
          return obj.map(v => sanitizeForFirestore(v));
        } else if (obj !== null && typeof obj === 'object') {
          const sanitized: Record<string, unknown> = {};
          const record = obj as Record<string, unknown>;
          for (const key in record) {
            // Firestore doesn't like nested arrays. 
            // If the value is an array, we ensure its children are not arrays.
            if (Array.isArray(record[key])) {
              sanitized[key] = record[key].map((item: unknown) => {
                if (Array.isArray(item)) return JSON.stringify(item); // Flatten nested arrays
                return sanitizeForFirestore(item);
              });
            } else {
              sanitized[key] = sanitizeForFirestore(record[key]);
            }
          }
          return sanitized;
        }
        return obj;
      };

      const rawData = {
        imageUrl,
        imagePath,
        title: findingDetails.title,
        category: findingDetails.category,
        room: room.trim() || "",
        description: findingDetails.description || "",
        extractedText: findingDetails.extractedText || "",
        tags: findingDetails.tags || [],
        customContent: findingDetails.customContent || [],
        customPrompt: mode === "ai" ? customPrompt.trim() : "",
        aiRawResponse: mode === "ai" ? JSON.stringify(findingDetails) : "",
        order: Date.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const sanitizedData = sanitizeForFirestore(rawData) as Record<string, unknown>;
      const docRef = await addDoc(
        collection(db, "sessions", currentSession.inviteCode, "findings"),
        sanitizedData
      );
      console.log("Firestore save successful, ID:", docRef.id);

      toast.success("Fund erfolgreich erstellt!");
      router.push(`/finding/${docRef.id}`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setUploading(false);
      setStatus("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neuen Fund erstellen</h1>
        <p className="text-muted-foreground mt-1">
          Lade ein Foto oder Screenshot hoch und wähle, wie die Details entstehen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
          <Button
            type="button"
            variant={mode === "ai" ? "secondary" : "ghost"}
            className="h-10"
            aria-pressed={mode === "ai"}
            onClick={() => setMode("ai")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            KI gestützt
          </Button>
          <Button
            type="button"
            variant={mode === "manual" ? "secondary" : "ghost"}
            className="h-10"
            aria-pressed={mode === "manual"}
            onClick={() => setMode("manual")}
          >
            <PencilLine className="w-4 h-4 mr-2" />
            Manuell
          </Button>
        </div>

        {preview ? (
          <Card className="overflow-hidden">
            <div className="relative aspect-video">
              <Image
                src={preview}
                alt="Vorschau"
                fill
                className="object-contain bg-black/50"
              />
            </div>
            <CardContent className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                Anderes Bild wählen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm">Bild wählen</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm">Foto aufnehmen</span>
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="room" className="flex items-center gap-1.5">
            <DoorClosed className="w-4 h-4 text-muted-foreground" />
            Raum / Fundort <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="room"
            placeholder='z.B. "Bibliothek"'
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>

        {mode === "ai" ? (
          <div className="space-y-2">
            <Label htmlFor="prompt" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              KI-Anweisung (optional)
            </Label>
            <Textarea
              id="prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Gib der KI zusätzliche Anweisungen, wie sie das Bild verarbeiten soll.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-title" className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  Titel
                </Label>
                <Input
                  id="manual-title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="z.B. Notiz aus der Bibliothek"
                  required={mode === "manual"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-category" className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  Kategorie
                </Label>
                <Input
                  id="manual-category"
                  list="existing-categories"
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  placeholder="allgemein"
                />
                <datalist id="existing-categories">
                  {existingCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                <OptionChips
                  label="Vorhandene Kategorien"
                  options={existingCategories}
                  selected={manualCategory ? [manualCategory] : []}
                  onSelect={setManualCategory}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-description" className="flex items-center gap-1.5">
                <PencilLine className="w-4 h-4 text-muted-foreground" />
                Beschreibung
              </Label>
              <Textarea
                id="manual-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={4}
                placeholder="Was sieht man, warum ist der Fund wichtig?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-text" className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Text / Abschrift
              </Label>
              <Textarea
                id="manual-text"
                value={manualExtractedText}
                onChange={(e) => setManualExtractedText(e.target.value)}
                rows={4}
                placeholder="Abgeschriebener Text aus dem Bild"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-tags" className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Tags
              </Label>
              <Input
                id="manual-tags"
                value={manualTags}
                onChange={(e) => setManualTags(e.target.value)}
                placeholder="rätsel, bibliothek, code"
              />
              <OptionChips
                label="Vorhandene Tags"
                options={existingTags}
                selected={selectedManualTags}
                onSelect={toggleManualTag}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!file || uploading || (mode === "manual" && !manualTitle.trim())}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {status}
            </>
          ) : (
            <>
              {mode === "ai" ? (
                <Sparkles className="w-4 h-4 mr-2" />
              ) : (
                <PencilLine className="w-4 h-4 mr-2" />
              )}
              {mode === "ai" ? "Hochladen & Analysieren" : "Fund speichern"}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
