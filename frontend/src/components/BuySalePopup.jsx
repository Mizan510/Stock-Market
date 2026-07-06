import React, { useEffect, useState } from "react";
import api from "../api";

const BuySalePopup = ({
  isOpen,
  onClose,
  buyList = [],
  saleList = [],
  loading = false,
}) => {
  const [buyRows, setBuyRows] = useState([]);
  const [saleRows, setSaleRows] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [pivotData, setPivotData] = useState({});
  const [volumeData, setVolumeData] = useState({});
  const [volumeRatioData, setVolumeRatioData] = useState({});

  // State for section visibility - all hidden by default
  const [showYearlyLow, setShowYearlyLow] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showRemainingSales, setShowRemainingSales] = useState(false);

  const cleanString = (str) =>
    String(str || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  const parseNumber = (value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  };

  const calcZone = (low, high, percent) => {
    const lowValue = parseNumber(low);
    const highValue = parseNumber(high);
    const percentValue = parseNumber(percent);
    if (
      lowValue === undefined ||
      highValue === undefined ||
      percentValue === undefined
    ) {
      return undefined;
    }
    return lowValue + ((highValue - lowValue) * percentValue) / 100;
  };

  // Helper function to calculate volume ratio
  const calculateVolumeRatio = (todayVolume, avgVolume) => {
    if (!todayVolume || !avgVolume || avgVolume === 0) return null;
    return todayVolume / avgVolume;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllData = async () => {
      setLocalLoading(true);
      try {
        let userId = null;
        const authStr = localStorage.getItem("auth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          userId = auth?.id || null;
        }

        const [zoneResponse, buyResponse, saleResponse] = await Promise.all([
          api.get("/zone").catch(() => ({ data: [] })),
          userId
            ? api.get(`/buy/${userId}`).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          userId
            ? api.get(`/sale/${userId}`).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        const rawZones = zoneResponse.data?.data || zoneResponse.data || [];
        const rawBuys = buyResponse.data?.data || buyResponse.data || [];
        const rawSales = saleResponse.data?.data || saleResponse.data || [];

        console.log("=== DEBUG: Raw Zone Data ===", rawZones);

        // Get pivot points, volume signals, and volume ratios from database
        const pivots = {};
        const volumes = {};
        const volumeRatios = {};

        rawZones.forEach((zone) => {
          const company =
            zone.company || zone.companyName || zone.stockName || "";
          if (company) {
            // Store pivot
            if (zone.pivotPoint !== undefined && zone.pivotPoint !== null) {
              pivots[company] = zone.pivotPoint;
              console.log(`${company} pivot from DB:`, zone.pivotPoint);
            }
            // Store volume signal
            if (zone.volumeSignal || zone.customSignal) {
              volumes[company] = zone.volumeSignal || zone.customSignal;
              console.log(`${company} volume signal:`, volumes[company]);
            }
            // Calculate and store volume ratio from today volume and avg volume
            const todayVol = zone.todayVolume || 0;
            const avgVol = zone.avgVolume1M || 0;
            const ratio = calculateVolumeRatio(todayVol, avgVol);
            if (ratio !== null) {
              volumeRatios[company] = ratio;
              console.log(`${company} volume ratio calculated:`, ratio);
            }
          }
        });

        console.log("=== All Pivots from DB ===", pivots);
        console.log("=== All Volume Signals from DB ===", volumes);
        console.log("=== All Volume Ratios from DB ===", volumeRatios);
        setPivotData(pivots);
        setVolumeData(volumes);
        setVolumeRatioData(volumeRatios);

        // Create buy rows with proper data
        const mappedBuyData = rawZones
          .map((row) => {
            const company =
              row.company || row.companyName || row.stockName || "";

            // Session values
            const sessionHigh = row.todaysHigh || 0;
            const sessionLow = row.todaysLow || 0;
            const sessionClose = row.closingPrice || 0;

            // Yearly values
            const yearlyHigh = row.high || 0;
            const yearlyLow = row.low || 0;

            // Calculate volume ratio directly from the row data
            const todayVol = row.todayVolume || 0;
            const avgVol = row.avgVolume1M || 0;
            const calculatedRatio = calculateVolumeRatio(todayVol, avgVol);

            return {
              ...row,
              company: company,
              // Session values
              sessionHigh: sessionHigh,
              sessionLow: sessionLow,
              sessionClose: sessionClose,
              // Yearly values
              yearlyHigh: yearlyHigh,
              yearlyLow: yearlyLow,
              // For display - use session values for pivot display
              high: sessionHigh,
              low: sessionLow,
              closingPrice: sessionClose,
              buyPercent: row.buyPercent ?? 20,
              // Use pivot from database
              pivot: row.pivotPoint || null,
              // Volume signal from database
              volumeSignal: row.volumeSignal || row.customSignal || null,
              // Volume ratio - use calculated value or from database
              volumeRatio:
                calculatedRatio !== null
                  ? calculatedRatio
                  : row.volRatio || null,
            };
          })
          .sort((a, b) =>
            a.company.localeCompare(b.company, undefined, {
              sensitivity: "base",
            }),
          );

        console.log(
          "=== Mapped Buy Data with Volume Ratios ===",
          mappedBuyData,
        );
        setBuyRows(mappedBuyData);

        // Buy aggregation
        const buyAggregation = {};
        rawBuys.forEach((item) => {
          const company = (
            item.stockName ||
            item.company ||
            item.companyName ||
            ""
          ).trim();
          if (!company) return;

          const qty = Number(item.buyQuantity ?? item.quantity ?? 0);
          const price = Number(
            item.perShareValue ?? item.sharePrice ?? item.price ?? 0,
          );
          const commission = Number(item.commission ?? price * qty * 0.004);
          const totalValue = price * qty;

          if (!buyAggregation[company]) {
            buyAggregation[company] = {
              totalQty: 0,
              totalValue: 0,
              totalCommission: 0,
            };
          }
          buyAggregation[company].totalQty += qty;
          buyAggregation[company].totalValue += totalValue;
          buyAggregation[company].totalCommission += commission;
        });

        // Sale aggregation
        const saleAggregation = {};
        rawSales.forEach((item) => {
          const company = (
            item.stockName ||
            item.company ||
            item.companyName ||
            ""
          ).trim();
          if (!company) return;

          const qty = Number(item.saleQuantity ?? item.quantity ?? 0);

          if (!saleAggregation[company]) {
            saleAggregation[company] = { totalQty: 0 };
          }
          saleAggregation[company].totalQty += qty;
        });

        // Normalize sale data
        const normalizedSaleData = Object.keys(buyAggregation)
          .map((company) => {
            const buyData = buyAggregation[company];
            const saleData = saleAggregation[company] || { totalQty: 0 };

            const totalBuyQty = buyData.totalQty;
            const totalSaleQty = saleData.totalQty;
            const remainQty = totalBuyQty - totalSaleQty;

            const avgBuyPriceWithCommission =
              buyData.totalQty > 0
                ? (buyData.totalValue + buyData.totalCommission) /
                  buyData.totalQty
                : 0;

            const companyClean = cleanString(company);
            const matchedZone = rawZones.find(
              (z) =>
                cleanString(z.company || z.companyName || z.stockName || "") ===
                companyClean,
            );

            const closingPrice = Number(matchedZone?.closingPrice ?? 0);

            const exitFloorPrice = avgBuyPriceWithCommission * (1 - 3 / 100);
            const targetPrice = avgBuyPriceWithCommission * (1 + 10 / 100);

            return {
              company,
              remainQtn: remainQty,
              closingPrice,
              exitFloorPrice,
              targetPrice,
              avgBuyPriceWithCommission,
              sessionPrice: closingPrice,
            };
          })
          .filter((item) => item.remainQtn > 0)
          .sort((a, b) => a.company.localeCompare(b.company));

        setSaleRows(normalizedSaleData);
      } catch (err) {
        console.error("Popup error:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchAllData();
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoading = loading || localLoading;

  // Yearly Low Buy - Uses yearly high/low values
  const yearlyLowBuyList = buyRows.filter((row) => {
    const currentPrice = parseNumber(row.closingPrice);
    // Use yearly values for zone calculation
    const yearlyHigh = row.yearlyHigh || row.high || 0;
    const yearlyLow = row.yearlyLow || row.low || 0;
    const buyZone = calcZone(yearlyLow, yearlyHigh, row.buyPercent);
    return (
      currentPrice !== undefined &&
      buyZone !== undefined &&
      currentPrice <= buyZone
    );
  });

  // Create a set of yearly low buy company names for highlighting
  const yearlyLowCompanySet = new Set(
    yearlyLowBuyList.map((row) => row.company),
  );

  // Volume Signal Buy - Uses volume signal from database with highlight check
  const volumeBuyListWithHighlight = buyRows
    .filter((row) => {
      const volumeSignal = row.volumeSignal || volumeData[row.company];
      const buySignals = [
        "STRONG BULLISH",
        "BULLISH",
        "MILD BULLISH",
        "STRONG BUYER",
        "BUYER",
        "WEAK BUYER",
      ];
      const signalUpper = volumeSignal?.toUpperCase() || "";
      return buySignals.some((signal) => signalUpper.includes(signal));
    })
    .map((row) => ({
      ...row,
      // Highlight if stock is in Yearly Low Buy list
      isHighlighted: yearlyLowCompanySet.has(row.company),
    }));

  // Ready for Buy - Only STRONG BUYER and VERY STRONG BUYER
  const readyForBuyList = buyRows
    .filter((row) => {
      const volumeSignal = row.volumeSignal || volumeData[row.company];
      const signalUpper = volumeSignal?.toUpperCase() || "";
      return (
        signalUpper.includes("STRONG BUYER") ||
        signalUpper.includes("VERY STRONG BUYER")
      );
    })
    .map((row) => ({
      ...row,
      // Highlight if stock is in Yearly Low Buy list
      isHighlighted: yearlyLowCompanySet.has(row.company),
    }));

  const redSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice <= row.exitFloorPrice,
  );

  const greenSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice >= row.targetPrice,
  );

  // NEW: Remaining Sales - between stop loss and target
  const remainingSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice > row.exitFloorPrice &&
      row.closingPrice < row.targetPrice,
  );

  // Get Volume Signal Style
  const getVolumeSignalStyle = (signal) => {
    if (!signal || signal === "N/A") return "text-gray-400";

    const signalUpper = signal.toUpperCase();

    if (
      signalUpper === "STRONG BULLISH" ||
      signalUpper === "VERY STRONG BUYER"
    ) {
      return "text-emerald-400 font-bold";
    } else if (signalUpper === "BULLISH" || signalUpper === "STRONG BUYER") {
      return "text-emerald-300 font-bold";
    } else if (signalUpper === "MILD BULLISH" || signalUpper === "WEAK BUYER") {
      return "text-emerald-200";
    } else if (
      signalUpper === "STRONG BEARISH" ||
      signalUpper === "VERY STRONG SELLER"
    ) {
      return "text-rose-400 font-bold";
    } else if (signalUpper === "BEARISH" || signalUpper === "STRONG SELLER") {
      return "text-rose-300 font-bold";
    } else if (
      signalUpper === "MILD BEARISH" ||
      signalUpper === "WEAK SELLER"
    ) {
      return "text-rose-200";
    } else {
      return "text-gray-400";
    }
  };

  const getVolumeSignalBadge = (signal) => {
    if (!signal || signal === "N/A") return "bg-gray-800 text-gray-400";

    const signalUpper = signal.toUpperCase();

    if (
      signalUpper === "STRONG BULLISH" ||
      signalUpper === "VERY STRONG BUYER"
    ) {
      return "bg-gray-900 text-green-300 font-bold border border-green-500";
    } else if (signalUpper === "BULLISH" || signalUpper === "STRONG BUYER") {
      return "bg-gray-800 text-green-400 font-semibold border border-green-500";
    } else if (signalUpper === "MILD BULLISH" || signalUpper === "WEAK BUYER") {
      return "bg-gray-700 text-emerald-300 font-medium";
    } else if (
      signalUpper === "STRONG BEARISH" ||
      signalUpper === "VERY STRONG SELLER"
    ) {
      return "bg-gray-900 text-rose-300 font-bold border border-rose-500";
    } else if (signalUpper === "BEARISH" || signalUpper === "STRONG SELLER") {
      return "bg-gray-800 text-rose-400 font-semibold border border-rose-500";
    } else if (
      signalUpper === "MILD BEARISH" ||
      signalUpper === "WEAK SELLER"
    ) {
      return "bg-gray-700 text-rose-300 font-medium";
    } else {
      return "bg-gray-800 text-gray-400";
    }
  };

  // Toggle functions
  const toggleYearlyLow = () => setShowYearlyLow(!showYearlyLow);
  const toggleVolume = () => setShowVolume(!showVolume);
  const toggleRemainingSales = () => setShowRemainingSales(!showRemainingSales);

  // Helper function to format volume ratio as decimal (no % sign)
  const formatVolumeRatio = (ratio) => {
    if (ratio === null || ratio === undefined || isNaN(ratio)) return null;
    return ratio.toFixed(2);
  };

  // Helper function to get volume ratio for a company
  const getVolumeRatio = (row) => {
    // First try to get from the row
    if (row.volumeRatio !== null && row.volumeRatio !== undefined) {
      return row.volumeRatio;
    }
    // Then try from the volumeRatioData state
    if (volumeRatioData[row.company] !== undefined) {
      return volumeRatioData[row.company];
    }
    // Calculate from today volume and avg volume if available
    if (row.todayVolume && row.avgVolume1M) {
      return calculateVolumeRatio(row.todayVolume, row.avgVolume1M);
    }
    return null;
  };

  // Helper function to get RSI 14 for a company
  const getRSI14 = (row) => {
    // Get RSI from the row data
    if (row.rsi14 !== null && row.rsi14 !== undefined) {
      return row.rsi14;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2">
      <div className="w-full max-w-5xl max-h-[95vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-gray-800 to-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-white font-bold text-base sm:text-lg">
              ✅ Dynamic Watchlist
            </h2>
            <p className="text-gray-400 text-center text-xs">
              Welcome back! Here are your trading signals
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">
                Loading your portfolio data...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content - Side by Side */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex gap-3 min-w-0">
                {/* BUY ZONE - Left Side */}
                <div className="flex-1 w-1/2 min-w-0">
                  {/* Buy Section Questions - Top */}
                  <div className="flex flex-col gap-1 mb-3 bg-gray-800/30 p-2 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                      <span className="text-gray-400">Buy Zone:</span>
                      <span className="text-amber-400 font-medium">
                        Follow or Not?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                      <span className="text-gray-400">Pyramid Rules:</span>

                      <span className="text-amber-400 font-medium">
                        Follow or Not?
                      </span>
                    </div>
                  </div>

                  {/* READY FOR BUY - Always visible, no toggle */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                      <h3 className="font-semibold text-amber-400 text-[10px] sm:text-sm">
                        🚀 Ready for Buy
                      </h3>
                      {readyForBuyList.length > 0 && (
                        <span className="text-[10px] sm:text-xs bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded-full">
                          {readyForBuyList.length}
                        </span>
                      )}
                    </div>

                    {readyForBuyList.length === 0 ? (
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                        <p className="text-gray-500 text-[10px] sm:text-xs">
                          No strong buyer signals
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {readyForBuyList.map((row, idx) => {
                          const currentPrice = parseNumber(row.closingPrice);
                          const volumeSignal =
                            row.volumeSignal ||
                            volumeData[row.company] ||
                            "Neutral";
                          const signalStyle =
                            getVolumeSignalStyle(volumeSignal);
                          const badgeStyle = getVolumeSignalBadge(volumeSignal);
                          const isHighlighted = row.isHighlighted;
                          // Get Volume Ratio (show this prominently in parentheses)
                          const volumeRatio = getVolumeRatio(row);
                          const formattedRatio = formatVolumeRatio(volumeRatio);
                          // Get RSI 14 (show this in the info line only)
                          const rsi14 = getRSI14(row);
                          const formattedRSI =
                            rsi14 !== null ? rsi14.toFixed(2) : null;
                          // Check if RSI is above 70 for warning
                          const isRSIOverbought = rsi14 !== null && rsi14 > 70;

                          return (
                            <div
                              key={idx}
                              className={`border rounded-lg p-1.5 sm:p-2 transition-all duration-300 ${
                                isHighlighted
                                  ? "bg-amber-900/40 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/60"
                                  : "bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/30"
                              }`}
                            >
                              <div className="flex flex-col gap-0.5 sm:gap-1">
                                {/* Company Name */}
                                <div className="flex items-center justify-between w-full">
                                  <span
                                    className={`font-semibold text-[10px] sm:text-sm ${
                                      isHighlighted
                                        ? "text-amber-300"
                                        : "text-amber-200"
                                    }`}
                                  >
                                    {row.company}
                                  </span>
                                  {isHighlighted && (
                                    <span className="text-[10px] sm:text-xs font-bold bg-amber-600 text-white px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                                      DOUBLE
                                    </span>
                                  )}
                                </div>

                                {/* Signal Badge and Price */}
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-[9px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${badgeStyle} ${volumeSignal && volumeSignal.toLowerCase().includes("strong") ? "border-2 border-black" : ""}`}
                                  >
                                    {volumeSignal}
                                  </span>
                                  <span className="text-gray-400 text-[10px] sm:text-xs">
                                    Current:{" "}
                                    <span
                                      className={`font-medium ${
                                        isHighlighted
                                          ? "text-amber-300"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      ৳{currentPrice?.toFixed(2)}
                                    </span>
                                  </span>
                                </div>

                                {/* Info line - Volume Ratio and RSI */}
                                <div className="flex items-center justify-between">
                                  <span className="text-yellow-400 text-[10px] sm:text-xs">
                                    Vol. Ratio: {formattedRatio ?? "-"}
                                  </span>
                                  {formattedRSI !== null && (
                                    <span
                                      className={`text-[10px] sm:text-xs ${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                    >
                                      RSI: {formattedRSI}
                                      {isRSIOverbought && " ⚠️"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Yearly Low Buy Section - Collapsible */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                        onClick={toggleYearlyLow}
                      >
                        <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-200 text-[10px] sm:text-sm">
                          📉 Yearly Low Buy (≤20% Zone)
                        </h3>
                        {yearlyLowBuyList.length > 0 && (
                          <span className="text-[10px] sm:text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full">
                            {yearlyLowBuyList.length}
                          </span>
                        )}
                        <span className="ml-auto text-gray-500 text-[10px] sm:text-xs">
                          {showYearlyLow ? "▼" : "▶"}
                        </span>
                      </div>

                      {showYearlyLow && (
                        <>
                          {yearlyLowBuyList.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                              <p className="text-gray-500 text-[10px] sm:text-xs">
                                No yearly low buy signals
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {yearlyLowBuyList.map((row, idx) => {
                                const currentPrice = parseNumber(
                                  row.closingPrice,
                                );
                                const yearlyHigh =
                                  row.yearlyHigh || row.high || 0;
                                const yearlyLow = row.yearlyLow || row.low || 0;
                                const buyZone = calcZone(
                                  yearlyLow,
                                  yearlyHigh,
                                  row.buyPercent,
                                );
                                // Get Volume Ratio (show this in parentheses)
                                const volumeRatio = getVolumeRatio(row);
                                const formattedRatio =
                                  formatVolumeRatio(volumeRatio);
                                // Get RSI 14 (show this in the info line only)
                                const rsi14 = getRSI14(row);
                                const formattedRSI =
                                  rsi14 !== null ? rsi14.toFixed(2) : null;
                                // Check if RSI is above 70 for warning
                                const isRSIOverbought =
                                  rsi14 !== null && rsi14 > 70;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-green-900/20 border border-green-800/50 rounded-lg p-1.5 sm:p-2 hover:bg-green-900/30 transition-colors"
                                  >
                                    <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                                      <span className="font-semibold text-green-300 text-[10px] sm:text-sm truncate flex-1">
                                        {row.company}
                                      </span>
                                      <span className="text-[9px] sm:text-xs bg-green-800 text-green-300 px-1 sm:px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                        Buy
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                                      <span className="text-gray-400">
                                        Current:{" "}
                                        <span className="text-gray-300 font-medium">
                                          ৳{currentPrice?.toFixed(2)}
                                        </span>
                                      </span>
                                      <span className="text-green-400">
                                        ≤20% Zone:{" "}
                                        <span className="font-medium">
                                          ৳{buyZone?.toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs mt-0.5">
                                      <span className="text-yellow-400">
                                        Vol. Ratio:{" "}
                                        <span className="text-yellow-300 font-medium">
                                          {formattedRatio ?? "-"}
                                        </span>
                                      </span>
                                      {formattedRSI !== null && (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Volume Signal Buy Section with Highlight - Collapsible */}
                    <div>
                      <div className="flex flex-col gap-1 mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                          onClick={toggleVolume}
                        >
                          <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                          <h3 className="font-semibold text-gray-200 text-[10px] sm:text-sm">
                            📈 Volume Signal Buy
                          </h3>
                          {volumeBuyListWithHighlight.length > 0 && (
                            <span className="text-[10px] sm:text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded-full">
                              {volumeBuyListWithHighlight.length}
                            </span>
                          )}
                          <span className="ml-auto text-gray-500 text-[10px] sm:text-xs">
                            {showVolume ? "▼" : "▶"}
                          </span>
                        </div>

                        {/* Double Signal on separate line - only show when expanded */}
                        {showVolume &&
                          volumeBuyListWithHighlight.filter(
                            (row) => row.isHighlighted,
                          ).length > 0 && (
                            <div className="ml-3">
                              <span className="text-[10px] sm:text-xs bg-amber-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse font-bold inline-flex items-center gap-1">
                                ⚡{" "}
                                {
                                  volumeBuyListWithHighlight.filter(
                                    (row) => row.isHighlighted,
                                  ).length
                                }{" "}
                                Double Signal
                              </span>
                            </div>
                          )}
                      </div>

                      {showVolume && (
                        <>
                          {volumeBuyListWithHighlight.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                              <p className="text-gray-500 text-[10px] sm:text-xs">
                                No volume buy signals
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {volumeBuyListWithHighlight.map((row, idx) => {
                                const currentPrice = parseNumber(
                                  row.closingPrice,
                                );
                                const volumeSignal =
                                  row.volumeSignal ||
                                  volumeData[row.company] ||
                                  "Neutral";
                                const signalStyle =
                                  getVolumeSignalStyle(volumeSignal);
                                const badgeStyle =
                                  getVolumeSignalBadge(volumeSignal);
                                const isHighlighted = row.isHighlighted;
                                // Get Volume Ratio (show this in parentheses)
                                const volumeRatio = getVolumeRatio(row);
                                const formattedRatio =
                                  formatVolumeRatio(volumeRatio);
                                // Get RSI 14 (show this in the info line only)
                                const rsi14 = getRSI14(row);
                                const formattedRSI =
                                  rsi14 !== null ? rsi14.toFixed(2) : null;
                                // Check if RSI is above 70 for warning
                                const isRSIOverbought =
                                  rsi14 !== null && rsi14 > 70;

                                return (
                                  <div
                                    key={idx}
                                    className={`border rounded-lg p-1.5 sm:p-2 transition-all duration-300 ${
                                      isHighlighted
                                        ? "bg-amber-900/30 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/60 hover:ring-amber-500/80"
                                        : "bg-purple-900/20 border-purple-800/50 hover:bg-purple-900/30"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                      {/* Company Name with Volume Ratio in parentheses */}
                                      <div className="flex items-center justify-between w-full">
                                        <span
                                          className={`font-semibold text-[10px] sm:text-sm ${
                                            isHighlighted
                                              ? "text-amber-300"
                                              : "text-purple-300"
                                          }`}
                                        >
                                          {row.company}
                                        </span>
                                        {isHighlighted && (
                                          <span className="text-[10px] sm:text-xs font-bold bg-amber-600 text-white px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                                            DOUBLE
                                          </span>
                                        )}
                                      </div>

                                      {/* Signal Badge and Price */}
                                      <div className="flex items-center justify-between">
                                        <span
                                          className={`text-[9px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${badgeStyle} ${volumeSignal && volumeSignal.toLowerCase().includes("strong") ? "border-2 border-black" : ""}`}
                                        >
                                          {volumeSignal}
                                        </span>
                                        <span className="text-gray-400 text-[10px] sm:text-xs">
                                          Current:{" "}
                                          <span
                                            className={`font-medium ${
                                              isHighlighted
                                                ? "text-amber-300"
                                                : "text-gray-300"
                                            }`}
                                          >
                                            ৳{currentPrice?.toFixed(2)}
                                          </span>
                                        </span>
                                      </div>

                                      {/* Info line - Volume Ratio and RSI */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-yellow-400 text-[10px] sm:text-xs">
                                          Vol. Ratio: {formattedRatio ?? "-"}
                                        </span>
                                        {formattedRSI !== null && (
                                          <span
                                            className={`text-[10px] sm:text-xs ${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                          >
                                            RSI: {formattedRSI}
                                            {isRSIOverbought && " ⚠️"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* SALE ZONE - Right Side */}
                <div className="flex-1 w-1/2 min-w-0">
                  {/* Sale Section Questions - Top */}
                  <div className="flex flex-col gap-1 mb-3 bg-gray-800/30 p-2 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                      <span className="text-gray-400">3% Stop Loss:</span>
                      <span className="text-amber-400 font-medium">
                        Follow or Not?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                      <span className="text-gray-400">3% of High Price:</span>
                      <span className="text-amber-400 font-medium">
                        Follow or Not?
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-200 text-[10px] sm:text-sm">
                        🔴 Sale Signals
                      </h3>
                      {redSaleList.length + greenSaleList.length > 0 && (
                        <span className="text-[10px] sm:text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full">
                          {redSaleList.length + greenSaleList.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {redSaleList.length === 0 && greenSaleList.length === 0 && remainingSaleList.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                      <p className="text-gray-500 text-[10px] sm:text-xs">No sale signals</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Stop Loss */}
                      {redSaleList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] sm:text-xs font-semibold text-red-400">
                              🚨 Stop Loss (3% Below)
                            </span>
                            <span className="text-[9px] sm:text-xs bg-red-900 text-red-300 px-1 rounded">
                              {redSaleList.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {redSaleList.map((row, idx) => {
                              // Get Volume Ratio and RSI for sale items
                              const zoneRow = buyRows.find(
                                (r) => r.company === row.company,
                              );
                              const volumeRatio = zoneRow
                                ? getVolumeRatio(zoneRow)
                                : null;
                              const formattedRatio =
                                formatVolumeRatio(volumeRatio);
                              const rsi14 = zoneRow ? getRSI14(zoneRow) : null;
                              const formattedRSI =
                                rsi14 !== null ? rsi14.toFixed(2) : null;
                              // Check if RSI is above 70 for warning
                              const isRSIOverbought =
                                rsi14 !== null && rsi14 > 70;

                              return (
                                <div
                                  key={idx}
                                  className="bg-red-900/20 border border-red-800/50 rounded-lg p-1.5 sm:p-2"
                                >
                                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                                    <span className="font-semibold text-red-300 text-[10px] sm:text-sm truncate flex-1">
                                      {row.company}
                                    </span>
                                    <span className="text-[9px] sm:text-xs bg-red-800 text-red-300 px-1 sm:px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                      Loss
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Buy Price:
                                      </span>
                                      <span className="text-gray-300 font-medium">
                                        ৳
                                        {row.avgBuyPriceWithCommission.toFixed(
                                          2,
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Session Price:
                                      </span>
                                      <span className="text-red-400 font-medium">
                                        ৳{row.sessionPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Quantity:
                                      </span>
                                      <span className="text-gray-300">
                                        {row.remainQtn.toLocaleString()} shares
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Stop Loss:
                                      </span>
                                      <span className="text-red-400 font-medium">
                                        ৳{row.exitFloorPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-yellow-400">
                                        Vol. Ratio:{" "}
                                        <span className="text-yellow-300 font-medium">
                                          {formattedRatio ?? "-"}
                                        </span>
                                      </span>
                                      {formattedRSI !== null && (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Target Profit */}
                      {greenSaleList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1 mt-2">
                            <span className="text-[9px] sm:text-xs font-semibold text-green-400">
                              🏆 Target Hit (10% Above)
                            </span>
                            <span className="text-[9px] sm:text-xs bg-green-900 text-green-300 px-1 rounded">
                              {greenSaleList.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {greenSaleList.map((row, idx) => {
                              // Get Volume Ratio and RSI for sale items
                              const zoneRow = buyRows.find(
                                (r) => r.company === row.company,
                              );
                              const volumeRatio = zoneRow
                                ? getVolumeRatio(zoneRow)
                                : null;
                              const formattedRatio =
                                formatVolumeRatio(volumeRatio);
                              const rsi14 = zoneRow ? getRSI14(zoneRow) : null;
                              const formattedRSI =
                                rsi14 !== null ? rsi14.toFixed(2) : null;
                              // Check if RSI is above 70 for warning
                              const isRSIOverbought =
                                rsi14 !== null && rsi14 > 70;

                              return (
                                <div
                                  key={idx}
                                  className="bg-green-900/20 border border-green-800/50 rounded-lg p-1.5 sm:p-2"
                                >
                                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                                    <span className="font-semibold text-green-300 text-[10px] sm:text-sm truncate flex-1">
                                      {row.company}
                                    </span>
                                    <span className="text-[9px] sm:text-xs bg-green-800 text-green-300 px-1 sm:px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                      Profit
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-yellow-400">
                                        Buy Price:
                                      </span>
                                      <span className="text-gray-300 font-medium">
                                        ৳
                                        {row.avgBuyPriceWithCommission.toFixed(
                                          2,
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Session Price:
                                      </span>
                                      <span className="text-green-400 font-medium">
                                        ৳{row.sessionPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Quantity:
                                      </span>
                                      <span className="text-gray-300">
                                        {row.remainQtn.toLocaleString()} shares
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Target Price:
                                      </span>
                                      <span className="text-green-400 font-medium">
                                        ৳{row.targetPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-yellow-400">
                                        Vol. Ratio:{" "}
                                        <span className="text-yellow-300 font-medium">
                                          {formattedRatio ?? "-"}
                                        </span>
                                      </span>
                                      {formattedRSI !== null && (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* NEW: Remaining Holdings Section */}
                      {remainingSaleList.length > 0 && (
                        <div className="mt-3">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                            onClick={toggleRemainingSales}
                          >
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-200 text-[10px] sm:text-sm">
                              📊 Remaining Holdings
                            </h3>
                            <span className="text-[10px] sm:text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded-full">
                              {remainingSaleList.length}
                            </span>
                            <span className="ml-auto text-gray-500 text-[10px] sm:text-xs">
                              {showRemainingSales ? "▼" : "▶"}
                            </span>
                          </div>

                          {showRemainingSales && (
                            <div className="space-y-1.5 mt-2">
                              {remainingSaleList.map((row, idx) => {
                                // Get Volume Ratio and RSI for remaining items
                                const zoneRow = buyRows.find(
                                  (r) => r.company === row.company,
                                );
                                const volumeRatio = zoneRow
                                  ? getVolumeRatio(zoneRow)
                                  : null;
                                const formattedRatio = formatVolumeRatio(volumeRatio);
                                const rsi14 = zoneRow ? getRSI14(zoneRow) : null;
                                const formattedRSI =
                                  rsi14 !== null ? rsi14.toFixed(2) : null;
                                const isRSIOverbought =
                                  rsi14 !== null && rsi14 > 70;
                                
                                // Calculate profit/loss percentage
                                const profitLossPercent = ((row.sessionPrice - row.avgBuyPriceWithCommission) / row.avgBuyPriceWithCommission) * 100;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-1.5 sm:p-2 hover:bg-blue-900/30 transition-colors"
                                  >
                                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                                      <span className="font-semibold text-blue-300 text-[10px] sm:text-sm truncate flex-1">
                                        {row.company}
                                      </span>
                                      <span className={`text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                                        profitLossPercent >= 0 
                                          ? "bg-green-800 text-green-300" 
                                          : "bg-red-800 text-red-300"
                                      }`}>
                                        {profitLossPercent >= 0 ? "📈" : "📉"} {profitLossPercent.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Buy Price:</span>
                                        <span className="text-gray-300 font-medium">
                                          ৳{row.avgBuyPriceWithCommission.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Session Price:</span>
                                        <span className={`font-medium ${
                                          profitLossPercent >= 0 ? "text-green-400" : "text-red-400"
                                        }`}>
                                          ৳{row.sessionPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Quantity:</span>
                                        <span className="text-gray-300">
                                          {row.remainQtn.toLocaleString()} shares
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Stop Loss:</span>
                                        <span className="text-red-400 font-medium">
                                          ৳{row.exitFloorPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Target:</span>
                                        <span className="text-green-400 font-medium">
                                          ৳{row.targetPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between pt-0.5 border-t border-gray-700/50">
                                        <span className="text-yellow-400">
                                          Vol. Ratio:{" "}
                                          <span className="text-yellow-300 font-medium">
                                            {formattedRatio ?? "-"}
                                          </span>
                                        </span>
                                        {formattedRSI !== null && (
                                          <span className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}>
                                            RSI: {formattedRSI}
                                            {isRSIOverbought && " ⚠️"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-gray-700 px-3 py-2 flex justify-center bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-blue-800 hover:bg-blue-600 text-white text-base sm:text-xl font-medium rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySalePopup;