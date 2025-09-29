import React, { useEffect, useState } from "react";
import axios from "axios";
import "./InterviewerDashboard.css"

// --- Candidate List ---
const CandidateList = ({ candidates, onSelect, search, sort }) => {
  // filter + sort
  const filtered = candidates
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "score") return b.score - a.score;
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
          <h3>{c.name}</h3>
          <p>Score: {c.score ?? "—"}</p>
          <p>{c.summary?.slice(0, 80)}...</p>
        </div>
      ))}
    </div>
  );
};

// --- Candidate Detail ---
const CandidateDetail = ({ candidate, onBack }) => (
  <div className="candidate-detail">
    <button onClick={onBack}>← Back</button>
    <h2>{candidate.name}</h2>
    <p><strong>Final Score:</strong> {candidate.score}</p>
    <p><strong>Summary:</strong> {candidate.summary}</p>

    <h3>Answers</h3>
    <ul>
      {candidate.answers.map((qa, i) => (
        <li key={i}>
          <strong>Q{i + 1} ({qa.difficulty}):</strong> {qa.question}<br />
          <em>Answer:</em> {qa.answer}<br />
          <em>Score:</em> {qa.score}/20
        </li>
      ))}
    </ul>
  </div>
);

// --- Dashboard ---
const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");

  useEffect(() => {
    // fetch from backend
    axios.get("http://localhost:5000/candidates")
      .then(res => setCandidates(res.data))
      .catch(err => console.error("❌ Fetch failed:", err));
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
