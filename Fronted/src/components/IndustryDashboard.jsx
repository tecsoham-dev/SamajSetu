import "./IndustryDashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaIndustry,
  FaHandshake,
  FaProjectDiagram,
  FaChartLine,
  FaUserGraduate,
  FaSignOutAlt,
} from "react-icons/fa";

function IndustryDashboard() {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://https://samajsetu.onrender.com/api/complaints",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          const assigned = (data.complaints || []).filter(
            (item) => item.assignedTo === "Industry"
          );

          setComplaints(assigned);
        } else {
          console.error(data.message || "Failed to fetch complaints");
        }
      } catch (error) {
        console.error("Error fetching industry complaints:", error);
      }
    };

    fetchComplaints();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://https://samajsetu.onrender.com/api/complaints/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to update status");
        return;
      }

      setComplaints((prev) =>
        prev.map((item) =>
          item._id === id ? data.complaint : item
        )
      );

      alert("Status updated successfully!");
    } catch (error) {
      console.error("Status update error:", error);
      alert("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="industry-dashboard">

      <div className="sidebar">
        <h2 className="logo">SamajSetu</h2>

        <ul>
          <li className="active">
            <FaIndustry /> Dashboard
          </li>

          <li>
            <FaHandshake /> Collaborations
          </li>

          <li>
            <FaProjectDiagram /> Challenges
          </li>

          <li>
            <FaUserGraduate /> Mentor Students
          </li>

          <li>
            <FaChartLine /> Analytics
          </li>

          <li onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </li>
        </ul>
      </div>

      <div className="main-content">

        <div className="dashboard-header">
          <div>
            <h1>Welcome 👋</h1>
            <p>Industry Dashboard</p>
          </div>

          <button className="industry-btn">
            + New Collaboration
          </button>
        </div>

        <div className="cards">

          <div className="card">
            <h2>{complaints.length}</h2>
            <p>Open Challenges</p>
          </div>

          <div className="card">
            <h2>8</h2>
            <p>Collaborations</p>
          </div>

          <div className="card">
            <h2>6</h2>
            <p>Projects Running</p>
          </div>

          <div className="card">
            <h2>4</h2>
            <p>Completed Projects</p>
          </div>

        </div>

        <div className="table-section">

          <h2>Current Collaborations</h2>

          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    No Complaints Found
                  </td>
                </tr>
              ) : (
                complaints.map((item) => (
                  <tr key={item._id}>

                    <td>{item.title}</td>

                    <td>{item.category}</td>

                    <td>{item.location}</td>

                    <td>{item.status}</td>

                    <td>

                      <button
                        className="progress-btn"
                        onClick={() =>
                          updateStatus(
                            item._id,
                            "in-progress"
                          )
                        }
                      >
                        In Progress
                      </button>

                      <button
                        className="resolved-btn"
                        onClick={() =>
                          updateStatus(
                            item._id,
                            "resolved"
                          )
                        }
                      >
                        Resolved
                      </button>

                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>

        </div>

        <div className="activity-box">

          <h2>Recent Updates</h2>

          <ul>
            <li>✔ Citizen complaints received.</li>
            <li>✔ Review pending complaints.</li>
            <li>✔ Update complaint status after action.</li>
          </ul>

        </div>

      </div>

    </div>
  );
}

export default IndustryDashboard;