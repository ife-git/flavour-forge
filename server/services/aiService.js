import OpenAI from "openai";
import "dotenv/config";

// Initialize OpenAI client for Groq
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1",
});

// Call AI API for recipe generation with conversation history
export async function getRecipe({
  message,
  history = [],
  spiceTolerance = "medium",
}) {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Server misconfigured: OPENAI_API_KEY is missing");
  }

  const model = process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

  try {
    console.log(`Using model: ${model}`);
    console.log(`Conversation history length: ${history.length} messages`);

    // Build messages array with system prompt + history + new message
    const messages = [
      {
        role: "system",
        content: `You are a chef. The user states what ingredients they have available and you recommend a recipe based on their ingredients, but there is nuance to it. 
        
User's spice tolerance: ${spiceTolerance}

RULES:
1. All your responses will be in a CARD FORMAT (JSON-like structure with title, ingredients list, steps)
2. If user doesn't have sufficient ingredients, respond with: "I can't think of a good recipe with just those. Consider adding: [suggested ingredients]"
3. If they have sufficient ingredients, provide a recipe then ask about dietary restrictions or variations (cheesy, meaty, etc.)
4. Recipe must be simple with step-by-step process
5. Each step should be one line, max 2 sentences
6. Ingredients must include quantities:
   - Spices: tablespoons/teaspoons
   - Produce: numbers (5 bulbs of peppers, 3 onions)
   - Meat: weight if needed (200g beef, 1kg chicken)
  

RESPONSE FORMAT (return ONLY this JSON structure, no other text):
{
  "title": "Recipe Name",
  "hasIngredients": true,
  "suggestedAdditions": [],
  "ingredients": [
    {"name": "onions", "amount": "3", "unit": "bulbs"},
    {"name": "salt", "amount": "1", "unit": "teaspoon"}
  ],
  "steps": [
    "Step 1: Wash all vegetables thoroughly.",
    "Step 2: Preheat oven to 180°C."
  ],
  "followUp": "Would you like this spicier or less spicy?"
}`,
      },
      ...history, // Previous conversation turns
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: 1024, // Increased for recipe card format
      temperature: 0.7, // Slight creativity for recipe variations
      messages: messages,
    });

    const responseText = completion.choices[0].message.content.trim();

    // Try to parse JSON response
    try {
      // Extract JSON if wrapped in markdown code blocks
      let jsonString = responseText;
      if (responseText.includes("```json")) {
        jsonString = responseText.split("```json")[1].split("```")[0];
      } else if (responseText.includes("```")) {
        jsonString = responseText.split("```")[1].split("```")[0];
      }

      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (parseError) {
      // If not valid JSON, return as structured text (fallback)
      console.warn("AI didn't return valid JSON, using text response");
      return {
        title: "Recipe Suggestion",
        hasIngredients: true,
        suggestedAdditions: [],
        ingredients: [],
        steps: [responseText],
        followUp: "Any dietary restrictions?",
      };
    }
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error(`API error: ${error.message}`);
  }
}
