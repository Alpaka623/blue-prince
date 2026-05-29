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
  createBoardSession,
  ensureLegacyBoardSession,
  getLegacyInviteCode,
  joinBoardSession,
} from "@/lib/session-firestore";
import {
  clearStoredSession,
  parseStoredSession,
  readStoredSessionValue,
  subscribeStoredSessionChange,
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
  const storedSessionValue = useSyncExternalStore(
    subscribeStoredSessionChange,
    readStoredSessionValue,
    () => null
  );
  const storedSession = useMemo(
    () => parseStoredSession(storedSessionValue),
    [storedSessionValue]
  );
  const [currentSession, setCurrentSession] = useState<BoardSession | null>(null);
  const activeSession = currentSession ?? storedSession;

  useEffect(() => {
    ensureLegacyBoardSession().catch((error) => {
      console.error("Legacy migration failed:", error);
      // Best-effort migration. Joining and creating boards should still work.
    });
  }, []);

  const joinSession = useCallback(async (inviteCode: string, remember: boolean) => {
    const code = normalizeInviteCode(inviteCode);
    let session: BoardSession;

    try {
      session = await joinBoardSession(code);
    } catch (error) {
      if (code !== getLegacyInviteCode()) {
        throw error;
      }

      await ensureLegacyBoardSession();
      session = await joinBoardSession(code);
    }

    writeStoredSession(session, remember);
    setCurrentSession(session);
  }, []);

  const createSession = useCallback(async (remember: boolean) => {
    const session = await createBoardSession();
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
