import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const Card = ({ icon, title, desc, route }) => (
    <div
      onClick={() => navigate(route)}
      className="cursor-pointer bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:bg-gray-800 hover:scale-105 transition duration-200"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">
          📊 Dashboard
        </h1>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* INVESTMENT */}
        <Card
          icon="💼"
          title="Investment"
          desc="Manage and track your investments"
          route="/investment"
        />

        {/* BUY */}
        <Card
          icon="🟢"
          title="Buy"
          desc="Record your stock purchases"
          route="/buy"
        />

        {/* SALE */}
        <Card
          icon="🔴"
          title="Sale"
          desc="Record your selling transactions"
          route="/sale"
        />

        {/* REPORTS */}
        <Card
          icon="📈"
          title="Reports"
          desc="View profit & performance reports"
          route="/reports"
        />

        {/* PERSONAL EXPENSE */}
        <Card
          icon="💰"
          title="Personal Expense"
          desc="Track your daily expenses"
          route="/expense"
        />

      </div>

    </div>
  );
};

export default Dashboard;