import { EventEmitter } from "node:events";
import { sendEmail } from "../services/emailService.js";

export const appEvents = new EventEmitter();

// ===== USER EVENTS =====
appEvents.on("user:registered", async (user) => {
  // Send welcome email
  await sendEmail({
    to: user.email,
    subject: "🎉 Welcome to Flavour-Forge!",
    html: `
      <h2>Welcome ${user.name}!</h2>
      <p>Thank you for joining Flavour-Forge. Your one stop chatbot for your culinary fantasies....👩🏿‍🍳🔪🍽️!</p>
      <p>Your username is: ${user.username}</p>
      <p><a href="${process.env.BASE_URL}/notes.html">Start Cooking 🧂🍳→</a></p>
    `,
  });

  console.log(`📧 Welcome email sent to ${user.email}`);
});

appEvents.on("user:login", async (user) => {
  await sendEmail({
    to: user.email,
    subject: "Log In Attempt!",
    html: `
      <h2>Hey there 👋, ${user.name}!</h2>
      <p>Your account has been logged into, just making sure it is you.</p>
      <p>If it is not you, contact our customer service :+234 (0)80-xxxx-xxxx!</p>
      <p><a href="${process.env.BASE_URL}/notes.html">Start Cooking 🧂🍳 →</a></p>
    `,
  });
  console.log(`🔓 User logged in: ${user.email}`);
  // Could add email notification here too
});

// ===== NOTE EVENTS =====
appEvents.on("recipe:saved", async (recipe, user) => {
  await sendEmail({
    to: user.email,
    subject: "🧂🍳 New Recipe Saved",
    html: `
      <h2>Hey there 👋, ${user.name}!</h2>
      <p> You saved a new recipe titled: "${recipe.title}"</p>
      <p>It has been saved🧂🍳.</p>
      <p><a href="${process.env.BASE_URL}/recipes.html">View All recipes →</a></p>
    `,
  });

  console.log(`📧 Note confirmation sent to ${user.email}`);
});
