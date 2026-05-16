import express from "express";
import {
  getAllRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getSavedRecipes,
  saveRecipe,
  getSavedRecipe,
  deleteSavedRecipe,
} from "../controllers/recipeController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth); // All routes require authentication

// ========== SAVED RECIPES ROUTES (Specific paths FIRST) ==========
router.get("/saved", getSavedRecipes); // Get all saved recipes
router.post("/save", saveRecipe); // Save a recipe
router.get("/saved/:id", getSavedRecipe); // Get a single saved recipe
router.delete("/saved/:id", deleteSavedRecipe); // Delete a saved recipe

// ========== REGULAR RECIPE ROUTES (Dynamic paths LAST) ==========
router.get("/", getAllRecipes);
router.get("/:id", getRecipe);
router.post("/", createRecipe);
router.put("/:id", updateRecipe);
router.delete("/:id", deleteRecipe);

export default router;
