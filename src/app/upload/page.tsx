"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

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

      setStatus("KI analysiert das Bild...");
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      let aiResult;
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mimeType: file.type,
            customPrompt: customPrompt || undefined,
          }),
        });

        if (response.ok) {
          aiResult = await response.json();
        } else {
          throw new Error("AI analysis failed");
        }
      } catch {
        toast.error("KI-Analyse fehlgeschlagen — Fund wird ohne KI-Daten gespeichert.");
        aiResult = {
          title: file.name.replace(/\.[^.]+$/, ""),
          category: "other",
          description: "",
          tags: [],
        };
      }

      setStatus("Fund wird gespeichert...");
      const docRef = await addDoc(collection(db, "findings"), {
        imageUrl,
        imagePath,
        title: aiResult.title,
        category: aiResult.category,
        description: aiResult.description || "",
        extractedText: aiResult.extractedText || "",
        tags: aiResult.tags || [],
        customContent: aiResult.customContent || [],
        aiRawResponse: JSON.stringify(aiResult),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success("Fund erfolgreich hochgeladen!");
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
        <h1 className="text-2xl font-bold tracking-tight">Neuen Fund hochladen</h1>
        <p className="text-muted-foreground mt-1">
          Lade ein Foto oder Screenshot hoch und die KI analysiert es automatisch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Button
          type="submit"
          className="w-full"
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {status}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Hochladen & Analysieren
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
