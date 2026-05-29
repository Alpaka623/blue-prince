import { NextResponse } from "next/server";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseConfigComplete } from "@/lib/firebase";
import { generateInviteCode } from "@/lib/sessions";
import { getErrorCode, getErrorMessage } from "@/lib/api-errors";

export async function POST() {
  try {
    if (!firebaseConfigComplete) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 503 }
      );
    }

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

        return NextResponse.json({ inviteCode, isLegacy: false });
      }
    }

    return NextResponse.json(
      { error: "Could not create unique invite code" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
        code: getErrorCode(error),
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
