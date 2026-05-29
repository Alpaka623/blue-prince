"use client";

import { useState } from "react";
import { Loader2, LogIn, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/auth/session-context";
import { normalizeInviteCode } from "@/lib/sessions";
import { firebaseConfigComplete, requiredFirebaseEnvKeys } from "@/lib/firebase";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { currentSession, loading, joinSession, createSession } = useSession();
  const [inviteCode, setInviteCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState<"join" | "create" | null>(null);

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const code = normalizeInviteCode(inviteCode);
    if (!code) return;

    setSubmitting("join");
    try {
      await joinSession(code, remember);
      toast.success("Session verbunden.");
    } catch {
      toast.error("Invitecode nicht gefunden.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreate() {
    setSubmitting("create");
    try {
      const session = await createSession(remember);
      toast.success(`Neue Session erstellt: ${session.inviteCode}`);
    } catch {
      toast.error("Session konnte nicht erstellt werden.");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!firebaseConfigComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Firebase fehlt lokal
            </h1>
            <p className="text-sm text-muted-foreground">
              Lege die Firebase-Werte in deiner lokalen Env-Datei an und starte
              den Dev-Server neu.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Benötigte Variablen
            </p>
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {requiredFirebaseEnvKeys.join("\n")}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (currentSession) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Blue Prince Wiki</h1>
          <p className="text-sm text-muted-foreground">
            Tritt einem Board per Invitecode bei oder erstelle eine neue Session.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-3 text-left">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invitecode</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="z.B. ABCD2345"
              autoComplete="off"
              autoCapitalize="characters"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
            Eingeloggt bleiben
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={!normalizeInviteCode(inviteCode) || submitting !== null}
          >
            {submitting === "join" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            Beitreten
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          oder
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleCreate}
          disabled={submitting !== null}
        >
          {submitting === "create" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Neue Session erstellen
        </Button>
      </div>
    </div>
  );
}
