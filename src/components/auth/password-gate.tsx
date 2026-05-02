"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const STORAGE_KEY = "bp-wiki-auth";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password);
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Blue Prince Wiki</h1>
            <p className="text-sm text-muted-foreground">
              Gib das Passwort ein, um Zugang zu erhalten.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={error ? "border-destructive" : ""}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">Falsches Passwort.</p>
            )}
            <Button type="submit" className="w-full">
              Eintreten
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
