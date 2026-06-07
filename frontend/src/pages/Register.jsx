import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAlert } from "../components/ConfirmProvider";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);

  const navigate = useNavigate();
  const alert = useAlert();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      await alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      await alert("Account created successfully!");

      navigate("/login", { replace: true });
    } catch (error) {
      await alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Access verification for registration page
  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    if (accessPassword === "11221122") {
      setAccessGranted(true);
      setAccessPassword("");
    } else {
      await alert("❌ Invalid access password");
      setAccessPassword("");
    }
  };

  if (!accessGranted) {
    return (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 -translate-y-18">
        <form
          onSubmit={handleAccessSubmit}
          className="bg-white p-6 rounded-xl shadow-lg w-80 text-center"
        >
          <h2 className="text-lg font-semibold mb-4">🔐 Admin Access</h2>
          <input
            type="password"
            placeholder="Enter Access Password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            className="border p-2 rounded w-full mb-4"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition mb-2"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="bg-gray-500 text-white font-semibold w-full py-2 rounded hover:bg-gray-400 transition"
          >
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl text-white shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">🚀 Register</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          className="w-full mb-4 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          className="w-full mb-4 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          className="w-full mb-6 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* CREATE ACCOUNT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {/* LOGIN Link */}
        <p className="text-sm text-gray-400 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
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

export default Register;
