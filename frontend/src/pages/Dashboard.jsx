import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";
import Sidebar from "../components/Sidebar";
import RulesPopup from "../components/RulesPopup";
import { useConfirm } from "../components/ConfirmProvider";
import { calculatePortfolioMetrics } from "../utils/portfolioCalculations";
import { getCurrentUserId } from "../utils/auth";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [lbslReport, setLbslReport] = useState({
    costAmount: null,
    currentAssetsPP: null,
  });
  const [monthlyExpense, setMonthlyExpense] = useState(0);

  // =========================
  // FETCH COMPREHENSIVE PORTFOLIO DATA
  // =========================
  const fetchPortfolioData = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const userId = getCurrentUserId();
      if (!userId) {
        navigate("/login", { replace: true });
        setSummaryLoading(false);
        return;
      }

      // Fetch all transaction data in parallel (including monthly expense)
      const [
        investRes,
        buyRes,
        saleRes,
        dividendRes,
        lbslRes,
        expenseMonthRes,
      ] = await Promise.all([
        api.get(`/investment/${userId}`).catch(() => ({ data: [] })),
        api.get(`/buy/${userId}`).catch(() => ({ data: [] })),
        api.get(`/sale/${userId}`).catch(() => ({ data: [] })),
        api.get(`/dividend/${userId}`).catch(() => ({ data: [] })),
        api.get(`/lbsl/${userId}`).catch(() => ({ data: null })),
        api
          .get(`/expense/monthly/${userId}`)
          .catch(() => ({ data: { total: 0 } })),
      ]);

      const investmentData = investRes.data?.data || investRes.data || [];
      const buyData = buyRes.data?.data || buyRes.data || [];
      const saleData = saleRes.data?.data || saleRes.data || [];
      const dividendData = dividendRes.data?.data || dividendRes.data || [];
      const lbslData = lbslRes.data?.data || null;
      const monthlyTotal =
        expenseMonthRes?.data?.total ?? expenseMonthRes?.data ?? 0;

      setMonthlyExpense(Number(monthlyTotal || 0));

      if (lbslData) {
        setLbslReport({
          costAmount:
            lbslData.costAmount !== undefined && lbslData.costAmount !== null
              ? Number(lbslData.costAmount)
              : null,
          currentAssetsPP:
            lbslData.currentAssetsPP !== undefined &&
            lbslData.currentAssetsPP !== null
              ? Number(lbslData.currentAssetsPP)
              : null,
        });
      }

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
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolioData();
  }, [fetchPortfolioData]);

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

      navigate("/login", { replace: true });
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
    { icon: "📊", title: "Risk/Benefit", route: "/risk-benefit" },
    { icon: "💼", title: "Investment", route: "/investment" },
    { icon: "🟢", title: "Buy", route: "/buy" },
    { icon: "🔴", title: "Sale", route: "/sale" },
    { icon: "💎", title: "Dividend", route: "/Dividend" },
    { icon: "📈", title: "Reports", route: "/reports" },
    { icon: "💰", title: "Expense", route: "/expense" },
    { icon: "📄", title: "LBSL Report", route: "/lbsl-report" },
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
              lbslCostAmount={lbslReport.costAmount}
              lbslCurrentAssetsPP={lbslReport.currentAssetsPP}
              realizedProfit={portfolioMetrics.realizedProfit}
              unrealizedProfit={portfolioMetrics.unrealizedProfit}
              monthlyExpense={monthlyExpense}
              holdingCount={portfolioMetrics.holdingCount}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
