import { NextRequest, NextResponse } from "next/server";
import { analyzeFinding } from "@/ai/analyze-finding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, customPrompt } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    const result = await analyzeFinding({
      imageBase64,
      mimeType,
      customPrompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
