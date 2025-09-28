// src/pages/IntervieweePage.jsx
import "./IntervieweePage.css";
import ResumeUploader from "./ResumeUploader";

export default function IntervieweePage() {
  return (
    <>
        <div className="interviewee-container"></div>
        <div className="center-content">
            <div className="interviewee-title">
                <span className="white-text">Your </span>
                <span className="gradient-text">AI Powered Interview Assistant</span>
            </div>
            <ResumeUploader/>
        </div>
    </>
    );
}
