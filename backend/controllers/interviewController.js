import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import { evaluateAnswer, generateAiSummary } from "../utils/evaluator.js";

dotenv.config();
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// Difficulty → time mapping
const difficultyTimers = {
  Easy: 20,
  Medium: 60,
  Hard: 120,
};

// Max score per difficulty for capping
const difficultyMaxScore = {
  Easy: 5,
  Medium: 10,
  Hard: 15,
};

// --- Generate a new question ---
export const generateQuestion = async (req, res) => {
  try {
    const { sessionId, difficulty, name, email } = req.body;

    // Ensure session exists
    if (!global.sessions) global.sessions = {};
    if (!global.sessions[sessionId]) {
      global.sessions[sessionId] = {
        answers: [],
        name: name || `Candidate ${sessionId}`,
        email: email || "",
      };
    }

    const prevQA = global.sessions[sessionId].answers;

    // Prompt to Mistral
    const prompt = `
      You are an interviewer for a Full Stack React/Node.js role.
      Generate ONE new ${difficulty} interview question.
      Do NOT repeat these: ${prevQA.map(q => `"${q.question}"`).join(", ") || "None"}.
      Only concise verbal questions, max 3-4 sentences.
      Do not ask followup questions. Do not write any words in bold. Simply return the question.
      Do not ask questions on codeing or designing or implementing.
    `;


    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
    });

    const question = chatResponse.choices[0].message.content.trim();

    // Save question immediately
    global.sessions[sessionId].answers.push({
      question,
      answer: null,
      difficulty,
      score: null,
    });

    console.log(`📝 Generated question for ${sessionId}: ${question}`);

    res.json({
      question,
      timer: difficultyTimers[difficulty] || 60,
    });
  } catch (err) {
    console.error("❌ Error generating question:", err);
    res.status(500).json({ error: "Failed to generate question" });
  }
};

// --- Submit answer ---
export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    const session = global.sessions?.[sessionId];
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Find first unanswered question
    const questionObj = session.answers.find(q => q.answer === null);
    if (!questionObj)
      return res.status(400).json({ error: "No pending question to answer" });

    // Evaluate answer
    const score = await evaluateAnswer(answer, questionObj.question, questionObj.difficulty);

    questionObj.answer = answer;
    questionObj.score = score;

    console.log(`✅ Answer saved for ${sessionId}:`, questionObj);

    res.json({ success: true, score });
  } catch (err) {
    console.error("❌ Error saving answer:", err);
    res.status(500).json({ error: "Failed to save answer" });
  }
};

// --- Generate final summary ---
export const generateSummary = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = global.sessions?.[sessionId];
    if (!session || !session.answers.length) {
      return res.status(404).json({ error: "No answers found for this session" });
    }

    const prevQA = session.answers;

    // Generate AI summary
    const { summary } = await generateAiSummary(prevQA);

    // Cap scores by difficulty
    const totalScore = prevQA.reduce((sum, qa) => {
      const max = difficultyMaxScore[qa.difficulty] || 10;
      return sum + Math.min(qa.score || 0, max);
    }, 0);

    session.finalScore = totalScore;
    session.summary = summary;

    console.log(`📝 Summary for ${sessionId}:`, summary, `Score: ${totalScore}`);

    res.json({
      score: totalScore,
      summary,
      answers: prevQA,
      name: session.name,
      email: session.email,
    });
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};
