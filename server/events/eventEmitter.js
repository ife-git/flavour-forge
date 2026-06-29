import { EventEmitter } from "node:events";
import { sendEmail } from "../services/emailService.js";

export const appEvents = new EventEmitter();

// ===== USER EVENTS =====
appEvents.on("user:registered", async (user) => {
  try {
    await sendEmail({
      to: user.email,
      subject: "🎉 Welcome to Flavour-Forge!",
      html: `
        <h2>Welcome ${user.name}!</h2>
        <p>Thank you for joining Flavour-Forge. Your one stop chatbot for your culinary fantasies....👩🏿‍🍳🔪🍽️!</p>
        <p>Your username is: ${user.username}</p>
        <p><a href="https://flavour-forge-frontend.onrender.com">Start Cooking 🧂🍳→</a></p>
      `,
    });
    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send welcome email to ${user.email}:`,
      error.message,
    );
  }
});

appEvents.on("user:login", async (user) => {
  try {
    await sendEmail({
      to: user.email,
      subject: "Log In Attempt!",
      html: `
        <h2>Hey there 👋, ${user.name}!</h2>
        <p>Your account has been logged into, just making sure it is you.</p>
        <p>If it is not you, contact our customer service :+234 (0)80-xxxx-xxxx!</p>
        <p><a href="https://flavour-forge-frontend.onrender.com">Start Cooking 🧂🍳 →</a></p>
      `,
    });
    console.log(`🔓 User logged in: ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send login email to ${user.email}:`,
      error.message,
    );
  }
});

appEvents.on("recipe:saved", async (recipe, user) => {
  try {
    await sendEmail({
      to: user.email,
      subject: "🧂🍳 New Recipe Saved",
      html: `
        <h2>Hey there 👋, ${user.name}!</h2>
        <p> You saved a new recipe titled: "${recipe.title}"</p>
        <p>It has been saved🧂🍳.</p>
        <p><a href="https://flavour-forge-frontend.onrender.com">View All recipes →</a></p>
      `,
    });
    console.log(`📧 Recipe confirmation sent to ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send recipe email to ${user.email}:`,
      error.message,
    );
  }
});
