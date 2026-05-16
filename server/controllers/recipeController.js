import Recipe from "../models/Recipe.js";
import User from "../models/User.js";
import { appEvents } from "../events/eventEmitter.js";
import { sanitizeInput } from "../utils/sanitizeInput.js";

// @desc    Get all recipes for logged-in user
// @route   GET /api/recipes
export async function getAllRecipes(req, res) {
  try {
    // Fix:
    const recipes = await Recipe.find({ userId: req.session.userId }).sort({
      createdAt: -1,
    });

    res.json(recipes);
  } catch (err) {
    console.error("GET recipes error:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}

// @desc    Get single recipe
// @route   GET /api/recipes/:id
export async function getRecipe(req, res) {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(recipe);
  } catch (err) {
    console.error("GET recipe error:", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
}

// @desc    Create new recipe
// @route   POST /api/recipes
// CREATE - Line 71 fix:
export async function createRecipe(req, res) {
  try {
    const { title, content, category, timestamp } = req.body;

    const requiredFields = { title, content, category, timestamp };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key],
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const cleanData = sanitizeInput({ title, content, category, timestamp });

    // FIXED: Use create(), not findOne()
    const recipe = await Recipe.create({
      ...cleanData,
      userId: req.session.userId,
    });

    const user = await User.findById(req.session.userId);
    appEvents.emit("recipe:created", recipe, user);

    res.status(201).json(recipe);
  } catch (err) {
    console.error("CREATE recipe error:", err);
    res.status(500).json({ error: "Failed to create recipe" });
  }
}

// UPDATE - Line 97 fix:
export async function updateRecipe(req, res) {
  try {
    const { title, content, category, timestamp } = req.body;

    // FIXED: Use findOne(), not findOneAndDelete()
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!recipe) {
      return res.status(404).json({ error: "recipe not found" });
    }

    recipe.title = title || recipe.title;
    recipe.content = content || recipe.content;
    recipe.category = category || recipe.category;
    recipe.timestamp = timestamp || recipe.timestamp;

    await recipe.save();
    res.json(recipe);
  } catch (err) {
    console.error("UPDATE recipe error:", err);
    res.status(500).json({ error: "Failed to update recipe" });
  }
}

// DELETE - Line 122 fix:
export async function deleteRecipe(req, res) {
  try {
    // FIXED: Use Recipe model, not recipe variable
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!recipe) {
      return res.status(404).json({ error: "recipe not found" });
    }

    const user = await User.findById(req.session.userId);
    appEvents.emit("recipe:deleted", recipe.title, user);

    res.status(204).send();
  } catch (err) {
    console.error("DELETE recipe error:", err);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
}

// Get all saved recipes for the user
export async function getSavedRecipes(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    res.json(user.savedRecipes || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch saved recipes" });
  }
}

// Save a recipe
export async function saveRecipe(req, res) {
  try {
    const { recipe } = req.body;
    const user = await User.findById(req.session.userId);

    // Check if already saved (by title)
    const alreadySaved = user.savedRecipes.some(
      (r) => r.title === recipe.title,
    );
    if (alreadySaved) {
      return res.status(400).json({ error: "Recipe already saved" });
    }

    user.savedRecipes.push({
      ...recipe,
      savedAt: new Date(),
    });
    await user.save();

    res.json({ success: true, message: "Recipe saved!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save recipe" });
  }
}

// Get a single saved recipe
export async function getSavedRecipe(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    const recipe = user.savedRecipes.id(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
}

// Delete a saved recipe
export async function deleteSavedRecipe(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    user.savedRecipes.id(req.params.id).deleteOne();
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
}
