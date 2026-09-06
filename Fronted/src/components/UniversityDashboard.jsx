import "./UniversityDashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaUniversity,
  FaUsers,
  FaProjectDiagram,
  FaClipboardList,
  FaSignOutAlt,
  FaBook,
  FaCheckCircle,
} from "react-icons/fa";

function UniversityDashboard() {
    const [complaints, setComplaints] = useState([]);

useEffect(() => {
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/complaints",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      const assignedComplaints = data.complaints.filter(
        (item) => item.assignedTo === "University"
      );

      setComplaints(assignedComplaints);

    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  fetchComplaints();
}, []);
const updateStatus = async (id, newStatus) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/complaints/${id}`,
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
      alert(data.message);
      return;
    }

    setComplaints((prev) =>
      prev.map((item) =>
        item._id === id ? data.complaint : item
      )
    );

  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
};
const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("currentUser");
  navigate("/login");
};
  return (
    <div className="university-dashboard">

      {/* Sidebar */}
      <div className="sidebar">

        <h2 className="logo">SamajSetu</h2>

        <ul>
          <li className="active">
            <FaUniversity /> Dashboard
          </li>

          <li>
            <FaClipboardList /> Challenges
          </li>

          <li>
            <FaUsers /> Student Teams
          </li>

          <li>
            <FaProjectDiagram /> Projects
          </li>

          <li>
            <FaBook /> Research
          </li>

          <li onClick={handleLogout}>
  <FaSignOutAlt /> Logout
</li>
        </ul>

      </div>

      {/* Main */}

      <div className="main-content">

        <div className="dashboard-header">

          <div>
            <h1>Welcome 👋</h1>
            <p>University Dashboard</p>
          </div>

          <button className="assign-btn">
            + Create Team
          </button>

        </div>

        {/* Cards */}

        <div className="cards">

          <div className="card">
            <h2>{complaints.length}</h2>
            <p>Challenges Assigned</p>
          </div>

          <div className="card">
            <h2>10</h2>
            <p>Student Teams</p>
          </div>

          <div className="card">
            <h2>7</h2>
            <p>Projects Running</p>
          </div>

          <div className="card">
            <h2>5</h2>
            <p>Completed</p>
          </div>

        </div>

        {/* Table */}

        <div className="table-section">

          <h2>Assigned Challenges</h2>

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
        No Assigned Complaints
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
    onClick={() => updateStatus(item._id, "in-progress")}
  >
    In Progress
  </button>

  <button
    className="resolved-btn"
    onClick={() => updateStatus(item._id, "resolved")}
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

        {/* Team Activity */}

        <div className="activity-box">

          <h2>Recent Activities</h2>

          <ul>

            <li>✔ New citizen complaint received.</li>

            <li>✔ Faculty review pending.</li>

            <li>✔ Submit project solution to authority.</li>

        </ul>

        </div>

      </div>

    </div>
  );
}

export default UniversityDashboard;