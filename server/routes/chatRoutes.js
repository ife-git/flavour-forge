import express from "express";
import {
  chatWithAI,
  getChatSessions,
  loadSession,
  saveRecipeToUser,
  updateSessionTitle, // ← ADD THIS IMPORT
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", chatWithAI); // Main AI chat
router.get("/sessions", getChatSessions); // Sidebar history
router.get("/sessions/:id", loadSession); // Load past chat
router.post("/save-recipe", saveRecipeToUser); // Save AI recipe to user's saved recipes
router.put("/sessions/:id/title", updateSessionTitle); // Update chat title

export default router;
