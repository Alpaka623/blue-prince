import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BoardSession } from "@/lib/sessions";
import { generateInviteCode, normalizeInviteCode } from "@/lib/sessions";

const FALLBACK_LEGACY_INVITE_CODE = "LEGACY-PROD";

export function getLegacyInviteCode() {
  return normalizeInviteCode(
    process.env.NEXT_PUBLIC_LEGACY_SESSION_INVITE_CODE ||
      process.env.LEGACY_SESSION_INVITE_CODE ||
      FALLBACK_LEGACY_INVITE_CODE
  );
}

export async function createBoardSession(): Promise<BoardSession> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = generateInviteCode();
    const sessionRef = doc(db, "sessions", inviteCode);
    const existing = await getDoc(sessionRef);

    if (!existing.exists()) {
      await setDoc(sessionRef, {
        inviteCode,
        isLegacy: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { inviteCode, isLegacy: false };
    }
  }

  throw new Error("Session konnte nicht erstellt werden.");
}

export async function joinBoardSession(inviteCode: string): Promise<BoardSession> {
  const code = normalizeInviteCode(inviteCode);
  const snapshot = await getDoc(doc(db, "sessions", code));

  if (!snapshot.exists()) {
    throw new Error("Session nicht gefunden.");
  }

  const data = snapshot.data();
  return {
    inviteCode: code,
    isLegacy: data.isLegacy === true,
  };
}

export async function ensureLegacyBoardSession() {
  const inviteCode = getLegacyInviteCode();
  const sessionRef = doc(db, "sessions", inviteCode);
  const existingSession = await getDoc(sessionRef);

  if (existingSession.data()?.legacyMigrationComplete === true) {
    return;
  }

  await setDoc(
    sessionRef,
    {
      inviteCode,
      isLegacy: true,
      updatedAt: serverTimestamp(),
      ...(existingSession.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  const sourceFindings = await getDocs(collection(db, "findings"));
  let batch = writeBatch(db);
  let batchSize = 0;

  for (const sourceDoc of sourceFindings.docs) {
    const targetRef = doc(db, "sessions", inviteCode, "findings", sourceDoc.id);
    const targetDoc = await getDoc(targetRef);

    if (!targetDoc.exists()) {
      batch.set(targetRef, sourceDoc.data());
      batchSize += 1;
    }

    if (batchSize >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  const sourceSettings = await getDoc(doc(db, "settings", "general"));
  const targetSettingsRef = doc(db, "sessions", inviteCode, "settings", "general");
  const targetSettings = await getDoc(targetSettingsRef);

  if (sourceSettings.exists() && !targetSettings.exists()) {
    await setDoc(targetSettingsRef, sourceSettings.data());
  }

  await setDoc(
    sessionRef,
    {
      legacyMigrationComplete: true,
      legacyMigratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
