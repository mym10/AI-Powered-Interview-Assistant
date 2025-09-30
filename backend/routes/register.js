import express from "express";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();

router.post("/", (req, res) => {
  try {
    let { name, email, phone } = req.body;

    name = name?.trim();
    email = email?.trim() || "";
    phone = phone?.trim() || "";

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!global.sessions) global.sessions = {};

    // Check for existing candidate
    const existingSession = Object.entries(global.sessions).find(([id, data]) => {
      if (email) return data.email === email;
      // fallback: compare name + phone if email missing
      return data.name === name && data.phone === phone;
    });

    if (existingSession) {
      const [sessionId, data] = existingSession;
      console.log(`♻️ Candidate already registered: ${data.name} (Session: ${sessionId})`);
      return res.json({
        sessionId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: "Candidate already registered",
      });
    }

    // Create new session
    const sessionId = uuidv4();
    global.sessions[sessionId] = {
      name: name,
      email,
      phone,
      answers: [],
      finalScore: 0,
      summary: null,
    };

    console.log(`✅ Registered new candidate: ${name} (Session: ${sessionId})`);

    res.json({
      sessionId,
      name,
      email,
      phone,
      message: "Candidate registered successfully",
    });
  } catch (err) {
    console.error("❌ Error registering candidate:", err);
    res.status(500).json({ error: "Failed to register candidate" });
  }
});

export default router;
