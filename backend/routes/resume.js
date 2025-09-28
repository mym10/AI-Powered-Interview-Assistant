const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parseResume } = require("../utils/parser");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    // keep original extension
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });


router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = path.join(__dirname, "..", req.file.path);

    const parsedData = await parseResume(filePath);

    // cleanup file (optional)
    fs.unlinkSync(filePath);

    res.json(parsedData);
  } catch (err) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

module.exports = router;
