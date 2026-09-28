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

function AuthorityDashboard() {
  const navigate = useNavigate();

  const [universities, setUniversities] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  /* ================= FILTERS ================= */

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
    useState("All");

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "https://samajsetu.onrender.com/api/complaints",
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

    const fetchUniversities = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "https://samajsetu.onrender.com/api/universities",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setUniversities(data.universities || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchIndustries = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "https://samajsetu.onrender.com/api/industries",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setIndustries(data.industries || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplaints();
    fetchUniversities();
    fetchIndustries();
  }, []);

  /* ================= DASHBOARD COUNTS ================= */

  const totalComplaints = complaints.length;

  const pendingComplaints =
    complaints.filter(
      (item) =>
        item.status === "reported" ||
        item.status === "pending"
    ).length;

  const resolvedComplaints =
    complaints.filter(
      (item) => item.status === "resolved"
    ).length;

  /* ================= FILTERING ================= */

  const filteredComplaints = complaints.filter(
    (item) => {
      const categoryMatch =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const statusMatch =
        statusFilter === "All" ||
        item.status === statusFilter;

      const priorityMatch =
        priorityFilter === "All" ||
        item.priority === priorityFilter;

      return (
        categoryMatch &&
        statusMatch &&
        priorityMatch
      );
    }
  );

  /* ================= MAP CENTER ================= */

  const firstLocatedComplaint =
    filteredComplaints.find(
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

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    navigate("/login");
  };

  /* ================= ASSIGN COMPLAINT ================= */

  const assignComplaint = async (
    id,
    assignedTo
  ) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://samajsetu.onrender.com/api/complaints/${id}`,
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
        alert(
          data.message ||
            "Failed to assign complaint"
        );
        return;
      }

      setComplaints((prev) =>
        prev.map((item) =>
          item._id === id
            ? data.complaint
            : item
        )
      );

      /* Update selected complaint too */
      if (selectedComplaint?._id === id) {
        setSelectedComplaint(data.complaint);
      }

      alert(
        "Complaint assigned successfully!"
      );
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div className="authority-dashboard">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <h2 className="logo">
          SamajSetu
        </h2>

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

      {/* ================= MAIN ================= */}

      <main className="main-content">

        {/* ================= HEADER ================= */}

        <div className="dashboard-header">

          <div>

            <h1>
              Authority Dashboard
            </h1>

            <p>
              Monitor complaints, assign
              stakeholders and track community
              issues.
            </p>

          </div>

          {/* ================= FILTERS ================= */}

          <div className="filters">

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All
              </option>

              <option value="urban-infrastructure">
                Urban Infrastructure
              </option>

              <option value="education">
                Education
              </option>

              <option value="healthcare">
                Healthcare
              </option>

              <option value="agriculture">
                Agriculture
              </option>

              <option value="water">
                Water
              </option>

              <option value="sanitation">
                Sanitation
              </option>

              <option value="environment">
                Environment
              </option>

              <option value="rural-livelihood">
                Rural Livelihood
              </option>

              <option value="accessibility">
                Accessibility
              </option>

              <option value="public-service">
                Public Service
              </option>

            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All
              </option>

              <option value="reported">
                Reported
              </option>

              <option value="matched">
                Matched
              </option>

              <option value="in-progress">
                In Progress
              </option>

              <option value="resolved">
                Resolved
              </option>

            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="critical">
                Critical
              </option>

            </select>

          </div>

        </div>

        {/* ================= CARDS ================= */}

        <div className="cards">

          <div className="card">

            <h2>
              {totalComplaints}
            </h2>

            <p>
              Total Complaints
            </p>

          </div>

          <div className="card">

            <h2>
              {pendingComplaints}
            </h2>

            <p>
              Pending
            </p>

          </div>

          <div className="card">

            <h2>
              {resolvedComplaints}
            </h2>

            <p>
              Resolved
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* COMMUNITY MAP + COMPLAINT DETAILS                 */}
        {/* ================================================= */}

        <div className="authority-grid">

          {/* ================= COMMUNITY MAP ================= */}

          <div className="map-section">

            <h2>
              📍 Community Problem Map
            </h2>

            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{
                height: "430px",
                width: "100%",
                borderRadius: "15px",
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredComplaints.map(
                (item) => {

                  const hasCoordinates =
                    item.latitude !==
                      undefined &&
                    item.longitude !==
                      undefined &&
                    item.latitude !== null &&
                    item.longitude !== null;

                  if (!hasCoordinates) {
                    return null;
                  }

                  return (
                    <Marker
                      key={item._id}
                      position={[
                        item.latitude,
                        item.longitude,
                      ]}
                      eventHandlers={{
                        click: () =>
                          setSelectedComplaint(
                            item
                          ),
                      }}
                    >

                      <Popup>

                        <strong>
                          {item.title}
                        </strong>

                        <br />

                        📍 {item.location}

                        <br />

                        Priority:{" "}
                        {item.priority}

                        <br />

                        Status:{" "}
                        {item.status}

                      </Popup>

                    </Marker>
                  );
                }
              )}

            </MapContainer>

            {/* ================= MAP LEGEND ================= */}

            <div className="map-legend">

              <span className="legend critical">
                ● Critical
              </span>

              <span className="legend high">
                ● High
              </span>

              <span className="legend medium">
                ● Medium
              </span>

              <span className="legend low">
                ● Low
              </span>

              <span className="legend resolved">
                ● Resolved
              </span>

            </div>

          </div>

          {/* ================= DETAILS ================= */}

          <div className="details-section">

            {!selectedComplaint ? (

              <div className="empty-details">

                <h3>
                  Select a Complaint
                </h3>

                <p>
                  Click a marker on the map
                  to view complaint details.
                </p>

              </div>

            ) : (

              <div className="complaint-card">

                {selectedComplaint.imageUrl ? (

                  <img
                    src={
                      selectedComplaint.imageUrl
                    }
                    alt="Complaint"
                    className="complaint-image"
                  />

                ) : (

                  <div className="image-placeholder">
                    No Image
                  </div>

                )}

                <h3>
                  {selectedComplaint.title}
                </h3>

                <p>
                  📍{" "}
                  {selectedComplaint.location}
                </p>

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  {selectedComplaint.category}
                </p>

                <p>
                  <strong>
                    Priority:
                  </strong>{" "}
                  {selectedComplaint.priority}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}

                  <span
                    className={`status ${selectedComplaint.status}`}
                  >
                    {selectedComplaint.status}
                  </span>

                </p>

                <p>
                  <strong>
                    Assigned:
                  </strong>{" "}

                  {selectedComplaint.assignedTo ||
                    "Not Assigned"}
                </p>

                <p>
                  <strong>
                    Date:
                  </strong>{" "}

                  {selectedComplaint.createdAt
                    ? new Date(
                        selectedComplaint.createdAt
                      ).toLocaleDateString()
                    : "N/A"}
                </p>

                <button
                  className="view-btn"
                  onClick={() =>
                    alert(
                      selectedComplaint.description ||
                        "No description available."
                    )
                  }
                >
                  View Complaint →
                </button>

              </div>

            )}

          </div>

        </div>

        {/* ================= UNIVERSITIES ================= */}

        <div className="management-box">

          <div className="box-header">

            <h2>
              🎓 Registered Universities
            </h2>

            <button
              className="add-btn"
              onClick={() => {

                const name = prompt(
                  "Enter University Name"
                );

                if (!name) return;

                setUniversities([
                  ...universities,
                  {
                    _id: Date.now(),
                    name,
                  },
                ]);

              }}
            >

              <FaPlus />

              Add University

            </button>

          </div>

          <table>

            <thead>

              <tr>

                <th>
                  Name
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {universities.length === 0 ? (

                <tr>

                  <td colSpan="2">
                    No Universities Added
                  </td>

                </tr>

              ) : (

                universities.map(
                  (uni) => (

                    <tr key={uni._id}>

                      <td>
                        {uni.name}
                      </td>

                      <td>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            setUniversities(
                              universities.filter(
                                (u) =>
                                  u._id !==
                                  uni._id
                              )
                            )
                          }
                        >

                          <FaTrash />

                          Delete

                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ================= INDUSTRIES ================= */}

        <div className="management-box">

          <div className="box-header">

            <h2>
              🏭 Registered Industries
            </h2>

            <button
              className="add-btn"
              onClick={() => {

                const companyName =
                  prompt(
                    "Enter Industry Name"
                  );

                if (!companyName) return;

                setIndustries([
                  ...industries,
                  {
                    _id: Date.now(),
                    companyName,
                  },
                ]);

              }}
            >

              <FaPlus />

              Add Industry

            </button>

          </div>

          <table>

            <thead>

              <tr>

                <th>
                  Name
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {industries.length === 0 ? (

                <tr>

                  <td colSpan="2">
                    No Industries Added
                  </td>

                </tr>

              ) : (

                industries.map(
                  (industry) => (

                    <tr key={industry._id}>

                      <td>
                        {industry.companyName}
                      </td>

                      <td>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            setIndustries(
                              industries.filter(
                                (i) =>
                                  i._id !==
                                  industry._id
                              )
                            )
                          }
                        >

                          <FaTrash />

                          Delete

                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ================= CITIZEN COMPLAINTS ================= */}

        <div className="management-box">

          <h2>
            👥 Citizen Complaints
          </h2>

          <table>

            <thead>

              <tr>

                <th>
                  Problem
                </th>

                <th>
                  Category
                </th>

                <th>
                  Location
                </th>

                <th>
                  Priority
                </th>

                <th>
                  Status
                </th>

                <th>
                  Assigned To
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredComplaints.length ===
              0 ? (

                <tr>

                  <td colSpan="7">
                    No complaints found.
                  </td>

                </tr>

              ) : (

                filteredComplaints.map(
                  (item) => (

                    <tr key={item._id}>

                      <td>
                        {item.title}
                      </td>

                      <td>
                        {item.category}
                      </td>

                      <td>
                        {item.location}
                      </td>

                      <td>

                        <span
                          className={`priority ${item.priority}`}
                        >
                          {item.priority}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`status ${item.status}`}
                        >
                          {item.status}
                        </span>

                      </td>

                      <td>
                        {item.assignedTo ||
                          "Not Assigned"}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="assign-btn university-btn"
                            onClick={() =>
                              assignComplaint(
                                item._id,
                                "University"
                              )
                            }
                          >
                            University
                          </button>

                          <button
                            className="assign-btn industry-btn"
                            onClick={() =>
                              assignComplaint(
                                item._id,
                                "Industry"
                              )
                            }
                          >
                            Industry
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}

export default AuthorityDashboard;