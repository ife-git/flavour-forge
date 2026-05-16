// server/services/resendService.js
import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

//const testMode = true; change to false when you add a domain and want to send real emails line 40

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Call the verification function IMMEDIATELY
verifyResendConnection();

async function verifyResendConnection() {
  try {
    // Simple API test to check if key is valid
    const { data, error } = await resend.emails.send({
      from: "Flavour Forge 🧂🍳 <onboarding@resend.dev>",
      to: ["delivered@resend.dev"], // Resend's test inbox
      subject: "Test Connection",
      html: "<p>Testing Resend connection</p>",
    });

    if (error) {
      console.log("❌ Resend connection error:", error);
    } else {
      console.log("✅ Resend email service ready to send messages");
    }
  } catch (error) {
    console.log("❌ Resend connection error:", error);
  }
}

export async function sendEmail({ to, subject, html }) {
  const testMode = true; // Set to false when you add a domain
  const actualRecipient = testMode ? "ifeoluwadaramola61@gmail.com" : to;

  // Don't send emails in development unless explicitly wanted
  if (process.env.NODE_ENV === "development" && !process.env.SEND_EMAILS_DEV) {
    console.log(
      `📧 [DEV MODE] Would send email to: ${actualRecipient} (original: ${to})`,
    );
    console.log(`   Subject: ${subject}`);
    console.log(`   Preview: ${html.substring(0, 100)}...`);
    return { success: true, devMode: true };
  }

  try {
    console.log(`📧 Attempting to send email to: ${actualRecipient}`);

    const { data, error } = await resend.emails.send({
      from: "Flavour Forge 🧂🍳 <onboarding@resend.dev>",
      to: [actualRecipient], // ← FIXED: using actualRecipient
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent via Resend: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error: error.message };
  }
}
