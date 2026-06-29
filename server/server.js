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
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// ========== CONNECT TO DATABASE FIRST ==========
await connectDB();

// ========== SECURITY MIDDLEWARE ==========
// Helmet for security headers
app.use(helmet());

// ========== CORS CONFIGURATION ==========
// Allow multiple origins (development + production)
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "http://localhost:5174", // Alternative local port
  "https://flavour-forge-frontend.onrender.com", // Production frontend
  process.env.FRONTEND_URL, // Custom frontend URL from env
].filter(Boolean); // Remove any undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Important for sessions
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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
console.log(
  "🔗 MongoDB URI:",
  process.env.MONGODB_URI?.substring(0, 30) + "...",
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "jellyfish-baskingshark",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      domain:
        process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
    },
  }),
);

// Add session debugging
app.use((req, res, next) => {
  console.log("🔍 Session Debug:", {
    sessionId: req.sessionID,
    userId: req.session?.userId,
    hasSession: !!req.session,
    cookie: req.headers.cookie?.substring(0, 50) + "...",
  });
  next();
});

// Force session save
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.save();
  }
  next();
});

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
  console.log(`   POST /api/chat - AI recipe chat`);
  console.log(`   GET  /api/recipes - Get saved recipes`);
  console.log(`   GET  /api/health - Health check`);
});
