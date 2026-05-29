"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { BoardSession } from "@/lib/sessions";
import { normalizeInviteCode } from "@/lib/sessions";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/lib/session-storage";

interface SessionContextValue {
  currentSession: BoardSession | null;
  loading: boolean;
  joinSession: (inviteCode: string, remember: boolean) => Promise<void>;
  createSession: (remember: boolean) => Promise<BoardSession>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const storedSession = useSyncExternalStore(
    () => () => {},
    readStoredSession,
    () => null
  );
  const [currentSession, setCurrentSession] = useState<BoardSession | null>(null);
  const activeSession = currentSession ?? storedSession;

  useEffect(() => {
    fetch("/api/sessions/ensure-legacy", { method: "POST" }).catch(() => {
      // Best-effort migration. Joining and creating boards should still work.
    });
  }, []);

  const joinSession = useCallback(async (inviteCode: string, remember: boolean) => {
    const code = normalizeInviteCode(inviteCode);
    const response = await fetch("/api/sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });

    if (!response.ok) {
      throw new Error("Session nicht gefunden.");
    }

    const session = (await response.json()) as BoardSession;
    writeStoredSession(session, remember);
    setCurrentSession(session);
  }, []);

  const createSession = useCallback(async (remember: boolean) => {
    const response = await fetch("/api/sessions/create", { method: "POST" });

    if (!response.ok) {
      throw new Error("Session konnte nicht erstellt werden.");
    }

    const session = (await response.json()) as BoardSession;
    writeStoredSession(session, remember);
    setCurrentSession(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setCurrentSession(null);
  }, []);

  const value = useMemo(
    () => ({
      currentSession: activeSession,
      loading: false,
      joinSession,
      createSession,
      logout,
    }),
    [activeSession, joinSession, createSession, logout]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
