import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 to-black flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md -mt-50 bg-gray-900 border border-gray-800 p-8 rounded-2xl text-white shadow-2xl"
      >
        {/* TITLE */}
        <h2 className="text-3xl font-bold mb-6 text-center">🔐 Login</h2>

        {/* ERROR */}
        {error && (
          <p className="bg-red-600/20 border border-red-500 text-red-400 text-sm p-2 rounded mb-4 text-center">
            {error}
          </p>
        )}

        {/* SUCCESS */}
        {success && (
          <p className="bg-green-600/20 border border-green-500 text-green-400 text-sm p-2 rounded mb-4 text-center">
            {success}
          </p>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          className="w-full mb-4 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="w-full mb-6 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/80 border-r-transparent rounded-full animate-spin" />
          )}
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* REGISTER LINK */}
        <p className="text-sm text-gray-400 mt-5 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </p>

        {/* BACK HOME BUTTON */}
        <button
          type="button"
          onClick={() => {
            setBackLoading(true);
            setTimeout(() => navigate("/"), 300);
          }}
          disabled={backLoading}
          className="w-full mt-4 border border-gray-600 hover:bg-gray-800 py-3 rounded-lg font-semibold transition disabled:opacity-60"
        >
          {backLoading ? "Loading..." : "Back to Home"}
        </button>
      </form>
    </div>
  );
};

export default Login;
