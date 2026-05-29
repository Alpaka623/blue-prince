import type { BoardSession } from "@/lib/sessions";

export const SESSION_STORAGE_KEY = "bp-wiki-session";
const SESSION_STORAGE_EVENT = "bp-wiki-session-change";

function notifyStoredSessionChange() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SESSION_STORAGE_EVENT));
}

export function subscribeStoredSessionChange(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(event: StorageEvent) {
    if (event.key === SESSION_STORAGE_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener(SESSION_STORAGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(SESSION_STORAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function readStoredSessionValue() {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem(SESSION_STORAGE_KEY) ||
    window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
}

export function parseStoredSession(stored: string | null): BoardSession | null {
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as BoardSession;
    return parsed?.inviteCode ? parsed : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function readStoredSession(): BoardSession | null {
  return parseStoredSession(readStoredSessionValue());
}

export function writeStoredSession(session: BoardSession, remember: boolean) {
  if (typeof window === "undefined") return;

  const value = JSON.stringify(session);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(SESSION_STORAGE_KEY);

  if (remember) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, value);
  } else {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, value);
  }

  notifyStoredSessionChange();
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  notifyStoredSessionChange();
}
