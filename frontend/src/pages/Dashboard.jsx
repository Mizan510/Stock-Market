import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SummaryPanel from "../components/SummaryPanel";
import Sidebar from "../components/Sidebar";
import RulesPopup from "../components/RulesPopup";
import BuySalePopup from "../components/BuySalePopup"; 
import { useConfirm } from "../components/ConfirmProvider";
import { calculatePortfolioMetrics } from "../utils/portfolioCalculations";
import { getCurrentUserId } from "../utils/auth";

const Dashboard = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // =========================
  // POPUP & PENDING NAVIGATION STATE
  // =========================
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(""); 

  // =========================
  // NEW STATES FOR LOGIN MARKET POPUP
  // =========================
  const [isMarketPopupOpen, setIsMarketPopupOpen] = useState(false);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [greenBuyCompanies, setGreenBuyCompanies] = useState([]);
  const [greenSaleCompanies, setGreenSaleCompanies] = useState([]);

  // =========================
  // RAW DATA LISTS FOR EXACT CALCULATION
  // =========================
  const [rawBuyList, setRawBuyList] = useState([]);
  const [rawSaleList, setRawSaleList] = useState([]);

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
  // HIGH ACCURACY PROFIT CALCULATION ENGINE
  // =========================
  const accurateReportProfit = useMemo(() => {
    const groups = {};

    // 1. Group Buy Transactions
    rawBuyList.forEach((item) => {
      const stockName = item.stockName || "Unknown";
      if (!groups[stockName]) {
        groups[stockName] = { buyQty: 0, buyNet: 0, saleQty: 0, saleNet: 0 };
      }
      const qty = Number(item.buyQuantity ?? item.quantity ?? 0);
      const price = Number(item.perShareValue ?? item.price ?? 0);
      const totalValue = Number(item.buyingTotalShareValue ?? item.total ?? (qty * price));
      const commission = Number(item.commission !== undefined ? item.commission : totalValue * 0.004);

      groups[stockName].buyQty += qty;
      groups[stockName].buyNet += (totalValue + commission);
    });

    // 2. Group Sale Transactions
    rawSaleList.forEach((item) => {
      const stockName = item.stockName || "Unknown";
      if (!groups[stockName]) {
        groups[stockName] = { buyQty: 0, buyNet: 0, saleQty: 0, saleNet: 0 };
      }
      const qty = Number(item.saleQuantity ?? item.quantity ?? 0);
      const price = Number(item.perShareValue ?? item.price ?? 0);
      const totalValue = Number(item.sallingTotalShareValue ?? item.total ?? (qty * price));
      const commission = Number(item.commission !== undefined ? item.commission : totalValue * 0.004);

      groups[stockName].saleQty += qty;
      groups[stockName].saleNet += (totalValue - commission);
    });

    // 3. Aggregate precise Corporate Net spreads
    let grandTotalProfit = 0;
    Object.values(groups).forEach((company) => {
      if (company.saleQty > 0) {
        const buyEffective = company.buyQty ? company.buyNet / company.buyQty : 0;
        const sellEffective = company.saleNet / company.saleQty;
        const exactRowProfit = company.saleQty * (sellEffective - buyEffective);
        grandTotalProfit += exactRowProfit;
      }
    });

    return grandTotalProfit;
  }, [rawBuyList, rawSaleList]);

  // =========================
  // FETCH MARKET POPUP DATA
  // =========================
  const fetchMarketPopupData = useCallback(async () => {
    try {
      setMarketDataLoading(true);
      const [buyZoneRes, saleZoneRes] = await Promise.all([
        api.get("/buy-zone").catch(() => ({ data: [] })),
        api.get("/sale-zone").catch(() => ({ data: [] }))
      ]);

      const buyZoneData = buyZoneRes?.data?.data ?? buyZoneRes?.data ?? [];
      const saleZoneData = saleZoneRes?.data?.data ?? saleZoneRes?.data ?? [];

      const filteredBuy = buyZoneData.filter(item => item.color === "green" || item.status === "green" || item.isGreen);
      const filteredSale = saleZoneData.filter(item => item.color === "green" || item.status === "green" || item.isGreen);

      setGreenBuyCompanies(filteredBuy);
      setGreenSaleCompanies(filteredSale);
    } catch (err) {
      console.error("Failed to fetch market zone popup data:", err);
    } finally { // FIXED: Changed from 'file' to 'finally'
      setMarketDataLoading(false);
    }
  }, []);

  // =========================
  // CHECK LOGIN TRIGGER
  // =========================
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (justLoggedIn === "true") {
      setIsMarketPopupOpen(true);
      sessionStorage.removeItem("justLoggedIn");
      fetchMarketPopupData();
    }
  }, [fetchMarketPopupData]);

  // =========================
  // FETCH COMPREHENSIVE PORTFOLIO DATA
  // =========================
  const fetchPortfolioData = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        navigate("/login", { replace: true });
        return;
      }

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
        api.get(`/expense/monthly/${userId}`).catch(() => ({ data: { total: 0 } })),
      ]);

      const investmentData = investRes?.data?.data ?? investRes?.data ?? [];
      const buyData = buyRes?.data?.data ?? buyRes?.data ?? [];
      const saleData = saleRes?.data?.data ?? saleRes?.data ?? [];
      const dividendData = dividendRes?.data?.data ?? dividendRes?.data ?? [];
      const lbslData = lbslRes?.data?.data ?? lbslRes?.data ?? null;
      const monthlyTotal = expenseMonthRes?.data?.total ?? expenseMonthRes?.data ?? 0;

      setRawBuyList(buyData);
      setRawSaleList(saleData);
      setMonthlyExpense(Number(monthlyTotal || 0));

      if (lbslData) {
        setLbslReport({
          costAmount: lbslData.costAmount !== undefined && lbslData.costAmount !== null ? Number(lbslData.costAmount) : null,
          currentAssetsPP: lbslData.currentAssetsPP !== undefined && lbslData.currentAssetsPP !== null ? Number(lbslData.currentAssetsPP) : null,
        });
      }

      const metrics = calculatePortfolioMetrics(
        buyData,
        saleData,
        dividendData,
        investmentData,
      );

      setPortfolioMetrics(metrics);
    } catch (err) {
      console.error("Portfolio data fetch failed:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    const confirmed = await confirm("Are you sure you want to close the app?");
    if (!confirmed) return;

    try {
      setLogoutLoading(true);
      setSidebarOpen(false);

      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      sessionStorage.clear();

      if (window.electron && window.electron.closeApp) {
        window.electron.closeApp();
        return;
      }

      if (window.process && window.process.type === "renderer" && window.require) {
        const electron = window.require("electron");
        electron.remote.getCurrentWindow().close();
        return;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("App closure sequence failed:", err);
      navigate("/login", { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  // =========================
  // INTERCEPTIVE NAVIGATION
  // =========================
  const handleNavigate = (route) => {
    if (route === "/buy" || route === "/sale") {
      setPendingRoute(route);  
      setShowRulesPopup(true); 
      return;                  
    }

    setLoadingRoute(route);
    setTimeout(() => {
      navigate(route);
      setLoadingRoute("");
    }, 300);
  };

  const handleClosePopup = () => {
    setShowRulesPopup(false);

    if (pendingRoute) {
      setLoadingRoute(pendingRoute);
      setTimeout(() => {
        navigate(pendingRoute);
        setLoadingRoute("");
        setPendingRoute(""); 
      }, 300);
    }
  };

  const menuItems = [
    { icon: "🔄", title: "Update Price", route: "/update-price" },
    { icon: "🟩", title: "Buy Zone", route: "/buy-zone" },
    { icon: "🟥", title: "Sale Zone", route: "/sale-zone" },
    { icon: "💼", title: "Investment", route: "/investment" },
    { icon: "🟢", title: "Buy", route: "/buy" },
    { icon: "🔴", title: "Sale", route: "/sale" },
    { icon: "💎", title: "Dividend", route: "/dividend" },
    { icon: "📊", title: "Reports", route: "/reports" },
    { icon: "💰", title: "Expense", route: "/expense" },
    { icon: "📑", title: "LBSL Report", route: "/lbsl-report" },
  ];

  return (
    <>
      {/* RULES POPUP */}
      {showRulesPopup && (
        <RulesPopup onClose={handleClosePopup} />
      )}

      {/* NEW BUY/SALE MARKET ALERTS POPUP */}
      <BuySalePopup 
        isOpen={isMarketPopupOpen} 
        onClose={() => setIsMarketPopupOpen(false)}
        buyList={greenBuyCompanies}
        saleList={greenSaleCompanies}
        loading={marketDataLoading}
      />

      {/* MAIN DASHBOARD */}
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
              profit={accurateReportProfit} 
              remainingShareValue={portfolioMetrics.totalRemainingShareValue}
              totalBuyCost={portfolioMetrics.totalBuyCost}
              totalAssets={portfolioMetrics.cashBalance + portfolioMetrics.totalRemainingShareValue}
              totalBuyQty={portfolioMetrics.totalBuyQty}
              totalSaleQty={portfolioMetrics.totalSaleQty}
              totalSaleValueWithCommission={portfolioMetrics.totalSaleValueWithCommission}
              totalRemainQty={portfolioMetrics.totalRemainQty}
              tillNowProfitLoss={accurateReportProfit} 
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