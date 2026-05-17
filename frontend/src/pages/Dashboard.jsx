import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";

const Dashboard = () => {
  const navigate = useNavigate();

  const [loadingRoute, setLoadingRoute] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [balance, setBalance] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);

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
    fetchInvestmentSummary();
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  const fetchInvestmentSummary = async () => {
    try {
      const res = await api.get(`/investment/demo-user`);
      const investmentData = res.data?.data || res.data || [];

      const depositAmount = investmentData.reduce((sum, item) => {
        return item.type === "deposit" ? sum + Number(item.amount || 0) : sum;
      }, 0);

      const withdrawAmount = investmentData.reduce((sum, item) => {
        return item.type === "withdraw" ? sum + Number(item.amount || 0) : sum;
      }, 0);

      setDeposit(depositAmount);
      setWithdraw(withdrawAmount);
      setBalance(depositAmount - withdrawAmount);
    } catch (err) {
      console.log("Summary fetch failed:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

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
        <SummaryPanel
          loading={summaryLoading}
          deposit={deposit}
          withdraw={withdraw}
          balance={balance}
        />
      </div>
    </div>
  );
};

export default Dashboard;
