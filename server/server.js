import dns from "dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import rateLimit from "express-rate-limit";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

await connectDB();

// ========== CORS - MUST BE FIRST ==========
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://flavour-forge-frontend.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes("onrender.com")
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// ========== SESSION - MUST COME AFTER CORS ==========
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
      httpOnly: false, // ✅ TEMPORARILY SET TO FALSE FOR DEBUGGING
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      domain:
        process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
      path: "/",
    },
  }),
);

// ========== OTHER MIDDLEWARE ==========
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests",
});
app.use("/api/", limiter);

// ========== DEBUGGING MIDDLEWARE ==========
app.use((req, res, next) => {
  console.log("🍪 Cookie header:", req.headers.cookie || "NO COOKIE");
  console.log("🔑 Session ID:", req.sessionID);
  console.log("👤 User ID:", req.session?.userId || "Not logged in");
  next();
});

// ========== ROUTES ==========
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Flavour-Forge API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recipes", recipeRoutes);

// ========== ERROR HANDLERS ==========
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
