// candidate.js
import express from "express";
const router = express.Router();

// Log every request
router.use((req, res, next) => {
  console.log(`[Candidate Route] ${req.method} ${req.originalUrl}`);
  next();
});

// GET all candidates
router.get("/", (req, res) => {
  console.log("Fetching all candidates...");

  if (!global.sessions) {
    console.log("No sessions found.");
    global.sessions = {};
  }

  const candidates = Object.entries(global.sessions).map(([sessionId, data]) => {
    console.log("Candidate found:", sessionId, data.name);
    return {
      sessionId,
      name: data.name || `Candidate ${sessionId}`,
      score: data.finalScore || 0,
      summary: data.summary || "No summary yet",
      answers: data.answers || []
    };
  });

  console.log("Total candidates:", candidates.length);
  res.json(candidates);
});

// GET single candidate
router.get("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  console.log(`Fetching candidate ${sessionId}...`);

  if (!global.sessions || !global.sessions[sessionId]) {
    console.log("Candidate not found!");
    return res.status(404).json({ error: "Candidate not found" });
  }

  const candidate = {
    sessionId,
    name: global.sessions[sessionId].name || `Candidate ${sessionId}`,
    score: global.sessions[sessionId].finalScore || 0,
    summary: global.sessions[sessionId].summary || "No summary yet",
    answers: global.sessions[sessionId].answers || []
  };

  console.log("Candidate details:", candidate);
  res.json(candidate);
});

export default router;
