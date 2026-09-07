import "./ReportProblem.css";
import { useState } from "react";

function ReportProblem() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("urban-infrastructure");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [image, setImage] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      // STEP 1: Create the citizen complaint
      const complaintResponse = await fetch(
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

      const complaintData = await complaintResponse.json();

      if (!complaintResponse.ok) {
        alert(complaintData.message || "Failed to submit complaint.");
        return;
      }

      const complaintId = complaintData.complaint._id;

      // STEP 2: Run the REAL SamajSetu AI pipeline
      const aiResponse = await fetch(
        `http://localhost:5000/api/ai/pipeline/${complaintId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const aiData = await aiResponse.json();

      if (!aiResponse.ok) {
        alert(aiData.error || "AI analysis failed.");
        return;
      }

      // The backend returns the actual pipeline inside "pipeline"
      setAnalysis(aiData.pipeline);

      alert("Problem submitted and AI analysis completed successfully!");

      // Clear form
      setTitle("");
      setDescription("");
      setCategory("urban-infrastructure");
      setLocation("");
      setPriority("medium");
      setImage(null);

      e.target.reset();
    } catch (error) {
      console.error("Report problem error:", error);
      alert("Server error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
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
              <option value="urban-infrastructure">
                Urban Infrastructure
              </option>
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

            <label>Location</label>

            <input
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <label>Upload Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Analyzing..."
                : "Submit & Run AI Analysis"}
            </button>

          </form>
        </div>

        <div className="report-right">

          <h2>AI Analysis</h2>

          {!analysis ? (
            <p>
              Submit a problem to run SamajSetu's AI analysis,
              duplicate detection and stakeholder matching.
            </p>
          ) : (
            <div>

              <p>
                <strong>Category:</strong>{" "}
                {analysis.aiAnalysis?.category}
              </p>

              <p>
                <strong>Subcategory:</strong>{" "}
                {analysis.aiAnalysis?.subcategory}
              </p>

              <p>
                <strong>AI Priority:</strong>{" "}
                {analysis.aiAnalysis?.priority}
              </p>

              <p>
                <strong>Summary:</strong>{" "}
                {analysis.aiAnalysis?.summary}
              </p>

              <p>
                <strong>Affected Groups:</strong>{" "}
                {analysis.aiAnalysis?.affectedGroups?.join(", ") ||
                  "General Public"}
              </p>

              <p>
                <strong>Required Expertise:</strong>{" "}
                {analysis.aiAnalysis?.requiredExpertise?.join(", ") ||
                  "Civic Tech Solutions"}
              </p>

              <hr />

              <h3>Duplicate Detection</h3>

              <p>
                <strong>Duplicate:</strong>{" "}
                {analysis.duplicateDetection?.isDuplicate
                  ? "Yes"
                  : "No"}
              </p>

              <p>
                <strong>Similarity:</strong>{" "}
                {analysis.duplicateDetection?.similarityPercentage ||
                  "0%"}
              </p>

              <p>
                {analysis.duplicateDetection?.recommendation}
              </p>

              <hr />

              <h3>Authority Routing</h3>

              <p>
                <strong>Department:</strong>{" "}
                {analysis.authorityRouting?.assignedDepartment ||
                  "Not determined"}
              </p>

              <p>
                <strong>Jurisdiction:</strong>{" "}
                {analysis.authorityRouting?.jurisdiction ||
                  location}
              </p>

              <p>
                <strong>SLA:</strong>{" "}
                {analysis.authorityRouting?.slaTarget
                  ?.resolutionTargetHours
                  ? `${analysis.authorityRouting.slaTarget.resolutionTargetHours} hours`
                  : "Not determined"}
              </p>

              <hr />

              <h3>University Match</h3>

              {analysis.universityMatch ? (
                <>
                  <p>
                    <strong>
                      {analysis.universityMatch.name}
                    </strong>
                  </p>

                  <p>
                    Match Score:{" "}
                    {analysis.universityMatch.matchScore}%
                  </p>

                  <p>
                    Expertise:{" "}
                    {analysis.universityMatch.matchedExpertise?.join(
                      ", "
                    )}
                  </p>
                </>
              ) : (
                <p>No university match found.</p>
              )}

              <hr />

              <h3>Industry Match</h3>

              {analysis.industryMatch ? (
                <>
                  <p>
                    <strong>
                      {analysis.industryMatch.companyName}
                    </strong>
                  </p>

                  <p>
                    Match Score:{" "}
                    {analysis.industryMatch.matchScore}%
                  </p>

                  <p>
                    Support:{" "}
                    {analysis.industryMatch.supportOffered?.join(
                      ", "
                    ) || "General support"}
                  </p>
                </>
              ) : (
                <p>No industry match found.</p>
              )}

              <hr />

              <h3>Challenge</h3>

              <p>
                <strong>Status:</strong>{" "}
                {analysis.challenge?.status || "Open for Matching"}
              </p>

              <p>
                <strong>Complaint ID:</strong>{" "}
                {analysis.complaintId}
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ReportProblem;