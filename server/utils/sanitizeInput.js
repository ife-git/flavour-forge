import sanitizeHtml from "sanitize-html";

export function sanitizeInput(data) {
  if (!data || typeof data !== "object") return data;

  const sanitizedData = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Allow basic formatting but strip scripts
      sanitizedData[key] = sanitizeHtml(value, {
        allowedTags: ["b", "i", "em", "strong", "p", "br"],
        allowedAttributes: {},
      });
    } else if (Array.isArray(value)) {
      sanitizedData[key] = value.map((item) =>
        typeof item === "string" ? sanitizeHtml(item) : item,
      );
    } else {
      sanitizedData[key] = value;
    }
  }

  return sanitizedData;
}
