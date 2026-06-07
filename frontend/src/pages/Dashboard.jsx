import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";
import Sidebar from "../components/Sidebar";
import RulesPopup from "../components/RulesPopup";
import { useConfirm } from "../components/ConfirmProvider";
import { calculatePortfolioMetrics } from "../utils/portfolioCalculations";

const Dashboard = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // =========================
  // POPUP STATE
  // =========================
  const [showRulesPopup, setShowRulesPopup] = useState(true);

  // Back-button behavior is handled globally in ProtectedRoute.

  // =========================
  // STATES
  // =========================
  const [loadingRoute, setLoadingRoute] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Portfolio Data
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalDeposit: 0,
    totalWithdraw: 0,
    totalDividend: 0,
    totalBuyCost: 0,
    totalSaleProceeds: 0,
    cashBalance: 0,
    totalRemainingShareValue: 0,
    totalAssets: 0,
    realizedProfit: 0,
    unrealizedProfit: 0,
    totalProfit: 0,
    holdings: {},
    holdingCount: 0,
  });

  const [summaryLoading, setSummaryLoading] = useState(true);

  // =========================
  // FETCH COMPREHENSIVE PORTFOLIO DATA
  // =========================
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setSummaryLoading(true);

      const userId = "demo-user"; // Replace with actual user ID from auth

      // Fetch all transaction data in parallel
      const [investRes, buyRes, saleRes, dividendRes] = await Promise.all([
        api.get(`/investment/${userId}`).catch(() => ({ data: [] })),
        api.get(`/buy/${userId}`).catch(() => ({ data: [] })),
        api.get(`/sale/${userId}`).catch(() => ({ data: [] })),
        api.get(`/dividend/${userId}`).catch(() => ({ data: [] })),
      ]);

      const investmentData = investRes.data?.data || investRes.data || [];
      const buyData = buyRes.data?.data || buyRes.data || [];
      const saleData = saleRes.data?.data || saleRes.data || [];
      const dividendData = dividendRes.data?.data || dividendRes.data || [];

      // Calculate comprehensive portfolio metrics
      const metrics = calculatePortfolioMetrics(
        buyData,
        saleData,
        dividendData,
        investmentData,
      );

      setPortfolioMetrics(metrics);
    } catch (err) {
      console.log("Portfolio data fetch failed:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    const confirmed = await confirm("Are you sure you want to log out?");

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

      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex h-full">
          {/* SIDEBAR */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
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
              deposit={portfolioMetrics.totalDeposit}
              withdraw={portfolioMetrics.totalWithdraw}
              dividend={portfolioMetrics.totalDividend}
              balance={portfolioMetrics.cashBalance}
              profit={portfolioMetrics.totalProfit}
              remainingShareValue={portfolioMetrics.totalRemainingShareValue}
              totalBuyCost={portfolioMetrics.totalBuyCost}
              totalAssets={portfolioMetrics.totalAssets}
              totalBuyQty={portfolioMetrics.totalBuyQty}
              totalSaleQty={portfolioMetrics.totalSaleQty}
              totalSaleValueWithCommission={
                portfolioMetrics.totalSaleValueWithCommission
              }
              totalRemainQty={portfolioMetrics.totalRemainQty}
              tillNowProfitLoss={portfolioMetrics.totalProfit}
              tillNowCurrentAssets={portfolioMetrics.totalAssets}
              realizedProfit={portfolioMetrics.realizedProfit}
              unrealizedProfit={portfolioMetrics.unrealizedProfit}
              holdingCount={portfolioMetrics.holdingCount}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
