import React from "react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📈 Reports</h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-700 px-4 py-2 rounded-lg"
        >
          Back
        </button>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p className="text-gray-400">
          Analytics and profit reports coming soon...
        </p>
      </div>

    </div>
  );
};

export default Reports;