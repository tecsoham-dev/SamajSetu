import "./ReportProblem.css";
import { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Auto move map
function ChangeMapView({ center }) {
  const map = useMap();

  map.setView(center, 15);

  return null;
}

// Marker component
function LocationMarker({
  position,
  setPosition,
  setLatitude,
  setLongitude,
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();

          setPosition([pos.lat, pos.lng]);
          setLatitude(pos.lat);
          setLongitude(pos.lng);
        },
      }}
    >
      <Popup>Problem Location</Popup>
    </Marker>
  );
}

function ReportProblem() {
  // Complaint Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("urban-infrastructure");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [image, setImage] = useState(null);

  // AI
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Map
  const [position, setPosition] = useState([
    22.5726,
    88.3639,
  ]);

  const [latitude, setLatitude] = useState(22.5726);
  const [longitude, setLongitude] = useState(88.3639);

  const [search, setSearch] = useState("");

  const mapRef = useRef(null);

  // Current Location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setPosition([lat, lng]);

        // Set readable location so form validation passes
        setLocation(
          `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        );

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16);
        }
      },
      () => {
        alert("Unable to fetch your location.");
      }
    );
  };

  // Search Location
  const searchLocation = async () => {
    if (!search.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );

      const data = await response.json();

      if (data.length === 0) {
        alert("Location not found.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      setLatitude(lat);
      setLongitude(lng);

      setPosition([lat, lng]);

      setLocation(data[0].display_name);

      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15);
      }
    } catch (err) {
      console.error(err);
      alert("Unable to search location.");
    }
  };

  // Submit Complaint
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter the problem title.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter the description.");
      return;
    }

    if (!location.trim()) {
      alert("Please select a location.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const complaintResponse = await fetch(
        "https://samajsetu.onrender.com/api/complaints",
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
            latitude,
            longitude,
            priority,
          }),
        }
      );

      const complaintData = await complaintResponse.json();

      if (!complaintResponse.ok) {
        alert(
          complaintData.message || "Failed to submit complaint."
        );
        return;
      }

      const complaintId = complaintData.complaint._id;

      // Run AI Pipeline
      const aiResponse = await fetch(
        `https://samajsetu.onrender.com/api/ai/pipeline/${complaintId}`,
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

      setAnalysis(aiData.pipeline);

      alert("Problem submitted successfully!");

      // Reset Form
      setTitle("");
      setDescription("");
      setCategory("urban-infrastructure");
      setLocation("");
      setPriority("medium");
      setImage(null);

      setLatitude(22.5726);
      setLongitude(88.3639);

      setPosition([22.5726, 88.3639]);

      setSearch("");

      e.target.reset();
    } catch (error) {
      console.error("Report problem error:", error);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-card">

        {/* LEFT SIDE */}
        <div className="report-left">

          <h1>Report a Problem</h1>

          <p className="subtitle">
            Help your community by reporting an issue.
          </p>

          {/* Search */}
          <div className="location-search">

            <input
              type="text"
              placeholder="Search location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="search-btn"
              onClick={searchLocation}
            >
              Search
            </button>

          </div>

          {/* Current Location */}
          <button
            type="button"
            className="location-btn"
            onClick={useCurrentLocation}
          >
            📍 Use My Current Location
          </button>

          {/* MAP */}
          <div className="map-box">

            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom={true}
              ref={mapRef}
              style={{
                height: "320px",
                width: "100%",
                borderRadius: "15px",
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ChangeMapView center={position} />

              <LocationMarker
                position={position}
                setPosition={setPosition}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
              />

            </MapContainer>

          </div>

          <div className="coordinates">

            <p>
              <strong>Latitude:</strong>{" "}
              {latitude.toFixed(6)}
            </p>

            <p>
              <strong>Longitude:</strong>{" "}
              {longitude.toFixed(6)}
            </p>

          </div>

          {/* FORM */}
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
              placeholder="Describe your problem..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              required
            />

            <label>Category</label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
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

            <label>Severity</label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <label>Location</label>

            <input
              type="text"
              value={location}
              placeholder="Selected location"
              onChange={(e) =>
                setLocation(e.target.value)
              }
            />

            <label>Upload Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files[0])
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading
                ? "Running AI Analysis..."
                : "Submit & Run AI"}
            </button>

          </form>

        </div>

        {/* RIGHT SIDE */}
        <div className="report-right">

          <h2>AI Analysis</h2>

          {!analysis ? (

            <div className="analysis-placeholder">

              <h3>🤖 SamajSetu AI</h3>

              <p>
                Submit a complaint to receive
                AI-powered analysis, duplicate
                detection, authority routing,
                university matching and industry
                recommendations.
              </p>

            </div>

          ) : (

            <div className="analysis-content">

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
                  "Not Determined"}
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
                  ? `${analysis.authorityRouting.slaTarget.resolutionTargetHours} Hours`
                  : "Not Determined"}
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
                <p>No University Match Found.</p>
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
                    ) || "General Support"}
                  </p>
                </>
              ) : (
                <p>No Industry Match Found.</p>
              )}

              <hr />

              <h3>Challenge</h3>

              <p>
                <strong>Status:</strong>{" "}
                {analysis.challenge?.status ||
                  "Open for Matching"}
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