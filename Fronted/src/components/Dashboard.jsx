import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import {
  FaHome,
  FaClipboardList,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaPlusCircle,
} from "react-icons/fa";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "https://samajsetu.onrender.com/api/complaints/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Failed to fetch complaints"
          );
          return;
        }

        setComplaints(data.complaints || []);
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

  const totalReports = complaints.length;

  const reportedCount = complaints.filter(
    (item) => item.status === "reported"
  ).length;

  const progressCount = complaints.filter(
    (item) => item.status === "in-progress"
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === "resolved"
  ).length;

  // Find the first complaint that actually has coordinates
  const firstLocatedComplaint = complaints.find(
    (item) =>
      item.latitude !== undefined &&
      item.longitude !== undefined &&
      item.latitude !== null &&
      item.longitude !== null
  );

  const mapCenter = firstLocatedComplaint
    ? [
        firstLocatedComplaint.latitude,
        firstLocatedComplaint.longitude,
      ]
    : [22.5726, 88.3639];

  return (
    <div className="dashboard">

      {/* ================= SIDEBAR ================= */}

      <div className="sidebar">

        <h2 className="logo">SamajSetu</h2>

        <ul>

          <li className="active">
            <FaHome />
            Dashboard
          </li>

          <li
            onClick={() =>
              navigate("/report-problem")
            }
          >
            <FaPlusCircle />
            Report Problem
          </li>

          <li
            onClick={() =>
              navigate("/my-complaints")
            }
          >
            <FaClipboardList />
            My Complaints
          </li>

          <li>
            <FaBell />
            Notifications
          </li>

          <li
            onClick={() =>
              navigate("/profile")
            }
          >
            <FaUser />
            Profile
          </li>

          <li onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </li>

        </ul>

      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* HEADER */}

        <div className="dashboard-header">

          <div>

            <h1>
              Welcome, {user?.name} 👋
            </h1>

            <p>
              Citizen Dashboard
            </p>

          </div>

          <button
            className="report-btn"
            onClick={() =>
              navigate("/report-problem")
            }
          >
            Report Problem
          </button>

        </div>

        {/* ================= STATS ================= */}

        <div className="cards">

          <div className="card">

            <h2>{totalReports}</h2>

            <p>Total Reports</p>

          </div>

          <div className="card">

            <h2>{reportedCount}</h2>

            <p>Reported</p>

          </div>

          <div className="card">

            <h2>{progressCount}</h2>

            <p>In Progress</p>

          </div>

          <div className="card">

            <h2>{resolvedCount}</h2>

            <p>Resolved</p>

          </div>

        </div>

        {/* ================= CONTENT ================= */}

        <div className="dashboard-grid">

          {/* LEFT */}

          <div className="table-section">

            <h2>
              Recent Complaints
            </h2>

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

                      <td>{item.priority}</td>

                      <td>

                        <span
                          className={`status ${item.status}`}
                        >
                          {item.status}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* ================= RIGHT SIDE ================= */}

          <div className="map-section">

            <h2>My Reported Problems</h2>

            <MapContainer
              center={mapCenter}
              zoom={12}
              ref={mapRef}
              style={{
                height: "380px",
                width: "100%",
                borderRadius: "15px",
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {complaints.map((item) =>
                item.latitude !== undefined &&
                item.longitude !== undefined &&
                item.latitude !== null &&
                item.longitude !== null ? (

                  <Marker
                    key={item._id}
                    position={[
                      item.latitude,
                      item.longitude,
                    ]}
                    eventHandlers={{
                      click: () =>
                        setSelectedComplaint(item),
                    }}
                  >

                    <Popup>

                      <strong>
                        {item.title}
                      </strong>

                      <br />

                      {item.location}

                      <br />

                      Status: {item.status}

                    </Popup>

                  </Marker>

                ) : null
              )}

            </MapContainer>

            {selectedComplaint ? (

              <div className="selected-card">

                <h3>
                  📍 Complaint Details
                </h3>

                <p>
                  <strong>Problem:</strong>
                  {selectedComplaint.title}
                </p>

                <p>
                  <strong>Category:</strong>
                  {selectedComplaint.category}
                </p>

                <p>
                  <strong>Location:</strong>
                  {selectedComplaint.location}
                </p>

                <p>
                  <strong>Priority:</strong>
                  {selectedComplaint.priority}
                </p>

                <p>

                  <strong>Status:</strong>

                  <span
                    className={`status ${selectedComplaint.status}`}
                  >
                    {selectedComplaint.status}
                  </span>

                </p>

                <p>
                  <strong>Description:</strong>
                  {selectedComplaint.description}
                </p>

              </div>

            ) : (

              <div className="selected-card empty-card">

                <h3>Select a Marker</h3>

                <p>
                  Click any marker on the map to
                  view complete complaint details.
                </p>

              </div>

            )}

          </div>

        </div>

        {/* ================= NOTIFICATIONS ================= */}

        <div className="notification-box">

          <h2>Notifications</h2>

          <ul>

            <li>
              ✅ Complaint submitted successfully.
            </li>

            <li>
              🔄 Your authority will review your complaint.
            </li>

            <li>
              📢 Status updates will appear here.
            </li>

            <li>
              🎯 Track your complaints live on the map.
            </li>

          </ul>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;