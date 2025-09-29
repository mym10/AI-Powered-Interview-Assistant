// app.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import resumeRoutes from "./routes/resume.js";
import interviewRoutes from "./routes/interview.js";
import candidateRoutes from "./routes/candidate.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/resume", resumeRoutes);
app.use("/interview", interviewRoutes);
app.use("/candidates", candidateRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
