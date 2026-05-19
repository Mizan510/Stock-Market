import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";

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

  // =========================
  // CARD COMPONENT
  // =========================
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
      "
    >
      <div className="text-xl">{icon}</div>

      <div className="text-sm font-semibold">
        {loadingRoute === route ? "Loading..." : title}
      </div>
    </div>
  );

  return (
    <>
      {/* ========================= */}
      {/* RULES POPUP */}
      {/* ========================= */}

      {showRulesPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="
        w-full
        max-w-4xl
        max-h-[95vh]
        bg-white
        rounded-3xl
        shadow-2xl
        overflow-hidden
        flex
        flex-col
      "
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white tracking-wide">
                Important Trading Rules
              </h2>

              {/* MOTIVATION BOX */}
              <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl py-3 px-4 backdrop-blur-md">
                <h3
                  className="text-yellow-300 [text-shadow:1px_1px_0_black,-1px_-1px_0_black,1px_-1px_0_black,-1px_1px_0_black] text-2xl font-bold"
                  align="center"
                >
                  No Emotion, Only Patience
                </h3>

                <div className="w-16 sm:w-24 h-1 bg-red-400 mx-auto mt-2 rounded-full"></div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gray-100">
              {/* RULE 1 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-4">
                  Rule No 1: Choose Best Company
                </h3>

                <ul className="list-disc ml-5 space-y-2 text-sm sm:text-base text-gray-700">
                  <li>Choose Halal Company</li>
                  <li>Established Company</li>
                  <li>Well Known Company</li>
                </ul>
              </div>

              {/* RULE 2 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-4">
                  Rule No 2: Set Buying & Selling Zone
                </h3>

                <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
                  <li>
                    For Buying Zone: Set 20% of Lowest Share Price of Last 1
                    Year of Selected Company.
                  </li>

                  <li>
                    For Selling Zone: Set 70% of Highest Share Price of Last 1
                    Year of Selected Company.
                  </li>
                </ul>
              </div>

              {/* RULE 3 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-5">
                  Rule No 3: Dominant Check Before Buy & Sale
                </h3>

                <div className="space-y-6">
                  {/* BUYING */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="font-bold text-green-700 mb-3 text-sm sm:text-base">
                      Buying Zone Check
                    </p>

                    <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
                      <li>
                        If Seller Dominates → Wait for Buy —
                        <span className="text-red-600 font-medium">
                          {" "}
                          কারণ দাম আরো কমতে পারে।
                        </span>
                      </li>

                      <li>
                        If Buyer Dominates or Equal → Buy Immediately —
                        <span className="text-green-700 font-medium">
                          {" "}
                          কারণ দাম দ্রুত বাড়তে পারে।
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* SELLING */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-bold text-red-700 mb-3 text-sm sm:text-base">
                      Selling Zone Check
                    </p>

                    <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
                      <li>
                        If Buyer Dominates → Wait for Sale —
                        <span className="text-green-700 font-medium">
                          {" "}
                          কারণ দাম আরো বাড়তে পারে।
                        </span>
                      </li>

                      <li>
                        If Seller Dominates or Equal → Sell Immediately —
                        <span className="text-red-600 font-medium">
                          {" "}
                          কারণ দাম দ্রুত কমতে পারে।
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* CASH MAP */}
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-4 text-center shadow-md">
                    <p className="text-base sm:text-lg font-bold tracking-wide">
                      Or Check Cash Map %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-gray-200 p-4 flex justify-center">
              <button
                onClick={() => setShowRulesPopup(false)}
                className="
            w-full
            sm:w-auto
            bg-blue-600
            hover:bg-blue-700
            active:scale-95
            text-white
            font-bold
            px-8
            py-3
            rounded-2xl
            transition-all
            duration-200
            shadow-lg
          "
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* MAIN DASHBOARD */}
      {/* ========================= */}

      <div className="min-h-screen bg-gray-950 text-white flex">
        {/* SIDEBAR */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 p-3 space-y-2">
          <h1 className="text-xl font-bold mb-3">📊 Dashboard</h1>

          <Card icon="🟡" title="Buy / Selling Zone" route="/zone" />

          <Card icon="💼" title="Investment" route="/investment" />

          <Card icon="🟢" title="Buy" route="/buy" />

          <Card icon="🔴" title="Sale" route="/sale" />

          <Card icon="💎" title="Dividend" route="/Dividend" />

          <Card icon="📈" title="Reports" route="/reports" />

          <Card icon="💰" title="Expense" route="/expense" />

          <button
            onClick={logout}
            disabled={logoutLoading}
            className="
              w-full
              mt-4
              bg-red-600
              hover:bg-red-700
              p-2
              rounded-lg
              text-sm
              disabled:opacity-60
            "
          >
            {logoutLoading ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 p-8">
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
