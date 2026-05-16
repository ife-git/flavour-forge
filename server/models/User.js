import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, default: "New Conversation" }, // e.g., "Pasta with tomatoes"
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    spiceTolerance: {
      type: String,
      enum: ["mild", "medium", "spicy"],
      default: "medium",
    },
    // Chat sessions for recipe conversations
    chatSessions: [
      {
        sessionId: { type: String, required: true },
        title: { type: String, default: "New Conversation" },
        messages: [
          {
            role: { type: String, enum: ["user", "assistant"], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
          },
        ],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    // ✅ ADD THIS - Saved recipes collection
    savedRecipes: [
      {
        title: { type: String, required: true },
        ingredients: { type: Array, default: [] },
        steps: { type: Array, default: [] },
        followUp: { type: String, default: "" },
        hasIngredients: { type: Boolean, default: true },
        suggestedAdditions: { type: Array, default: [] },
        savedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Password comparison method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
