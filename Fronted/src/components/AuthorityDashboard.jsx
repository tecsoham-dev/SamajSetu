import "./AuthorityDashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaChartPie,
  FaUniversity,
  FaIndustry,
  FaSignOutAlt,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

function AuthorityDashboard() {

  const [universities, setUniversities] = useState([
    
  ]);

  const [industries, setIndustries] = useState([
    
  ]);

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

    setComplaints(data.complaints);

  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
  };

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/universities",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUniversities(data.universities);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIndustries = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/industries",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIndustries(data.industries);
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchComplaints();
  fetchUniversities();
  fetchIndustries();

}, []);
  const addUniversity = () => {
    const name = prompt("Enter University Name");
    if (name) {
      setUniversities([...universities, name]);
    }
  };

  const deleteUniversity = (index) => {
    setUniversities(
      universities.filter((_, i) => i !== index)
    );
  };
  const assignComplaint = async (id, assignedTo) => {
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
          assignedTo,
          status: "matched",
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

    alert("Complaint assigned successfully!");

  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
};

  const addIndustry = () => {
    const name = prompt("Enter Industry Name");
    if (name) {
      setIndustries([...industries, name]);
    }
  };

  const deleteIndustry = (index) => {
    setIndustries(
      industries.filter((_, i) => i !== index)
    );
  };
  const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("currentUser");
  navigate("/login");
};

  return (
    <div className="authority-dashboard">

      {/* Sidebar */}

      <aside className="sidebar">

        <h2 className="logo">SamajSetu</h2>

        <ul>

          <li className="active">
            <FaChartPie />
            Dashboard
          </li>

          <li>
            <FaUniversity />
            Universities
          </li>

          <li>
            <FaIndustry />
            Industries
          </li>

          <li onClick={handleLogout}>
  <FaSignOutAlt />
  Logout
</li>

        </ul>

      </aside>

      {/* Main */}

      <main className="main-content">

        <h1>Authority Dashboard</h1>

        {/* Cards */}

        <div className="cards">

          <div className="card">
            <h2>{complaints.length}</h2>
            <p>Total Complaints</p>
          </div>

          <div className="card">
            <h2>
              {
                complaints.filter((c) => c.status === "reported").length}
            </h2>
            <p>Pending</p>
          </div>

          <div className="card">
            <h2>
              {
                complaints.filter(
                  (c) => c.status === "resolved"
                ).length
              }
            </h2>
            <p>Resolved</p>
          </div>

        </div>

        {/* Overview */}

        <div className="overview">

          <h2>Overview</h2>

          <div className="chart-box">

            <div className="donut-chart"></div>

            <div className="chart-info">

              <p><span className="blue"></span> New</p>
              <p><span className="green"></span> In Progress</p>
              <p><span className="orange"></span> Resolved</p>
              <p><span className="purple"></span> Closed</p>

            </div>

          </div>

        </div>

        {/* University Section */}

        <div className="management-box">

          <div className="box-header">

            <h2>Universities</h2>

            <button
              className="add-btn"
              onClick={addUniversity}
            >
              <FaPlus />
              Add University
            </button>

          </div>

          <table>

            <thead>

              <tr>
                <th>Name</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {universities.map((uni, index) => (

                <tr key={uni._id}>

                  <td>{uni.name}</td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteUniversity(uni._id)
                      }
                    >
                      <FaTrash />
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

               {/* Industry Section */}

        <div className="management-box">

          <div className="box-header">

            <h2>Industries</h2>

            <button
              className="add-btn"
              onClick={addIndustry}
            >
              <FaPlus />
              Add Industry
            </button>

          </div>

          <table>

            <thead>

              <tr>
                <th>Name</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {industries.map((industry, index) => (

                <tr key={industry._id}>

                  <td>{industry.companyName}</td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() => deleteIndustry(industry._id)}
                    >
                      <FaTrash />
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* Citizen Complaints Section */}

        <div className="management-box">

          <h2>Citizen Complaints</h2>

          <table>

            <thead>

              <tr>
  <th>Problem</th>
  <th>Category</th>
  <th>Location</th>
  <th>Priority</th>
  <th>Status</th>
  <th>Assigned To</th>
  <th>Action</th>
</tr>

            </thead>

            <tbody>

              {complaints.length === 0 ? (

                <tr>
                  <td colSpan="7">
                    No complaints available
                  </td>
                </tr>

              ) : (

                complaints.map((item) => (

                  <tr key={item._id}>

  <td>{item.title}</td>
  <td>{item.category}</td>
  <td>{item.location}</td>
  <td>{item.priority}</td>
  <td>{item.status}</td>

  <td>{item.assignedTo || "Not Assigned"}</td>

  <td>

    <button
      className="assign-btn"
      onClick={() =>
        assignComplaint(item._id, "University")
      }
    >
      University
    </button>

    <button
      className="assign-btn"
      onClick={() =>
        assignComplaint(item._id, "Industry")
      }
    >
      Industry
    </button>

  </td>

</tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}

export default AuthorityDashboard; 