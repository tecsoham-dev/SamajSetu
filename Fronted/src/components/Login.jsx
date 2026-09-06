import "./Login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaUniversity,
  FaIndustry,
  FaLandmark,
  FaArrowRight,
} from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();

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
        role,
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

  const user = data.user;

  switch (user.role.toLowerCase()) {
    case "citizen":
      navigate("/dashboard");
      break;

    case "university":
      navigate("/university-dashboard");
      break;

    case "industry":
      navigate("/industry-dashboard");
      break;

    case "authority":
      navigate("/authority-dashboard");
      break;

    default:
      alert("Invalid Role");
  }
};

  return (
    <div className="login-page">
      <div className="login-box">

        <h1>Login to your account</h1>

        <p className="login-subtitle">
          Choose your role and login to continue
        </p>

        <h3 className="role-title">Select your role</h3>

        <div className="role-container">

          <div
            className={`role-card ${role === "citizen" ? "active" : ""}`}
            onClick={() => setRole("citizen")}
          >
            <FaUser className="role-icon citizen" />
            <p>Citizen</p>
          </div>

          <div
            className={`role-card ${role === "university" ? "active" : ""}`}
            onClick={() => setRole("university")}
          >
            <FaUniversity className="role-icon university" />
            <p>University</p>
          </div>

          <div
            className={`role-card ${role === "industry" ? "active" : ""}`}
            onClick={() => setRole("industry")}
          >
            <FaIndustry className="role-icon industry" />
            <p>Industry</p>
          </div>

          <div
            className={`role-card ${role === "authority" ? "active" : ""}`}
            onClick={() => setRole("authority")}
          >
            <FaLandmark className="role-icon authority" />
            <p>Authority</p>
          </div>

        </div>

        <form onSubmit={handleLogin}>

          <label>Email / Phone / Username</label>

          <input
            type="text"
            placeholder="Enter your email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot">
            <a href="/">Forgot Password?</a>
          </div>

          <button type="submit" className="login-btn">
            Login <FaArrowRight />
          </button>

        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register" className="register-link">
            Register Here
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;