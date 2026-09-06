import "./ReportProblem.css";
import { useState } from "react";

function ReportProblem() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Urban Infrastructure");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState("");

  const handleSubmit = async(e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

const response = await fetch(
  "http://localhost:5000/api/complaints",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
  title,
  description,
  category,
  location,
  priority,
}),
  }
);

const data = await response.json();

if (!response.ok) {
  alert(data.message);
  return;
}
    setAnalysis(`
Category : ${category}

Priority : ${priority}

Assigned Department :
Municipal Authority

Suggested Partner :
University + Industry

Estimated Resolution :
5 - 7 Days

Current Status :
Pending Authority Review

Complaint ID :
${data.complaint._id}

Reported On :
${new Date().toLocaleDateString()}
    `);

    alert("Problem Submitted Successfully!");

    setTitle("");
    setDescription("");
    setCategory("Urban Infrastructure");
    setLocation("");
    setPriority("medium");
    setImage(null);

    e.target.reset();
  };

  return (
    <div className="report-container">

      <div className="report-card">

        <div className="report-left">

          <h1>Report a Problem</h1>

          <p className="subtitle">
            Help your community by reporting an issue.
          </p>

          <form onSubmit={handleSubmit}>

            <label>Problem Title</label>

            <input
              type="text"
              placeholder="Enter problem title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Description</label>

            <textarea
              rows="5"
              placeholder="Describe the problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>

            <label>Category</label>

            <select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option value="urban-infrastructure">Urban Infrastructure</option>
  <option value="education">Education</option>
  <option value="healthcare">Healthcare</option>
  <option value="agriculture">Agriculture</option>
  <option value="water">Water</option>
  <option value="sanitation">Sanitation</option>
  <option value="environment">Environment</option>
  <option value="rural-livelihood">Rural Livelihood</option>
  <option value="accessibility">Accessibility</option>
  <option value="public-service">Public Service</option>
</select>

            <label>Location</label>

            <input
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <label>Severity</label>

            <select
  value={priority}
  onChange={(e) => setPriority(e.target.value)}
>
  <option value="low">Low</option>
  <option value="medium">Medium</option>
  <option value="high">High</option>
  <option value="critical">Critical</option>
</select>

            <label>Upload Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button type="submit">
              Submit & Run AI Analysis
            </button>

          </form>

        </div>

        <div className="report-right">

          <h2>AI Analysis Preview</h2>

          {analysis ? (
            <pre>{analysis}</pre>
          ) : (
            <p>
              Submit a problem to simulate SamajSetu's AI
              understanding, priority assessment and routing.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default ReportProblem;