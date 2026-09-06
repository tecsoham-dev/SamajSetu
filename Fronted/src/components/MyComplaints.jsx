import "./MyComplaints.css";
import { useEffect, useState } from "react";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);

 useEffect(() => {
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/complaints/my",
        {
          headers: {
            "Content-Type": "application/json",
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

  return (
    <div className="complaints-container">

      <h1>My Complaints</h1>

      {complaints.length === 0 ? (

        <p className="empty">
          No complaints submitted yet.
        </p>

      ) : (

        <table>

          <thead>

            <tr>
              <th>Problem</th>
              <th>Category</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
            </tr>

          </thead>

          <tbody>

            {complaints.map((item) => (

              <tr key={item._id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.location}</td>
                <td>{item.severity}</td>
                <td>{item.status}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>
  );
}

export default MyComplaints;