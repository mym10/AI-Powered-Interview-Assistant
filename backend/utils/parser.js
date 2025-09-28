// utils/parser.js
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function parseResume(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = "";

  if (ext === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);
    text = parsed.text;
  } else if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else {
    throw new Error("Unsupported file type");
  }

  // Naive regexes
  const nameMatch = text.match(/([A-Z][a-z]+\s[A-Z][a-z]+)/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  const phoneMatch = text.match(/\+?\d[\d\s-]{8,15}\d/);

  return {
    name: nameMatch ? nameMatch[0] : null,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
  };
}

module.exports = { parseResume };
