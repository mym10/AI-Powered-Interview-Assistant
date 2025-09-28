import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import IntervieweePage from "./pages/IntervieweePage";
import InterviewPage from "./pages/InterviewPage";
// import InterviewerDashboard from "./pages/InterviewerDashboard"; // placeholder

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/interviewee" replace />} />
        <Route path="/interviewee" element={<IntervieweePage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/interviewer" element={<h1>Interviewer Dashboard (Coming Soon)</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
