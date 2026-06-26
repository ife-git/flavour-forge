import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { autoResizeTextarea } from "../utils";
import { useAuth } from "../context/authContext";
import { useNotification } from "../context/notificationContext";
import { API_URL } from "../config";
import flavourIcon from "/flavour.svg";
import chefIcon from "/chef.svg";

export default function Chat() {
  const [userPrompt, setUserPrompt] = useState("");
  const [outputContent, setOutputContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Session management - use a ref to persist across renders
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return sessionStorage.getItem("flavourForge_sessionId") || null;
  });

  const textareaRef = useRef(null);
  const outputRef = useRef(null);
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();

  // Helper function to sanitize user input before sending to AI
  const sanitizeInput = (input) => {
    if (!input || typeof input !== "string") return "";

    let cleaned = input.trim();

    // Remove leading special characters (;, :, ., !, ?, etc.)
    cleaned = cleaned.replace(/^[;:,.!?]+/, "");

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Limit length to prevent token overflow
    if (cleaned.length > 1000) {
      cleaned = cleaned.substring(0, 1000);
      showNotification("Message truncated to 1000 characters", "info");
    }

    // Remove any HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    return cleaned;
  };

  // Save sessionId to sessionStorage whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      sessionStorage.setItem("flavourForge_sessionId", currentSessionId);
      console.log("💾 Saved sessionId to storage:", currentSessionId);
    }
  }, [currentSessionId]);

  // Load saved recipes on mount
  useEffect(() => {
    loadSavedRecipes();
  }, []);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [userPrompt]);

  // Load all saved recipes from backend
  const loadSavedRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const response = await fetch(`${API_URL}/api/recipes/saved`, {
        credentials: "include",
      });
      if (response.ok) {
        const recipes = await response.json();
        setSavedRecipes(recipes);
      }
    } catch (error) {
      console.error("Failed to load saved recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Save a recipe to user's collection
  const saveRecipe = async () => {
    if (!currentRecipe) {
      showNotification("No recipe to save!", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/recipes/save`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: currentRecipe,
        }),
      });

      if (response.ok) {
        showNotification(
          `"${currentRecipe.title}" saved to your recipes!`,
          "success",
        );
        await loadSavedRecipes();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save recipe");
      }
    } catch (error) {
      console.error("Save recipe error:", error);
      showNotification(error.message || "Failed to save recipe", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved recipe (display it)
  const loadSavedRecipe = async (recipeId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/recipes/saved/${recipeId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const recipe = await response.json();
        const formattedHTML = formatRecipeToHTML(recipe);
        const safeHTML = DOMPurify.sanitize(formattedHTML);
        setOutputContent(safeHTML);
        setCurrentRecipe(recipe);
        setShowOutput(true);
        showNotification(`Loaded "${recipe.title}"`, "success");
      }
    } catch (error) {
      console.error("Failed to load recipe:", error);
      showNotification("Failed to load recipe", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a saved recipe
  const deleteSavedRecipe = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Delete "${recipeTitle}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/recipes/saved/${recipeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        showNotification(`"${recipeTitle}" deleted`, "success");
        await loadSavedRecipes();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification("Failed to delete recipe", "error");
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setCurrentSessionId(null);
    sessionStorage.removeItem("flavourForge_sessionId");
    setCurrentRecipe(null);
    setUserPrompt("");
    setOutputContent("");
    setShowOutput(false);
    showNotification("New conversation started!", "success");
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
      logout();
      sessionStorage.removeItem("flavourForge_sessionId");
      showNotification("Logged out successfully!", "success");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper function to format recipe JSON into readable HTML
  const formatRecipeToHTML = (recipe) => {
    if (!recipe) return "<p>No recipe received</p>";

    let html = `<h2>${recipe.title || "Recipe Suggestion"}</h2>`;

    if (recipe.hasIngredients === false && recipe.suggestedAdditions) {
      html += `<p><strong>⚠️ I can't think of a good recipe with just those. Consider adding:</strong></p>`;
      html += `<ul>${recipe.suggestedAdditions.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      return html;
    }

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      html += `<h3>📝 Ingredients:</h3><ul>`;
      recipe.ingredients.forEach((ing) => {
        html += `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`;
      });
      html += `</ul>`;
    }

    if (recipe.steps && recipe.steps.length > 0) {
      html += `<h3>👩🏿‍🍳 Instructions:</h3><ol>`;
      recipe.steps.forEach((step) => {
        html += `<li>${step}</li>`;
      });
      html += `</ol>`;
    }

    if (recipe.followUp) {
      html += `<p><em class="follow-up">${recipe.followUp}</em></p>`;
    }

    return html;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sanitize the input BEFORE using it
    const sanitizedMessage = sanitizeInput(userPrompt);

    if (!sanitizedMessage) {
      showNotification("Please enter a valid message", "error");
      return;
    }

    console.log("🚀 Sending with sessionId:", currentSessionId);
    console.log("📝 Original:", userPrompt);
    console.log("🧹 Sanitized:", sanitizedMessage);

    setIsLoading(true);
    setShowOutput(false);
    setOutputContent("");
    setCurrentRecipe(null);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to use the recipe chatbot");
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Response received:", {
        returnedSessionId: data.sessionId,
        hasRecipe: !!data.recipe,
      });

      // Update session ID from response
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
      }

      // Store the current recipe for potential saving
      if (data.recipe && data.recipe.hasIngredients !== false) {
        setCurrentRecipe(data.recipe);
      }

      const formattedHTML = formatRecipeToHTML(data.recipe);
      const safeHTML = DOMPurify.sanitize(formattedHTML);

      setOutputContent(safeHTML);
      setShowOutput(true);
      setUserPrompt(""); // Clear input after successful submit
    } catch (error) {
      console.error(error);
      setOutputContent(
        `Sorry, ${error.message || "I can't access what I need right now. Please try again in a bit."}`,
      );
      setShowOutput(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <button
        className="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ☰ Recipes
      </button>

      <div className={`chat-sidebar ${showSidebar ? "open" : ""}`}>
        <div className="sidebar-header">
          <h3>📚 Saved Recipes</h3>
          <button className="new-chat-btn" onClick={startNewChat}>
            + New Chat
          </button>
        </div>

        <div className="sessions-list">
          {isLoadingRecipes ? (
            <div className="loading-sessions">Loading recipes...</div>
          ) : savedRecipes.length === 0 ? (
            <div className="no-sessions">
              No saved recipes yet. Click "💾 Save Recipe" on a recipe you like!
            </div>
          ) : (
            savedRecipes.map((recipe) => (
              <div
                key={recipe._id || recipe.id}
                className={`session-item ${currentRecipe?._id === recipe._id ? "active" : ""}`}
              >
                <div
                  className="session-title"
                  onClick={() => loadSavedRecipe(recipe._id || recipe.id)}
                >
                  {recipe.title}
                </div>
                <button
                  className="dlt-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedRecipe(recipe._id || recipe.id, recipe.title);
                  }}
                >
                  🗑️
                </button>
                <div className="session-date">
                  {new Date(
                    recipe.savedAt || recipe.createdAt,
                  ).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      <div className="main-chat-area">
        <header className="app-header">
          <div className="title-group">
            <img src={flavourIcon} alt="flavour" className="flavour-icon-img" />
            <h1>Flavour Forge</h1>
          </div>
          <div className="user-controls">
            <span className="user-name">👩🏿‍🍳 {user?.name || user?.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <form className="recipe-form" onSubmit={handleSubmit}>
            <div className="input-section">
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., I have carrots, onions, beef and noodles, what dishes can I make with these ingredients"
                  rows={1}
                />
              </div>
            </div>
            <div className="chef-container">
              <button
                type="submit"
                className={`chef-btn ${isLoading ? "loading" : "compact"}`}
                disabled={isLoading}
              >
                <span className="chef-icon">
                  <img
                    src={chefIcon}
                    alt="Magic chef"
                    className="chef-icon-img"
                  />
                </span>
                <span className="chef-text">
                  {isLoading ? "Cooking up a recipe..." : "Cook up a recipe"}
                </span>
              </button>
            </div>
          </form>

          <section className="output-section">
            <div
              className={`output-container ${showOutput ? "visible" : "hidden"}`}
              ref={outputRef}
            >
              <div dangerouslySetInnerHTML={{ __html: outputContent }} />
              {currentRecipe && (
                <div className="save-recipe-container">
                  <button
                    className="save-button"
                    onClick={saveRecipe}
                    disabled={isSaving}
                  >
                    {isSaving ? "💾 Saving..." : "💾 Save this Recipe"}
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
