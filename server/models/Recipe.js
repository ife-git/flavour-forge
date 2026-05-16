import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: String, required: true }, // e.g., "2 cups", "3 tbsp"
  unit: { type: String, default: "" }, // Optional: cups, tbsp, grams, etc.
});

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  description: { type: String, required: true },
});

const recipeSchema = new mongoose.Schema(
  {
    // Core recipe data
    title: { type: String, required: true, trim: true },
    ingredients: [ingredientSchema],
    instructions: [instructionSchema],
    prepTime: { type: String }, // e.g., "15 minutes"
    cookTime: { type: String }, // e.g., "30 minutes"
    servings: { type: String }, // e.g., "4 servings"

    // AI metadata
    originalPrompt: { type: String }, // What user asked for
    refinementHistory: [
      {
        request: String, // "make it sweeter"
        previousVersion: mongoose.Schema.Types.Mixed, // Store previous state
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Media & resources
    youtubeVideoUrl: { type: String }, // Relevant cooking video
    youtubeVideoTitle: { type: String },

    // Categorization
    cuisine: { type: String }, // Italian, Mexican, etc.
    mealType: { type: String }, // Breakfast, Lunch, Dinner, Snack

    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: { type: String }, // Which chat session generated this

    // Usage tracking
    isGenerated: { type: Boolean, default: true }, // AI-generated vs user-saved
    timesViewed: { type: Number, default: 0 },
    timesCooked: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Index for fast queries
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ sessionId: 1 });

export default mongoose.model("Recipe", recipeSchema);
