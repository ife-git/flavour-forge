import dns from "dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import rateLimit from "express-rate-limit";

// Force Google DNS to prevent MongoDB connection issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Route imports
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";

// Database connection
import { connectDB } from "./config/db.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== CONNECT TO DATABASE FIRST ==========
await connectDB();

// ========== SECURITY MIDDLEWARE ==========
// Helmet for security headers
app.use(helmet());

// CORS configuration for Vercel frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Important for sessions
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== SESSION CONFIGURATION ==========
app.use(
  session({
    secret: process.env.SESSION_SECRET || "jellyfish-baskingshark",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days session expiry
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      sameSite: "lax",
    },
  }),
);

// ========== HEALTH CHECK ENDPOINT ==========
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Flavour-Forge API is running",
    timestamp: new Date().toISOString(),
  });
});

// ========== MOUNT ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recipes", recipeRoutes);

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/auth/register - Register user`);
  console.log(`   POST /api/auth/login - Login user`);
  console.log(`   POST /api/chat- AI recipe chat`);
  console.log(`   GET  /api/recipes - Get saved recipes`);
  console.log(`   GET  /api/health - Health check`);
});
