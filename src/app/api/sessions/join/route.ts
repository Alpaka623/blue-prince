import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db, firebaseConfigComplete } from "@/lib/firebase";
import { normalizeInviteCode } from "@/lib/sessions";
import { getErrorCode, getErrorMessage } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    if (!firebaseConfigComplete) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const inviteCode = normalizeInviteCode(String(body?.inviteCode || ""));

    if (!inviteCode) {
      return NextResponse.json({ error: "inviteCode is required" }, { status: 400 });
    }

    const snapshot = await getDoc(doc(db, "sessions", inviteCode));

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const data = snapshot.data();
    return NextResponse.json({
      inviteCode,
      isLegacy: data.isLegacy === true,
    });
  } catch (error) {
    console.error("Failed to join session:", error);
    return NextResponse.json(
      {
        error: "Failed to join session",
        code: getErrorCode(error),
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
