import "./Dashboard.css"; 
import { useNavigate } from "react-router-dom"; 
import { useState, useEffect } from "react"; 
 
import { 
  FaHome, 
  FaClipboardList, 
  FaBell, 
  FaUser, 
  FaSignOutAlt, 
  FaPlusCircle, 
} from "react-icons/fa"; 
 
function Dashboard() { 
 
  const navigate = useNavigate(); 
 const user = JSON.parse(localStorage.getItem("currentUser"));

  const [complaints, setComplaints] = useState([]); 
 
  useEffect(() => {
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/complaints/my",
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

  fetchComplaints();
}, []);
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  navigate("/login");
};
 
  return ( 
    <div className="dashboard"> 
        {/* Sidebar */} 
 
<div className="sidebar"> 
 
  <h2 className="logo">SamajSetu</h2> 
 
  <ul> 
 
    <li className="active"> 
      <FaHome /> Dashboard 
    </li> 
 
    <li onClick={() => navigate("/report-problem")}> 
      <FaPlusCircle /> Report Problem 
    </li> 
 
    <li onClick={() => navigate("/my-complaints")}> 
      <FaClipboardList /> My Complaints 
    </li> 
 
    <li> 
      <FaBell /> Notifications 
    </li> 
 
    <li onClick={() => navigate("/profile")}> 
      <FaUser /> Profile 
    </li> 
 
    <li onClick={handleLogout}> 
      <FaSignOutAlt /> Logout 
    </li> 
 
  </ul> 
 
</div> 
 
{/* Main Content */} 
 
<div className="main-content"> 
{/* Header */}

<div className="dashboard-header">

  <div>
    <h1>Welcome, {user?.name} 👋</h1>
    <p>Citizen Dashboard</p>
  </div>

  <button
    className="report-btn"
    onClick={() => navigate("/report-problem")}
  >
    Report Problem
  </button>

</div>

  
{/* Cards */}

<div className="cards">

  <div className="card">
    <h2>{complaints.length}</h2>
    <p>Total Reports</p>
  </div>

  <div className="card">
    <h2>
      {
        complaints.filter(
  (item) => item.status === "reported"
).length
      }
    </h2>
    <p>Reported</p>
  </div>

  <div className="card">
    <h2>
      {
        complaints.filter(
          (item) => item.status === "in-progress"
        ).length
      }
    </h2>
    <p>In Progress</p>
  </div>

  <div className="card">
    <h2>
      {
        complaints.filter(
  (item) => item.status === "resolved"
).length
      }
    </h2>
    <p>Resolved</p>
  </div>

</div>  
{/* Recent Complaints */}

<div className="table-section">

  <h2>Recent Complaints</h2>

  <table>

    <thead>

      <tr>
        <th>Problem</th>
        <th>Category</th>
        <th>Location</th>
        <th>Priority</th>
        <th>Status</th>
        
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

            <td>{item.priority}</td>

            <td>{item.status}</td>

            

          </tr>

        ))

      )}

    </tbody>

  </table>

</div>  
{/* Notifications */}

<div className="notification-box">

  <h2>Notifications</h2>

  <ul>

    <li>✔ Your complaint has been submitted successfully.</li>

    <li>✔ Authority will review your complaint.</li>

    <li>✔ You will receive updates after assignment.</li>

  </ul>

</div>

</div>   

</div>  

  );
}

export default Dashboard;