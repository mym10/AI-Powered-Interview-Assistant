import express from "express";
import { generateQuestion, generateSummary, submitAnswer } from "../controllers/interviewController.js";

const router = express.Router();

router.post("/question", generateQuestion);
router.post("/answer", submitAnswer);
router.post("/summary", generateSummary);

export default router;
