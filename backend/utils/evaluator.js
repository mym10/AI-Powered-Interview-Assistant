import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";

dotenv.config();
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * Evaluate a single answer for quality
 */
export const evaluateAnswer = async (answer, question, difficulty) => {
  if (!answer || answer.trim().length === 0) return 0;

  const prompt = `
You are an interview evaluator.
Question: "${question}"
Candidate Answer: "${answer}"
Difficulty: ${difficulty}

Score the answer strictly from 0 to 20.
Criteria:
- Accuracy
- Clarity
- Completeness
- Relevance
Return ONLY the numeric score.`;

  try {
    const response = await client.chat.complete({
      model: "mistral-medium", // can also use mistral-large if you have credits
      messages: [{ role: "user", content: prompt }],
    });

    const scoreText = response.choices[0].message.content.trim();
    const numericScore = parseInt(scoreText, 10);

    if (isNaN(numericScore)) return 0;
    return numericScore;
  } catch (err) {
    console.error("❌ Error evaluating answer:", err);
    return 0; // fallback
  }
};

/**
 * Generate overall summary from all answers
 */
export const generateAiSummary = async (answers) => {
  const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);

  const prompt = `
  You are an interview summarizer.
  Here are the candidate's answers with scores:

  ${answers
    .map(
      (a, i) =>
        `Q${i + 1} (${a.difficulty}): ${a.question}\nAnswer: ${a.answer}\nScore: ${a.score}/20\n`
    )
    .join("\n")}

  Provide:
  1. A short professional summary of the candidate's performance.
  2. Strengths and weaknesses.
  3. Final recommendation.

  Keep it concise, 4-6 sentences. Do not use bold style for words. 
  Neatly format the responce. only give the responce.
`;
  try {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
    });

    return {
      summary: response.choices[0].message.content.trim(),
      totalScore,
    };
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    return {
      summary: "Error generating summary. Please review manually.",
      totalScore,
    };
  }
};
