import User from "../models/User.js";
import { appEvents } from "../events/eventEmitter.js";
import bcrypt from "bcryptjs";

// @desc    Register a new user
// @route   POST /api/auth/register
export async function register(req, res) {
  try {
    let { name, email, username, password } = req.body;

    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: "⚠️ All fields are required",
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();
    username = username.trim();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "⚠️ Email or username already in use",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
    });

    // Store user in session
    req.session.userId = user._id;

    console.log("📝 Saving registration session...");
    console.log("   Session ID:", req.sessionID);
    console.log("   User ID:", req.session.userId);
    console.log("   Session cookie domain:", req.session.cookie?.domain);

    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({
          error: "Couldn't create session.",
        });
      }

      console.log("✅ Registration session saved to MongoDB!");
      console.log("   Session ID:", req.sessionID);
      console.log("   User ID:", req.session.userId);

      // Send welcome email (don't let failure affect registration)
      try {
        appEvents.emit("user:registered", user);
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
      }

      res.status(201).json({
        message: "✅ User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
      });
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      error: "⚠️ Registration failed",
    });
  }
}

// @desc    Login user
// @route   POST /api/auth/login
export async function login(req, res) {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "⚠️ Username and password required",
      });
    }

    username = username.trim();

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        error: "⚠️ Invalid credentials",
      });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: "⚠️ Invalid credentials",
      });
    }

    // Store user in session
    req.session.userId = user._id;

    console.log("📝 Saving login session...");
    console.log("   Session ID:", req.sessionID);
    console.log("   User ID:", req.session.userId);
    console.log("   Session cookie domain:", req.session.cookie?.domain);

    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({
          error: "Couldn't create session.",
        });
      }

      console.log("✅ Login session saved to MongoDB!");
      console.log("   Session ID:", req.sessionID);
      console.log("   User ID:", req.session.userId);

      // Send login notification (don't let failure affect login)
      try {
        appEvents.emit("user:login", user);
      } catch (emailError) {
        console.error("Login email error:", emailError);
      }

      res.json({
        message: "✅ Logged in successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      error: "⚠️ Login failed",
    });
  }
}

// @desc    Logout user
// @route   GET /api/auth/logout
export async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "⚠️ Logout failed",
      });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      domain: ".onrender.com",
      secure: true,
      sameSite: "none",
    });

    res.json({
      message: "✅ Logged out successfully",
    });
  });
}

// @desc    Get current user
// @route   GET /api/auth/me
export async function getMe(req, res) {
  try {
    if (!req.session.userId) {
      return res.json({
        isLoggedIn: false,
      });
    }

    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      req.session.destroy();
      return res.json({
        isLoggedIn: false,
      });
    }

    res.json({
      isLoggedIn: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({
      error: "⚠️ Server error",
    });
  }
}
