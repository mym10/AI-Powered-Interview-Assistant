import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./InterviewPage.css";

function InterviewPage() {
  const location = useLocation();
  const { resumeData } = location.state || {};

  const sessionId = resumeData?.sessionId;
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("Easy");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(0);

  const [summary, setSummary] = useState(null);
  const [score, setScore] = useState(null);

  // Difficulty mapping
  const difficultyOrder = [
    { level: "Easy", time: 20 },
    { level: "Easy", time: 20 },
    { level: "Medium", time: 60 },
    { level: "Medium", time: 60 },
    { level: "Hard", time: 120 },
    { level: "Hard", time: 120 },
  ];

  // Fetch next question from backend
  const fetchQuestion = async (index) => {
    const difficulty = difficultyOrder[index].level;

    const res = await axios.post("http://localhost:5000/interview/question", {
      sessionId,
      difficulty,
    });

    setCurrentQuestion(res.data.question);
    setCurrentDifficulty(difficulty);
    setTimer(difficultyOrder[index].time);
    setCurrentAnswer("");
  };

  // Submit current answer
  const submitAnswer = async () => {
    if (!currentQuestion) return;

    await axios.post("http://localhost:5000/interview/answer", {
      sessionId,
      question: currentQuestion,
      answer: currentAnswer || "(No answer given)",
      difficulty: currentDifficulty,
    });
  };

  // Get summary from backend
  const fetchSummary = async () => {
    const res = await axios.post("http://localhost:5000/interview/summary", {
      sessionId,
    });
    setSummary(res.data.summary);
    setScore(res.data.score);
  };

  // Timer effect
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          handleNext(); // auto-submit on timeout
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // On mount, fetch first question
  useEffect(() => {
    fetchQuestion(0);
  }, []);

  const handleNext = async () => {
    await submitAnswer();

    const nextIndex = questionIndex + 1;

    if (nextIndex < difficultyOrder.length) {
        await fetchQuestion(nextIndex);
        setQuestionIndex(nextIndex);
    } else {
      fetchSummary();
    }
  };

  // End of interview
  if (summary) {
    return (
    <div className="interview-container">
      <h1>Interview Complete!</h1>
      <div className="parsed-info">
        <p><strong>Candidate:</strong> {resumeData?.name}</p>
        <p><strong>Score:</strong> {score}/60</p>
        <p><strong>Summary:</strong> {summary}</p>
      </div>
    </div>
  );
  }

  return (
    <div className="interview-container">
      <h1>AI Interview Assistant</h1>
      <div className="question-box">
        <p>
          <strong>Question {questionIndex + 1}:</strong> {currentQuestion}
        </p>
        <p>
          <strong>Time left:</strong> {timer}s
        </p>
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here..."
        />
        <button className="next-button" onClick={handleNext}>
          {questionIndex + 1 < difficultyOrder.length ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
}

export default InterviewPage;
