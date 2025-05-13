import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, CoreMessage } from "ai";

// Initialize Google Generative AI
// Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in your .env.local
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

// Create model instance
const model = google("gemini-1.5-flash-latest");

export type InteractionMode = "roast" | "positive";

// System prompt tailored for roasting or giving positive feedback
const getSystemPrompt = (name: string, career: string, mode: InteractionMode): string => {
  if (mode === "roast") {
    return `
      You are a witty and sharp AI that specializes in light-hearted roasts.
      Your task is to generate a funny, but not mean-spirited, roast for a person named "${name}" who works as a "${career}".
      Keep it concise, clever, and suitable for a general audience. Avoid offensive or harmful content.
      The roast should be a maximum of 3-4 sentences.
      Example: "Oh, ${name} the ${career}? I bet their ${career}-related pickup lines have a 0% success rate. But hey, at least they're committed!"
    `;
  } else {
    return `
      You are a kind and encouraging AI.
      Your task is to generate positive and uplifting feedback for a person named "${name}" who works as a "${career}".
      Highlight potential strengths or offer a word of encouragement related to their profession.
      Keep it concise and genuine, maximum 3-4 sentences.
      Example: "${name}, being a ${career} takes real dedication and skill. Keep shining and making a positive impact in your field!"
    `;
  }
};

export async function generateAIResponse(
  name: string,
  career: string,
  mode: InteractionMode,
  conversationHistory: CoreMessage[] = [] // Retained for potential future use, though not strictly for one-off roasts/praise
): Promise<{ text: string; error?: string }> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Missing Google API Key");
      return { text: "", error: "AI service is not configured. Missing API key." };
    }

    if (!name.trim() || !career.trim()) {
        return { text: "", error: "Name and career cannot be empty." };
    }

    const systemPrompt = getSystemPrompt(name, career, mode);
    const userPrompt = `Generate a ${mode} for ${name}, the ${career}.`;

    // Construct messages array including system prompt and user prompt
    const messages: CoreMessage[] = [
      ...conversationHistory, // Include previous messages if any
      { role: 'user', content: userPrompt },
    ];

    const { text, finishReason } = await generateText({
      model,
      system: systemPrompt, // System prompt guides the AI's persona and task
      messages: messages, // Pass the conversation history and current prompt
      temperature: 0.75, // Adjust for creativity (0.7-0.8 is good for creative tasks)
      maxTokens: 150,   // Max tokens for the response
    });

    if (finishReason === "error" || finishReason === "unknown" || finishReason === "other") {
        console.error("AI generation failed with reason:", finishReason);
        return { text: "", error: "The AI couldn't generate a response. Please try again." };
    }
    if (!text.trim()){
        return { text: "", error: `The AI didn't provide any content for the ${mode}. Maybe try a different name or career?` };
    }

    return { text };
  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with the AI service.";
    return {
      text: "",
      error: `Oops! Something went wrong while crafting that. ${errorMessage}`,
    };
  }
}