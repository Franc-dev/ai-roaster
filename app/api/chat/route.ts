/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { generateAIResponse, InteractionMode } from "@/lib/ai";
import { CoreMessage } from "ai"; // Import CoreMessage

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, career, mode, history } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Valid 'name' is required" }, { status: 400 });
    }
    if (!career || typeof career !== 'string' || career.trim() === '') {
      return NextResponse.json({ error: "Valid 'career' is required" }, { status: 400 });
    }
    if (!mode || (mode !== 'roast' && mode !== 'positive')) {
      return NextResponse.json({ error: "Valid 'mode' (roast/positive) is required" }, { status: 400 });
    }

    // Validate history if provided
    let conversationHistory: CoreMessage[] = [];
    if (history && Array.isArray(history)) {
        // Basic validation for history items
        conversationHistory = history.filter(
            (item: any) => item && typeof item.role === 'string' && typeof item.content === 'string'
        ) as CoreMessage[];
    }


    const { text, error } = await generateAIResponse(name.trim(), career.trim(), mode as InteractionMode, conversationHistory);

    if (error) {
      // Log the error server-side for debugging
      console.error(`AI Response Error for ${name} (${career}, ${mode}): ${error}`);
      // Provide a more generic error to the client if desired, or the specific one
      return NextResponse.json({ error: `AI Error: ${error}` }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: "AI did not return a response." }, { status: 500 });
    }

    return NextResponse.json({ text }, { status: 200 });

  } catch (error) {
    console.error("Unhandled error in chat API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      {
        error: "I'm having trouble responding right now. Please try again shortly.",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}