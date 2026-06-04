import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";
import Sidebar from "../components/Sidebar";
import RulesPopup from "../components/RulesPopup";

const Dashboard = () => {
  const navigate = useNavigate();

  // =========================
  // POPUP STATE
  // =========================
  const [showRulesPopup, setShowRulesPopup] = useState(true);

  // =========================
  // BACK BUTTON LOGOUT
  // =========================
  useEffect(() => {
    window.history.pushState({ dashboard: true }, "", window.location.href);

    const handlePopState = () => {
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

  // =========================
  // STATES
  // =========================
  const [loadingRoute, setLoadingRoute] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [balance, setBalance] = useState(0);

  const [summaryLoading, setSummaryLoading] = useState(true);

  // =========================
  // FETCH SUMMARY
  // =========================
  useEffect(() => {
    fetchInvestmentSummary();
  }, []);

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

  // =========================
  // LOGOUT
  // =========================
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

  // =========================
  // NAVIGATION
  // =========================
  const handleNavigate = (route) => {
    setLoadingRoute(route);

    setTimeout(() => {
      navigate(route);
      setLoadingRoute("");
    }, 300);
  };

  const menuItems = [
    { icon: "🟡", title: "Buy / Selling Zone", route: "/zone" },
    { icon: "💼", title: "Investment", route: "/investment" },
    { icon: "🟢", title: "Buy", route: "/buy" },
    { icon: "🔴", title: "Sale", route: "/sale" },
    { icon: "💎", title: "Dividend", route: "/Dividend" },
    { icon: "📈", title: "Reports", route: "/reports" },
    { icon: "💰", title: "Expense", route: "/expense" },
  ];

  return (
    <>
      {/* ========================= */}
      {/* RULES POPUP */}
      {/* ========================= */}

      {showRulesPopup && (
        <RulesPopup onClose={() => setShowRulesPopup(false)} />
      )}

      {/* ========================= */}
      {/* MAIN DASHBOARD */}
      {/* ========================= */}

      <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
        {/* SIDEBAR */}
        <Sidebar
          menuItems={menuItems}
          logout={logout}
          logoutLoading={logoutLoading}
          loadingRoute={loadingRoute}
          handleNavigate={handleNavigate}
        />

        {/* RIGHT SIDE */}
        <div className="flex-1 p-4 md:p-8">
          <SummaryPanel
            loading={summaryLoading}
            deposit={deposit}
            withdraw={withdraw}
            balance={balance}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
