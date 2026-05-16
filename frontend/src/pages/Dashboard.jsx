import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [loadingRoute, setLoadingRoute] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Force the browser back button to trigger logout confirmation on Dashboard.
    window.history.pushState({ dashboard: true }, "", window.location.href);
    window.history.pushState({ dashboard: true }, "", window.location.href);

    const handlePopState = (event) => {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } else {
        window.history.pushState({ dashboard: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  const logout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    try {
      setLogoutLoading(true);

      localStorage.removeItem("auth");
      localStorage.removeItem("token");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 500);
    } catch (err) {
      console.log(err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleNavigate = (route) => {
    setLoadingRoute(route);

    setTimeout(() => {
      navigate(route);
      setLoadingRoute("");
    }, 300);
  };

  const Card = ({ icon, title, route }) => (
    <div
      onClick={() => handleNavigate(route)}
      className="
        cursor-pointer
        flex items-center gap-3
        bg-gray-900
        border border-gray-800
        rounded-xl
        p-3
        hover:bg-gray-800
        transition
        relative
      "
    >
      <div className="text-xl">{icon}</div>

      <div className="text-sm font-semibold">
        {loadingRoute === route ? "Loading..." : title}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 p-3 space-y-2">
        <h1 className="text-xl font-bold mb-3">📊 Dashboard</h1>

        <Card icon="🟡" title="Buy / Selling Zone" route="/zone" />
        <Card icon="💼" title="Investment" route="/investment" />
        <Card icon="🟢" title="Buy" route="/buy" />
        <Card icon="🔴" title="Sale" route="/sale" />
        <Card icon="📈" title="Reports" route="/reports" />
        <Card icon="💰" title="Expense" route="/expense" />

        <button
          onClick={logout}
          disabled={logoutLoading}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 p-2 rounded-lg text-sm disabled:opacity-60"
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </button>
      </div>

      {/* RIGHT SUMMARY AREA */}
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">📌 Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <h3 className="text-sm text-gray-400">Total Investment</h3>
            <p className="text-xl font-bold">--</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <h3 className="text-sm text-gray-400">Total Profit</h3>
            <p className="text-xl font-bold text-green-400">--</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <h3 className="text-sm text-gray-400">Total Expense</h3>
            <p className="text-xl font-bold text-red-400">--</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
