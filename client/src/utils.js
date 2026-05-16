/**
 * Auto-resize textarea to fit content
 */
export function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * Toggle loading state (kept for compatibility - logic now in React state)
 */
export function setLoading(isLoading) {
  // This function is kept for reference but loading is now handled by React state
  // The actual DOM manipulation happens in App.jsx
}
