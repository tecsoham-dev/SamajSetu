import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "https://samajsetu.onrender.com/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    navigate("/login");
  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
};

  return (
    <div className="register-container">

      <div className="register-card">

        <h1>SamajSetu</h1>

        <h2>Create Account</h2>

        <p>Register to connect problems with solutions</p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            spellCheck="false"
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="citizen">Citizen</option>
            <option value="industry">Industry</option>
            <option value="university">University</option>
            
          </select>

          {role === "industry" && (
            <>
              <label>Industry / Organization Name</label>

              <input
                type="text"
                placeholder="Enter organization name"
                required
              />

              <label>Registration Number</label>

              <input
                type="text"
                placeholder="Enter registration number"
                required
              />
            </>
          )}

          {role === "university" && (
            <>
              <label>University Name</label>

              <input
                type="text"
                placeholder="Enter university name"
                required
              />

              <label>Institution ID</label>

              <input
                type="text"
                placeholder="Enter institution ID"
                required
              />
            </>
          )}

          

          <button type="submit">
            Register
          </button>

        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;