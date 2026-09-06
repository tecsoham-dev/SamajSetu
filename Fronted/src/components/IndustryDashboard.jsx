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
  FaCheckCircle,
} from "react-icons/fa";

function IndustryDashboard() {
    const [complaints, setComplaints] = useState([]);
    useEffect(() => {

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

      if (response.ok) {
        const assigned = data.complaints.filter(
          (item) => item.assignedTo === "Industry"
        );

        setComplaints(assigned);
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchComplaints();
}, []);
  const assignedComplaints = data.filter(
    (item) => item.assignedTo === "Industry"
  );

  setComplaints(assignedComplaints);

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

    alert("Status updated successfully!");

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
    <div className="industry-dashboard">

      {/* Sidebar */}

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

      {/* Main */}

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

        {/* Cards */}

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

        {/* Table */}

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
      <td colSpan="5">No Complaints Found</td>
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
              updateStatus(item._id, "In Progress")
            }
          >
            In Progress
          </button>

          <button
            className="resolved-btn"
            onClick={() =>
              updateStatus(item._id, "Resolved")
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

        {/* Activity */}

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