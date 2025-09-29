import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import { evaluateAnswer, generateAiSummary} from "../utils/evaluator.js";

dotenv.config();

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// In-memory session store (per candidate/session)
const sessions = {};

// Difficulty → time mapping
const difficultyTimers = {
  easy: 20,
  medium: 60,
  hard: 120,
};

// Generate a question dynamically
export const generateQuestion = async (req, res) => {
  try {
    const { sessionId, difficulty } = req.body;

    // Ensure global sessions store exists
    if (!global.sessions) global.sessions = {};
    if (!global.sessions[sessionId]) {
      global.sessions[sessionId] = { answers: [] };
    }

    const prevQA = global.sessions[sessionId].answers;

    // Build prompt
    const prompt = `
    You are an interviewer for a Full Stack React/Node.js role.
    Generate ONE new ${difficulty} interview question.
    Do NOT repeat these: ${prevQA.map(qa => `"${qa.question}"`).join(", ") || "None"}.
    The question must be:
    - Concise (max 3-4 sentences).
    - Challenging, according to the difficulty level.
    - Only return the question text.
    - Only ask questions that require verbal answers and not 'design' or 'implement' or 'code' questions.
    `;

    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
    });

    const question = chatResponse.choices[0].message.content.trim();

    // Save the generated question immediately
    global.sessions[sessionId].answers.push({
      question,
      answer: null,
      difficulty,
      score: null,
    });

    res.json({
      question,
      timer: difficultyTimers[difficulty.toLowerCase()] || 60,
    });
  } catch (err) {
    console.error("❌ Error generating question:", err);
    res.status(500).json({ error: "Failed to generate question" });
  }
};


export const submitAnswer = async (req, res) => {
  const { sessionId, question, answer, difficulty } = req.body;

  try {
    // Evaluate quality of answer
    const score = await evaluateAnswer(answer, question, difficulty);

    // Make sure global store exists
    if (!global.sessions) global.sessions = {};
    if (!global.sessions[sessionId]) {
      global.sessions[sessionId] = { answers: [] };
    }

    // Save question, answer, difficulty, and score
    global.sessions[sessionId].answers.push({question,answer,difficulty,score,
    });

    res.json({ success: true, score });
  } catch (err) {
    console.error("❌ Error saving answer:", err);
    res.status(500).json({ error: "Failed to save answer" });
  }
};


// Final summary after all answers
export const generateSummary = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const prevQA = global.sessions?.[sessionId]?.answers || [];
    console.log("📝 Sessions dump:", JSON.stringify(global.sessions, null, 2));

    if (!prevQA.length) {
      return res.status(404).json({ error: "No answers found for this session" });
    }

    // 👉 Call AI to generate summary
    const { summary, totalScore } = await generateAiSummary(prevQA);

    // ✅ Save into the candidate session so interviewer dashboard can read it
    global.sessions[sessionId].finalScore = totalScore;
    global.sessions[sessionId].summary = summary;

    res.json({
      score: totalScore,
      summary,
      answers: prevQA, // still send answers if frontend needs details
    });
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};


