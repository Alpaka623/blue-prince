import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, firebaseConfigComplete } from "@/lib/firebase";
import { normalizeInviteCode } from "@/lib/sessions";
import { getErrorCode, getErrorMessage } from "@/lib/api-errors";

const FALLBACK_LEGACY_INVITE_CODE = "LEGACY-PROD";

function getLegacyInviteCode() {
  return normalizeInviteCode(
    process.env.LEGACY_SESSION_INVITE_CODE || FALLBACK_LEGACY_INVITE_CODE
  );
}

export async function POST() {
  try {
    if (!firebaseConfigComplete) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 503 }
      );
    }

    const inviteCode = getLegacyInviteCode();
    const sessionRef = doc(db, "sessions", inviteCode);
    const existingSession = await getDoc(sessionRef);

    if (existingSession.data()?.legacyMigrationComplete === true) {
      return NextResponse.json({
        ok: true,
        copiedFindings: 0,
        copiedSettings: false,
      });
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
    let copiedFindings = 0;
    let batch = writeBatch(db);
    let batchSize = 0;

    for (const sourceDoc of sourceFindings.docs) {
      const targetRef = doc(db, "sessions", inviteCode, "findings", sourceDoc.id);
      const targetDoc = await getDoc(targetRef);

      if (!targetDoc.exists()) {
        batch.set(targetRef, sourceDoc.data());
        copiedFindings += 1;
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
    let copiedSettings = false;

    if (sourceSettings.exists() && !targetSettings.exists()) {
      await setDoc(targetSettingsRef, sourceSettings.data());
      copiedSettings = true;
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

    return NextResponse.json({
      ok: true,
      copiedFindings,
      copiedSettings,
    });
  } catch (error) {
    console.error("Failed to ensure legacy session:", error);
    return NextResponse.json(
      {
        error: "Failed to ensure legacy session",
        code: getErrorCode(error),
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
