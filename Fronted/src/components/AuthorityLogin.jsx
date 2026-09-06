import React, { useState } from "react";
import "./AuthorityLogin.css";
import { useNavigate } from "react-router-dom";

function AuthorityLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async(e) => {
    e.preventDefault();

    try {
  const response = await fetch(
    "http://localhost:5000/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role: "authority",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    alert(data.message);
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("currentUser", JSON.stringify(data.user));

  navigate("/authority-dashboard");
} catch (error) {
  console.error(error);
  alert("Server Error");
}
  };

  return (
    <div className="authority-page">
      <div className="authority-card">
        <h2>Authority Login</h2>
        <p>Login to access the Authority Dashboard</p>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter authority email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AuthorityLogin;
