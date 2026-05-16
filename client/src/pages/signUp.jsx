// components/signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";
import { useAuth } from "../context/authContext"; // Import the hook, not the provider
import { useNotification } from "../context/notificationContext";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ CORRECT - using the custom hook
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
        showNotification(
          `Welcome to Flavour Forge, ${data.user.name}!`,
          "success",
        );
        navigate("/");
      } else {
        setError(data.error || "Registration failed. Please try again.");
        showNotification(data.error || "Registration failed", "error");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Unable to connect. Please try again.");
      showNotification("Unable to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <header className="auth-header">
        <Link to="/" className="auth-header-title">
          <h1>Flavour Forge</h1>
        </Link>
        <p className="auth-header-sub">Get recipes within seconds</p>
      </header>

      <main className="sign-forms">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-inner">
            <h2>Create Account</h2>
            <p>Join Flavour Forge to start cooking</p>

            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              pattern="^[a-zA-Z0-9_\-]{1,20}$"
              title="Username must be 1–20 characters and can only include letters, numbers, underscores (_), or hyphens (-)."
              required
              disabled={loading}
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <button type="submit" disabled={loading} className="sign-up">
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="auth-redirect">
              Already have an account?{" "}
              <Link to="/login" className="login-text">
                Log in here
              </Link>
            </p>

            {error && <p className="error">{error}</p>}
          </div>
        </form>
      </main>
    </div>
  );
}

export default Signup;
