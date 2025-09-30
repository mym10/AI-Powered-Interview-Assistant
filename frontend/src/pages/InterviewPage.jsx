// src/pages/InterviewPage.jsx
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

  const [showModal, setShowModal] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const difficultyOrder = [
    { level: "Easy", time: 20 },
    { level: "Easy", time: 20 },
    { level: "Medium", time: 60 },
    { level: "Medium", time: 60 },
    { level: "Hard", time: 120 },
    { level: "Hard", time: 120 },
  ];

  // Fetch session from backend
  const fetchSession = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/interview/session/${sessionId}`);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch session:", err);
      return null;
    }
  };

  // Fetch a new question (only for new session or “Start Fresh”)
  const fetchQuestion = async (index) => {
    const difficulty = difficultyOrder[index].level;

    try {
      const res = await axios.post("http://localhost:5000/interview/question", {
        sessionId,
        difficulty,
      });

      return res.data.question;
    } catch (err) {
      console.error("Failed to fetch question:", err);
      return "";
    }
  };

  // Submit current answer
  const submitAnswer = async () => {
    if (!currentQuestion) return;

    try {
      await axios.post("http://localhost:5000/interview/answer", {
        sessionId,
        answer: currentAnswer || "(No answer given)",
      });
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  // Get final summary
  const fetchSummary = async () => {
    try {
      const res = await axios.post("http://localhost:5000/interview/summary", { sessionId });
      setSummary(res.data.summary);
      setScore(res.data.score);
      localStorage.removeItem("interviewProgress");
      localStorage.removeItem("currentSessionId");
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  // Save progress locally
  useEffect(() => {
    if (!sessionLoaded) return;
    const progress = {
      sessionId,
      questionIndex,
      currentAnswer,
      currentDifficulty,
      timer,
    };
    localStorage.setItem("interviewProgress", JSON.stringify(progress));
  }, [sessionId, questionIndex, currentAnswer, currentDifficulty, timer, sessionLoaded]);

  // Restore progress from localStorage + backend
  const restoreProgress = async () => {
    const savedProgress = JSON.parse(localStorage.getItem("interviewProgress"));
    if (!savedProgress || savedProgress.sessionId !== sessionId) return;

    const session = await fetchSession();
    if (!session) return;

    const qIndex = savedProgress.questionIndex;

    setQuestionIndex(qIndex);
    setCurrentDifficulty(savedProgress.currentDifficulty);
    setTimer(savedProgress.timer);
    setCurrentAnswer(session.answers[qIndex]?.answer || "");
    setCurrentQuestion(session.answers[qIndex]?.question || "");

    setShowModal(false);
    setSessionLoaded(true);
  };

  // Timer effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          handleNext();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // On mount: check if resume or new session
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem("interviewProgress"));

    if (resumeData?.fromResumeUploader) {
      // New session
      localStorage.setItem("currentSessionId", sessionId);
      fetchQuestion(0).then((q) => {
        setCurrentQuestion(q);
        setCurrentDifficulty(difficultyOrder[0].level);
        setTimer(difficultyOrder[0].time);
        setSessionLoaded(true);
      });
      return;
    }

    // Reload / revisit mid-interview
    if (savedProgress && savedProgress.sessionId === sessionId) {
      setShowModal(true);
    } else {
      // fallback
      fetchQuestion(0).then((q) => {
        setCurrentQuestion(q);
        setCurrentDifficulty(difficultyOrder[0].level);
        setTimer(difficultyOrder[0].time);
        setSessionLoaded(true);
      });
    }
  }, [sessionId, resumeData]);

  const handleNext = async () => {
    await submitAnswer();
    const nextIndex = questionIndex + 1;

    if (nextIndex < difficultyOrder.length) {
      const q = await fetchQuestion(nextIndex);   // get new question
      setQuestionIndex(nextIndex);
      setCurrentQuestion(q || "");  // just use the new question
      setCurrentAnswer("");         // reset answer box
      setCurrentDifficulty(difficultyOrder[nextIndex].level);
      setTimer(difficultyOrder[nextIndex].time);
    } else {
      fetchSummary();
    }
  };


  if (summary) {
    return (
      <div className="interview-container">
        <h1>Interview Complete!</h1>
        <div className="parsed-info">
          <p><strong>Candidate:</strong> {resumeData?.name}</p>
          <p><strong>Score:</strong> {score}</p>
          <p><strong>Summary:</strong> {summary}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      <h1>AI Interview Assistant</h1>

      {/* Welcome Back Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Welcome Back!</h3>
            <p>We found an unfinished interview session. Do you want to continue?</p>

            <button onClick={restoreProgress}>Yes, Continue</button>

            <button
              onClick={async () => {
                localStorage.removeItem("interviewProgress");
                localStorage.setItem("currentSessionId", sessionId);
                setShowModal(false);
                const q = await fetchQuestion(0);
                setCurrentQuestion(q);
                setCurrentDifficulty(difficultyOrder[0].level);
                setTimer(difficultyOrder[0].time);
                setQuestionIndex(0);
                setCurrentAnswer("");
                setSessionLoaded(true);
              }}
            >
              No, Start Fresh
            </button>
          </div>
        </div>
      )}

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
