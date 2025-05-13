import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, CoreMessage } from "ai";

// Initialize Google Generative AI with proper error handling
const initializeGoogleAI = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.warn("Missing Google Generative AI API key");
    return null;
  }
  return createGoogleGenerativeAI({ apiKey });
};

export type InteractionMode = "roast" | "positive";

// Enhanced prompts for deeply personalized responses
const getSystemPrompt = (name: string, career: string, mode: InteractionMode): string => {
  if (mode === "roast") {
    return `
      You are a master of personalized comedic roasts who knows how to make each roast feel uniquely crafted for the individual.
      Generate a razor-sharp, clever roast for "${name}" who works as a "${career}".
      
      Your roast MUST:
      - Be deeply personalized by incorporating their specific name and profession in meaningful ways
      - Use specific insider knowledge or stereotypes about their exact career field
      - Include career-specific terminology or jargon twisted into clever wordplay
      - Reference typical daily challenges, tools, or situations unique to their profession
      - Create humor by exaggerating typical traits/behaviors associated with their profession
      - End with a surprising twist that ties back to their specific career
      - Be concise (3-4 sentences max)
      - Remain light-hearted without crossing into genuinely offensive territory
      
      DO NOT use generic templates or formulaic approaches. Each roast should feel custom-written.
      AVOID generic career jokes that could apply to multiple professions.
      NEVER use placeholder examples or obvious fill-in-the-blank humor.
    `;
  } else {
    return `
      You are an insightful mentor with deep understanding of various professions and career paths.
      Craft a genuinely personalized and uplifting message for "${name}" who works as a "${career}".
      
      Your message MUST:
      - Address "${name}" directly and personally
      - Reference specific challenges, skills, or contributions unique to their exact profession
      - Include industry-specific terminology or concepts that show deep understanding
      - Acknowledge particular difficulties or underappreciated aspects of their specific role
      - Offer encouragement that specifically connects to growth opportunities in their field
      - Be concise but impactful (3-4 sentences max)
      
      DO NOT use generic motivational language that could apply to any profession.
      AVOID vague platitudes or general encouragement without career-specific substance.
      NEVER use template-style praise that feels mass-produced.
    `;
  }
};

export async function generateAIResponse(
  name: string,
  career: string,
  mode: InteractionMode,
  conversationHistory: CoreMessage[] = []
): Promise<{ text: string; error?: string }> {
  try {
    // Input validation with more specific feedback
    if (!name.trim()) {
      return { text: "", error: "Please provide a name to personalize the feedback." };
    }
    
    if (!career.trim()) {
      return { text: "", error: "Please specify a career or profession to generate relevant content." };
    }

    // Initialize AI with proper error handling
    const google = initializeGoogleAI();
    if (!google) {
      return { text: "", error: "AI service configuration error. Please contact support." };
    }

    // Create model with fallback options
    const modelName = "gemini-1.5-flash-latest";
    let model;
    try {
      model = google(modelName);
    } catch (modelError) {
      console.error(`Failed to initialize ${modelName}:`, modelError);
      return { text: "", error: "Unable to initialize AI model. Please try again later." };
    }

    const systemPrompt = getSystemPrompt(name, career, mode);
    
    // More specific user prompt to guide the AI
    const userPrompt = `Create a memorable ${mode === "roast" ? "roast" : "positive message"} for ${name}, who works as a ${career}. Make it unique and tailored to their profession.`;

    // Build conversation context
    const messages: CoreMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ];

    // Adjust temperature based on mode for appropriate creativity
    const temperature = mode === "roast" ? 0.8 : 0.7;

    const { text, finishReason } = await generateText({
      model,
      system: systemPrompt,
      messages: messages,
      temperature,
      maxTokens: 150,
    });

    // Enhanced error handling with specific messages
    if (finishReason === "error") {
      console.error("AI generation error:", finishReason);
      return { text: "", error: "The AI encountered an error while generating content. Please try again." };
    }
    
    if (finishReason === "unknown" || finishReason === "other") {
      console.error("AI generation finished with unclear reason:", finishReason);
      return { text: "", error: "Something unexpected happened. Please try again with different inputs." };
    }

    if (!text.trim()) {
      return { 
        text: "", 
        error: `Unable to generate ${mode === "roast" ? "a roast" : "positive feedback"} for this combination. Try a different career description.` 
      };
    }

    // Process the response to ensure it meets our quality standards
    const processedText = text
      .trim()
      .replace(/^["']|["']$/g, ""); // Remove quotes if the AI added them

    return { text: processedText };
  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Provide user-friendly error messages
    return {
      text: "",
      error: `We couldn't generate your ${mode === "roast" ? "roast" : "positive feedback"} right now. ${errorMessage.includes("rate") ? "Our service is experiencing high demand. Please try again shortly." : "Please try again with different inputs."}`,
    };
  }
}