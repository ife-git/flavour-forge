import User from "../models/User.js";
import { getRecipe } from "../services/aiService.js";
import { v4 as uuidv4 } from "uuid";

// Helper to convert AI response JSON to readable text
function formatAIResponseToText(aiResponse) {
  if (!aiResponse.title) {
    return JSON.stringify(aiResponse);
  }

  let text = `${aiResponse.title}\n\n`;

  if (aiResponse.ingredients && aiResponse.ingredients.length > 0) {
    text += `Ingredients:\n`;
    for (const ing of aiResponse.ingredients) {
      text += `- ${ing.amount} ${ing.unit} ${ing.name}\n`;
    }
    text += `\n`;
  }

  if (aiResponse.steps && aiResponse.steps.length > 0) {
    text += `Instructions:\n`;
    for (let i = 0; i < aiResponse.steps.length; i++) {
      text += `${i + 1}. ${aiResponse.steps[i]}\n`;
    }
    text += `\n`;
  }

  if (aiResponse.followUp) {
    text += `${aiResponse.followUp}\n`;
  }

  return text.trim();
}

// Helper to convert stored message back to readable display format
function formatMessageForDisplay(msg) {
  if (
    msg.role === "assistant" &&
    typeof msg.content === "string" &&
    msg.content.startsWith("{")
  ) {
    try {
      const parsed = JSON.parse(msg.content);
      return formatAIResponseToText(parsed);
    } catch (e) {
      return msg.content;
    }
  }
  return msg.content;
}

// Helper to get or create chat session
async function getOrCreateSession(userId, sessionId = null) {
  const user = await User.findById(userId);

  console.log("🔍 getOrCreateSession Debug:", {
    userId,
    requestedSessionId: sessionId,
    userHasChatSessions: !!user.chatSessions,
    numSessions: user.chatSessions?.length || 0,
    allSessionIds: user.chatSessions?.map((s) => s.sessionId) || [],
  });

  if (sessionId) {
    const session = user.chatSessions.find((s) => s.sessionId === sessionId);

    if (session) {
      console.log(
        `✅ Found existing session: ${sessionId} with ${session.messages?.length || 0} messages`,
      );
      return { user, session };
    } else {
      console.log(
        `❌ Session ${sessionId} NOT FOUND in user's sessions! Creating new one.`,
      );
    }
  }

  const newSession = {
    sessionId: uuidv4(),
    title: "New Conversation",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  user.chatSessions.push(newSession);
  await user.save();
  console.log(`✨ Created NEW session: ${newSession.sessionId}`);
  return { user, session: newSession };
}

export async function chatWithAI(req, res) {
  try {
    const { message, sessionId } = req.body;
    const userId = req.session.userId;

    console.log("📥 Received request:", {
      message: message?.substring(0, 50),
      sessionId,
      userId,
      hasSession: !!sessionId,
    });

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let user = await User.findById(userId);
    let session;
    let isNewSession = false;

    if (sessionId) {
      session = user.chatSessions.find((s) => s.sessionId === sessionId);
      if (session) {
        console.log(
          `✅ Found existing session with ${session.messages?.length || 0} messages`,
        );
      }
    }

    if (!session) {
      isNewSession = true;
      session = {
        sessionId: uuidv4(),
        title: "New Conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      user.chatSessions.push(session);
      console.log(`✨ Created NEW session: ${session.sessionId}`);
    }

    // Add user message
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Build conversation history for AI
    const historyForAI = session.messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log(`📊 Context: ${historyForAI.length} previous messages`);

    // Get AI response
    const aiResponse = await getRecipe({
      message,
      history: historyForAI,
      spiceTolerance: user.spiceTolerance,
    });

    // Add AI response
    const readableResponse = formatAIResponseToText(aiResponse);
    session.messages.push({
      role: "assistant",
      content: readableResponse,
      timestamp: new Date(),
    });

    if (session.messages.length === 2) {
      session.title = aiResponse.title || "Recipe Chat";
    }
    session.updatedAt = new Date();

    // ✅ CRITICAL FIX: Use findOneAndUpdate to directly update the database
    if (isNewSession) {
      // For new session, push the whole session
      await User.updateOne(
        { _id: userId },
        {
          $push: {
            chatSessions: session,
          },
        },
      );
    } else {
      // For existing session, update the specific session
      await User.updateOne(
        {
          _id: userId,
          "chatSessions.sessionId": session.sessionId,
        },
        {
          $set: {
            "chatSessions.$.messages": session.messages,
            "chatSessions.$.title": session.title,
            "chatSessions.$.updatedAt": session.updatedAt,
          },
        },
      );
    }

    // Refresh user to get updated data
    user = await User.findById(userId);
    const updatedSession = user.chatSessions.find(
      (s) => s.sessionId === session.sessionId,
    );
    console.log(
      `💾 Session now has ${updatedSession?.messages?.length || 0} total messages`,
    );

    res.json({
      sessionId: session.sessionId,
      recipe: aiResponse,
      message: "Recipe generated!",
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
}

export async function getChatSessions(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    const sessions = user.chatSessions.map((s) => ({
      id: s.sessionId,
      title: s.title,
      updatedAt: s.updatedAt,
      preview: s.messages[0]?.content?.substring(0, 50) || "New chat",
    }));

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}

export async function loadSession(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    const session = user.chatSessions.find(
      (s) => s.sessionId === req.params.id,
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const formattedMessages = session.messages.map((msg) => ({
      role: msg.role,
      content: formatMessageForDisplay(msg),
      timestamp: msg.timestamp,
    }));

    res.json({
      sessionId: session.sessionId,
      title: session.title,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Load session error:", error);
    res.status(500).json({ error: "Failed to load session" });
  }
}

export async function saveRecipeToUser(req, res) {
  res.json({ message: "Coming soon" });
}

export async function updateSessionTitle(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.session.userId;

    const user = await User.findById(userId);
    const session = user.chatSessions.find((s) => s.sessionId === id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.title = title;
    session.updatedAt = new Date();
    await user.save();

    res.json({ success: true, title });
  } catch (error) {
    console.error("Update title error:", error);
    res.status(500).json({ error: "Failed to update title" });
  }
}
