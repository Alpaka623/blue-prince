import { NextRequest, NextResponse } from "next/server";
import { analyzeFinding } from "@/ai/analyze-finding";

export async function POST(request: NextRequest) {
  try {
    console.log("API: Analyze request received");
    const body = await request.json();
    const { imageBase64, mimeType, customPrompt } = body;

    if (!imageBase64 || !mimeType) {
      console.warn("API: Missing required fields");
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    console.log("API: Sending to AI model...");
    const result = await analyzeFinding({
      imageBase64,
      mimeType,
      customPrompt,
    });
    console.log("API: AI Analysis successful");

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API Error: AI Analysis failed:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${message}` },
      { status: 500 }
    );
  }
}
