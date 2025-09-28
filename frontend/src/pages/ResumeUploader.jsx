import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CloudUpload } from "lucide-react";
import "./IntervieweePage.css";

export default function ResumeUploader() {
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  const handleFile = async (uploadedFile) => {
    if (!uploadedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(uploadedFile.type)) {
      setError("Only PDF or DOCX files are allowed.");
      setFile(null);
      return;
    }

    setError("");
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append("resume", uploadedFile);

    try {
      const res = await axios.post("http://localhost:5000/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResumeData({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume");
    }
  };

  const handleSubmit = () => {
    if (!resumeData.name || !resumeData.email || !resumeData.phone) {
      setError("Please fill all fields before starting the interview.");
      return;
    }
 
    navigate("/interview", { state: { resumeData } });
  };

  return (
    <div className="card">
      <div className="card-title">Resume</div>
      <div className="card-subtitle">*Please upload only PDF/DOCX files</div>
      
      <div
        className={`upload-box ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const uploadedFile = e.dataTransfer.files[0];
          handleFile(uploadedFile);
        }}
      >
        <label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <span className="upload-text">
            <CloudUpload viewBox="0 0 25 15" /> Click or drag your file here
          </span>
        </label>
      </div>


      {error && <p style={{ color: "red" }}>{error}</p>}

      {(resumeData.name || resumeData.email || resumeData.phone) && (
        <div className="parsed-info">
          <p>
            <strong>Name:</strong>{" "}
            <input
              type="text"
              value={resumeData.name}
              onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
              placeholder="Enter your name"
            />
            {!resumeData.name && <span className="field-error">*Field required</span>}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <input
              type="email"
              value={resumeData.email}
              onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
              placeholder="Enter your email"
            />
            {!resumeData.email && <span className="field-error">*Field required</span>}
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <input
              type="text"
              value={resumeData.phone}
              onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
              placeholder="Enter your phone"
            />
            {!resumeData.phone && <span className="field-error">*Field required</span>}
          </p>
        </div>
      )}

      <button className="start-button" onClick={handleSubmit}>
        Start Now
      </button>
    </div>
  );
}
