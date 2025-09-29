// resume.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseResume } from "../utils/parser.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = path.join("uploads", req.file.filename);
    const parsedData = await parseResume(filePath);
    fs.unlinkSync(filePath); // cleanup

    // Create session
    if (!global.sessions) global.sessions = {};
    const sessionId = Date.now().toString();
    global.sessions[sessionId] = {
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      answers: [],
    };

    res.json({ sessionId, ...parsedData });
  } catch (err) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

export default router;
