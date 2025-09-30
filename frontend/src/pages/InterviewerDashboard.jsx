import React, { useEffect, useState } from "react";
import axios from "axios";
import "./InterviewerDashboard.css";

// --- Candidate List ---
const CandidateList = ({ candidates, onSelect, search, sort }) => {
  const filtered = candidates
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "score") return (b.score || 0) - (a.score || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="candidate-list">
      {filtered.map(c => (
        <div
          key={c.sessionId}
          className="candidate-card"
          onClick={() => onSelect(c.sessionId)}
        >
          <h3>{c.name || `Candidate ${c.sessionId}`}</h3>
          <p>Score: {c.score ?? "—"}</p>
          <p>{c.summary?.slice(0, 80) || "No summary yet"}...</p>
        </div>
      ))}
    </div>
  );
};

// --- Candidate Detail ---
const CandidateDetail = ({ candidate, onBack }) => (
  <div className="candidate-detail">
    <button onClick={onBack}>← Back</button>
    <h2>{candidate.name || `Candidate ${candidate.sessionId}`}</h2>
    <p><strong>Final Score:</strong> {candidate.score ?? "—"}</p>
    <p><strong>Summary:</strong> {candidate.summary || "No summary yet"}</p>

    <h3>Answers</h3>
    {candidate.answers?.length > 0 ? (
      <ul>
        {candidate.answers.map((qa, i) => (
          <li key={i}>
            <strong>Q{i + 1} ({qa.difficulty}):</strong> {qa.question}<br />
            <em>Answer:</em> {qa.answer || "(Not answered)"}<br />
            <em>Score:</em> {qa.score != null ? qa.score : "—"}/20
          </li>
        ))}
      </ul>
    ) : (
      <p>No answers yet.</p>
    )}
  </div>
);

// --- Dashboard ---
const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/candidates");
      setCandidates(res.data);
    } catch (err) {
      console.error("❌ Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const candidate = candidates.find(c => c.sessionId === selected);

  return (
    <div className="dashboard">
      {!selected ? (
        <>
          <div className="controls">
            <input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
            </select>
            <button onClick={fetchCandidates}>Refresh</button>
          </div>

          <CandidateList
            candidates={candidates}
            onSelect={setSelected}
            search={search}
            sort={sort}
          />
        </>
      ) : (
        <CandidateDetail
          candidate={candidate}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
