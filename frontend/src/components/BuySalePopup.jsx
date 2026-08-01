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

  // State for section visibility
  const [showYearlyLow, setShowYearlyLow] = useState(false);
  const [showHighRSI, setShowHighRSI] = useState(false);
  const [showNearPivot, setShowNearPivot] = useState(false);
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

  // Normalize signal to a standard uppercase form
  const normalizeSignal = (value) => {
    if (!value) return "NEUTRAL";
    const signal = String(value).trim();
    const signalUpper = signal.toUpperCase();
    const mapping = {
      "STRONG BUYER (NEAR PIVOT)": "STRONG BUYER (NP)",
      "STRONG BUYER NEAR PIVOT": "STRONG BUYER (NP)",
      "STRONG BUYER (NP)": "STRONG BUYER (NP)",
      "OVERBOUGHT (STRONG TREND)": "OVERBOUGHT (ST)",
      "OVERBOUGHT STRONG TREND": "OVERBOUGHT (ST)",
      "OVERBOUGHT (HIGH RISK)": "OVERBOUGHT (HR)",
      "OVERBOUGHT HIGH RISK": "OVERBOUGHT (HR)",
      "OVERSOLD (WATCH BOUNCE)": "OVERSOLD (WB)",
      "OVERSOLD WATCH BOUNCE": "OVERSOLD (WB)",
    };
    return mapping[signalUpper] || signalUpper;
  };

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

        const pivots = {};
        const volumes = {};
        const volumeRatios = {};

        rawZones.forEach((zone) => {
          const company =
            zone.company || zone.companyName || zone.stockName || "";
          if (company) {
            if (zone.pivotPoint !== undefined && zone.pivotPoint !== null) {
              pivots[company] = zone.pivotPoint;
            }
            const rawSignal =
              zone.volumeSignal || zone.customSignal || "Neutral";
            const normalizedSignal = normalizeSignal(rawSignal);
            volumes[company] = normalizedSignal;

            const todayVol = zone.todayVolume || 0;
            const avgVol = zone.avgVolume1M || 0;
            const ratio = calculateVolumeRatio(todayVol, avgVol);
            if (ratio !== null) {
              volumeRatios[company] = ratio;
            }
          }
        });

        setPivotData(pivots);
        setVolumeData(volumes);
        setVolumeRatioData(volumeRatios);

        const mappedBuyData = rawZones
          .map((row) => {
            const company =
              row.company || row.companyName || row.stockName || "";

            const sessionHigh = row.todaysHigh || 0;
            const sessionLow = row.todaysLow || 0;
            const sessionClose = row.closingPrice || 0;

            const yearlyHigh = row.high || 0;
            const yearlyLow = row.low || 0;

            const todayVol = row.todayVolume || 0;
            const avgVol = row.avgVolume1M || 0;
            const calculatedRatio = calculateVolumeRatio(todayVol, avgVol);

            const rawSignal = row.volumeSignal || row.customSignal || "Neutral";
            const normalizedSignal = normalizeSignal(rawSignal);

            return {
              ...row,
              company: company,
              sessionHigh,
              sessionLow,
              sessionClose,
              yearlyHigh,
              yearlyLow,
              high: sessionHigh,
              low: sessionLow,
              closingPrice: sessionClose,
              buyPercent: row.buyPercent ?? 20,
              pivot: row.pivotPoint || null,
              ma20: row.ma20 || null,
              volumeSignal: normalizedSignal,
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

        const normalizedSaleData = Object.keys(buyAggregation)
          .map((company) => {
            const relevantBuys = rawBuys.filter((item) => {
              const buyCompany = (
                item.stockName ||
                item.company ||
                item.companyName ||
                ""
              ).trim();
              return buyCompany === company;
            });

            const buyLots = relevantBuys
              .map((item) => {
                const qty = Number(item.buyQuantity ?? item.quantity ?? 0);
                if (qty <= 0) return null;
                const price = Number(
                  item.perShareValue ?? item.sharePrice ?? item.price ?? 0,
                );
                const totalValue = Number(
                  item.buyingTotalShareValue ?? item.total ?? price * qty,
                );
                const commission = Number(
                  item.commission ?? price * qty * 0.004,
                );
                const buyDate =
                  item.date ||
                  item.buyDate ||
                  item.createdAt ||
                  item.updatedAt ||
                  "";

                return {
                  originalQty: qty,
                  qty,
                  totalValue,
                  commission,
                  buyDate,
                };
              })
              .filter(Boolean)
              .sort((a, b) => {
                const aDate = new Date(a.buyDate || 0).getTime() || 0;
                const bDate = new Date(b.buyDate || 0).getTime() || 0;
                return aDate - bDate;
              });

            let remainingSaleQty = saleAggregation[company]?.totalQty || 0;

            buyLots.forEach((lot) => {
              if (remainingSaleQty <= 0) return;
              const soldQty = Math.min(lot.qty, remainingSaleQty);
              lot.qty -= soldQty;
              remainingSaleQty -= soldQty;
            });

            const remainQty = buyLots.reduce((sum, lot) => sum + lot.qty, 0);
            const remainingTotalValue = buyLots.reduce(
              (sum, lot) =>
                sum + lot.totalValue * (lot.qty / lot.originalQty || 0) || 0,
              0,
            );
            const remainingCommission = buyLots.reduce(
              (sum, lot) =>
                sum + lot.commission * (lot.qty / lot.originalQty || 0) || 0,
              0,
            );
            const avgBuyPriceWithCommission =
              remainQty > 0
                ? (remainingTotalValue + remainingCommission) / remainQty
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

  // ----- BUY SIGNALS -----

  const yearlyLowBuyList = buyRows.filter((row) => {
    const currentPrice = parseNumber(row.closingPrice);
    const yearlyHigh = row.yearlyHigh || row.high || 0;
    const yearlyLow = row.yearlyLow || row.low || 0;
    const buyZone = calcZone(yearlyLow, yearlyHigh, row.buyPercent);
    return (
      currentPrice !== undefined &&
      buyZone !== undefined &&
      currentPrice <= buyZone
    );
  });

  const yearlyLowCompanySet = new Set(
    yearlyLowBuyList.map((row) => row.company),
  );

  // READY FOR BUY - Shows ONLY "STRONG BUYER"
  const readyForBuyList = buyRows
    .filter((row) => {
      const volumeSignal = row.volumeSignal || volumeData[row.company];
      const signalUpper = String(volumeSignal || "")
        .toUpperCase()
        .trim();
      return signalUpper === "STRONG BUYER";
    })
    .map((row) => ({
      ...row,
      isHighlighted: yearlyLowCompanySet.has(row.company),
    }));

  // BUY (HIGH RSI) - Shows Buy (High RSI)
  const highRSIBuyList = buyRows
    .filter((row) => {
      const volumeSignal = row.volumeSignal || volumeData[row.company];
      const signalUpper = String(volumeSignal || "")
        .toUpperCase()
        .trim();
      return signalUpper === "OVERBOUGHT (ST)";
    })
    .map((row) => ({
      ...row,
      isHighlighted: yearlyLowCompanySet.has(row.company),
    }));

  // BUY (NEAR PIVOT) - Shows Buy (Near Pivot)
  const nearPivotBuyList = buyRows
    .filter((row) => {
      const volumeSignal = row.volumeSignal || volumeData[row.company];
      const signalUpper = String(volumeSignal || "")
        .toUpperCase()
        .trim();
      return signalUpper === "STRONG BUYER (NP)";
    })
    .map((row) => ({
      ...row,
      isHighlighted: yearlyLowCompanySet.has(row.company),
    }));

  // ----- SALE SIGNALS -----

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

  const remainingSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice > row.exitFloorPrice &&
      row.closingPrice < row.targetPrice,
  );

  // ----- STYLING FUNCTIONS -----

  const getVolumeSignalBadge = (signal) => {
    if (!signal || signal === "N/A") return "bg-gray-800 text-gray-400";

    const signalUpper = String(signal || "").toUpperCase();

    if (signalUpper === "OVERBOUGHT (ST)") {
      return "bg-orange-600 text-white font-bold border-2 border-orange-400";
    } else if (signalUpper === "OVERBOUGHT (HR)") {
      return "bg-red-600 text-white font-bold border-2 border-red-400 animate-pulse";
    } else if (signalUpper === "OVERSOLD (WB)") {
      return "bg-purple-600 text-white font-bold border border-purple-400";
    } else if (signalUpper === "STRONG BULLISH") {
      return "bg-emerald-700 text-yellow-300 font-bold border-2 border-yellow-400";
    } else if (signalUpper === "STRONG BUYER (NP)") {
      return "bg-cyan-700 text-white font-bold border border-cyan-300 text-[6px] sm:text-[10px] whitespace-nowrap leading-none px-0.5";
    } else if (signalUpper === "BULLISH" || signalUpper === "STRONG BUYER") {
      return "bg-emerald-950 text-white font-semibold border border-emerald-700";
    } else if (signalUpper === "MILD BULLISH" || signalUpper === "WEAK BUYER") {
      return "bg-emerald-400 text-gray-900 font-semibold";
    } else if (signalUpper === "STRONG BEARISH") {
      return "bg-red-700 text-yellow-300 font-bold border-2 border-yellow-400";
    } else if (signalUpper === "BEARISH" || signalUpper === "STRONG SELLER") {
      return "bg-red-500 text-white font-bold border border-red-400";
    } else if (
      signalUpper === "MILD BEARISH" ||
      signalUpper === "WEAK SELLER"
    ) {
      return "bg-red-300 text-gray-900 font-semibold";
    } else {
      return "bg-gray-800 text-gray-400";
    }
  };

  // Toggle functions
  const toggleYearlyLow = () => setShowYearlyLow(!showYearlyLow);
  const toggleHighRSI = () => setShowHighRSI(!showHighRSI);
  const toggleNearPivot = () => setShowNearPivot(!showNearPivot);
  const toggleRemainingSales = () => setShowRemainingSales(!showRemainingSales);

  // Helper functions for metrics
  const formatVolumeRatio = (ratio) => {
    if (ratio === null || ratio === undefined || isNaN(ratio)) return null;
    return ratio.toFixed(2);
  };

  const getVolumeRatio = (row) => {
    if (row.volumeRatio !== null && row.volumeRatio !== undefined) {
      return row.volumeRatio;
    }
    if (volumeRatioData[row.company] !== undefined) {
      return volumeRatioData[row.company];
    }
    if (row.todayVolume && row.avgVolume1M) {
      return calculateVolumeRatio(row.todayVolume, row.avgVolume1M);
    }
    return null;
  };

  const getRSI14 = (row) => {
    if (row.rsi14 !== null && row.rsi14 !== undefined) {
      return row.rsi14;
    }
    return null;
  };

  const getMA20 = (row) => {
    if (row.ma20 !== null && row.ma20 !== undefined) {
      return row.ma20;
    }
    return null;
  };

  const getPivot = (row) => {
    if (row.pivot !== null && row.pivot !== undefined) {
      return row.pivot;
    }
    return null;
  };

  // Reusable card renderer
  const renderBuyCard = (
    row,
    isHighlighted,
    signalDisplay,
    bgColor,
    borderColor,
    textColor,
    highlightColor,
  ) => {
    const currentPrice = parseNumber(row.closingPrice);
    const volumeRatio = getVolumeRatio(row);
    const formattedRatio = formatVolumeRatio(volumeRatio);
    const rsi14 = getRSI14(row);
    const formattedRSI = rsi14 !== null ? rsi14.toFixed(2) : null;
    const isRSIOverbought = rsi14 !== null && rsi14 > 70;
    const ma20 = getMA20(row);
    const formattedMA20 = ma20 !== null ? ma20.toFixed(2) : null;
    const pivot = getPivot(row);
    const formattedPivot = pivot !== null ? pivot.toFixed(2) : null;

    const badgeStyle = getVolumeSignalBadge(row.volumeSignal);

    return (
      <div
        key={row.company}
        className={`border rounded-lg p-1.5 sm:p-2 transition-all duration-300 ${
          isHighlighted
            ? `bg-amber-900/40 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/60`
            : `${bgColor} ${borderColor} hover:bg-opacity-30`
        }`}
      >
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <div className="flex items-center justify-between w-full">
            <span
              className={`font-semibold text-[10px] sm:text-sm ${
                isHighlighted ? "text-amber-300" : textColor
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

          <div className="flex items-center justify-between">
            <span
              className={`text-[9px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${badgeStyle}`}
            >
              {signalDisplay || row.volumeSignal}
            </span>
            <span className="text-gray-400 text-[10px] sm:text-xs">
              Close:{" "}
              <span
                className={`font-medium ${
                  isHighlighted ? "text-amber-300" : "text-gray-300"
                }`}
              >
                {currentPrice?.toFixed(2)}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-yellow-400 text-[10px] sm:text-xs">
              Vol. Ratio: {formattedRatio ?? "-"}
            </span>
            <span className="text-blue-400 text-[10px] sm:text-xs">
              MA20:{" "}
              <span className="text-blue-300 font-medium">
                {formattedMA20 ?? "-"}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            {formattedRSI !== null ? (
              <span
                className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
              >
                RSI: {formattedRSI}
                {isRSIOverbought && " ⚠️"}
              </span>
            ) : (
              <span className="text-yellow-400">RSI: -</span>
            )}
            <span className="text-purple-400">
              Pivot:{" "}
              <span className="text-purple-300 font-medium">
                {formattedPivot ?? "-"}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
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
                    <div className="flex items-center gap-2 mb-0">
                      <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                      <h3 className="font-semibold text-green-400 text-[10px] sm:text-sm">
                        🚀 Confirmed Buy
                      </h3>
                      {readyForBuyList.length > 0 && (
                        <span className="text-[10px] sm:text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full">
                          {readyForBuyList.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-green-400 mb-2">
                      All criteria matched and ready for buy
                    </p>

                    {readyForBuyList.length === 0 ? (
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                        <p className="text-gray-500 text-[10px] sm:text-xs">
                          No strong buyer signals
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {readyForBuyList.map((row) =>
                          renderBuyCard(
                            row,
                            row.isHighlighted,
                            "STRONG BUYER",
                            "bg-amber-900/20",
                            "border-amber-700/50",
                            "text-amber-200",
                            "text-amber-300",
                          ),
                        )}
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
                              {yearlyLowBuyList.map((row) => {
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
                                const volumeRatio = getVolumeRatio(row);
                                const formattedRatio =
                                  formatVolumeRatio(volumeRatio);
                                const rsi14 = getRSI14(row);
                                const formattedRSI =
                                  rsi14 !== null ? rsi14.toFixed(2) : null;
                                const isRSIOverbought =
                                  rsi14 !== null && rsi14 > 70;
                                const ma20 = getMA20(row);
                                const formattedMA20 =
                                  ma20 !== null ? ma20.toFixed(2) : null;
                                const pivot = getPivot(row);
                                const formattedPivot =
                                  pivot !== null ? pivot.toFixed(2) : null;

                                return (
                                  <div
                                    key={row.company}
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
                                        Close:{" "}
                                        <span className="text-gray-300 font-medium">
                                          {currentPrice?.toFixed(2)}
                                        </span>
                                      </span>
                                      <span className="text-green-400">
                                        ≤20% Zone:{" "}
                                        <span className="font-medium">
                                          {buyZone?.toFixed(2)}
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
                                      <span className="text-blue-400 text-[10px] sm:text-xs">
                                        MA20:{" "}
                                        <span className="text-blue-300 font-medium">
                                          {formattedMA20 ?? "-"}
                                        </span>
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] sm:text-xs mt-0.5">
                                      {formattedRSI !== null ? (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-400">
                                          RSI: -
                                        </span>
                                      )}
                                      <span className="text-purple-400">
                                        Pivot:{" "}
                                        <span className="text-purple-300 font-medium">
                                          {formattedPivot ?? "-"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* BUY (HIGH RSI) - New Section */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-0 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                        onClick={toggleHighRSI}
                      >
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        <h3 className="font-semibold text-orange-400 text-[10px] sm:text-sm">
                          ⚡ Buy (High RSI)
                        </h3>
                        {highRSIBuyList.length > 0 && (
                          <span className="text-[10px] sm:text-xs bg-orange-900 text-orange-300 px-1.5 py-0.5 rounded-full">
                            {highRSIBuyList.length}
                          </span>
                        )}
                        <span className="ml-auto text-gray-500 text-[10px] sm:text-xs">
                          {showHighRSI ? "▼" : "▶"}
                        </span>
                      </div>
                      <p className="text-[8px] sm:text-xs text-orange-400 mb-2 ml-1">
                        All criteria matched but High RSI - High Risk
                      </p>

                      {showHighRSI && (
                        <>
                          {highRSIBuyList.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                              <p className="text-gray-500 text-[10px] sm:text-xs">
                                No high RSI buy signals
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {highRSIBuyList.map((row) =>
                                renderBuyCard(
                                  row,
                                  row.isHighlighted,
                                  "Buy (High RSI)",
                                  "bg-orange-950/20",
                                  "border-orange-800/50",
                                  "text-orange-200",
                                  "text-orange-300",
                                ),
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* BUY (NEAR PIVOT) - New Section */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-0 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                        onClick={toggleNearPivot}
                      >
                        <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                        <h3 className="font-semibold text-cyan-400 text-[10px] sm:text-sm">
                          📌 Buy (Near Pivot)
                        </h3>
                        {nearPivotBuyList.length > 0 && (
                          <span className="text-[10px] sm:text-xs bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded-full">
                            {nearPivotBuyList.length}
                          </span>
                        )}
                        <span className="ml-auto text-gray-500 text-[10px] sm:text-xs">
                          {showNearPivot ? "▼" : "▶"}
                        </span>
                      </div>
                      <p className="text-[7px] sm:text-xs text-cyan-300 mb-2 ml-1">
                        All criteria matched but Price Near Pivot Level
                      </p>

                      {showNearPivot && (
                        <>
                          {nearPivotBuyList.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                              <p className="text-gray-500 text-[10px] sm:text-xs">
                                No near pivot buy signals
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {nearPivotBuyList.map((row) =>
                                renderBuyCard(
                                  row,
                                  row.isHighlighted,
                                  "Buy (Near Pivot)",
                                  "bg-cyan-900/20",
                                  "border-cyan-800/50",
                                  "text-cyan-200",
                                  "text-cyan-300",
                                ),
                              )}
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

                  {redSaleList.length === 0 &&
                  greenSaleList.length === 0 &&
                  remainingSaleList.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                      <p className="text-gray-500 text-[10px] sm:text-xs">
                        No sale signals
                      </p>
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
                              const isRSIOverbought =
                                rsi14 !== null && rsi14 > 70;
                              const ma20 = zoneRow ? getMA20(zoneRow) : null;
                              const formattedMA20 =
                                ma20 !== null ? ma20.toFixed(2) : null;
                              const pivot = zoneRow ? getPivot(zoneRow) : null;
                              const formattedPivot =
                                pivot !== null ? pivot.toFixed(2) : null;

                              return (
                                <div
                                  key={idx}
                                  className="bg-red-950/20 border border-red-800/50 rounded-lg p-1.5 sm:p-2"
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
                                      <span className="text-blue-600 font-medium text-[10px] sm:text-sm">
                                        Buy Price:
                                      </span>
                                      <span className="text-blue-600 font-semibold text-[15px] sm:text-base">
                                        {row.avgBuyPriceWithCommission.toFixed(
                                          2,
                                        )}  
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Session Close:
                                      </span>
                                      <span className="text-red-500 font-medium text-[15px]">
                                        {row.sessionPrice.toFixed(2)}
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
                                      <span className="text-red-500">
                                        Stop Loss:
                                      </span>
                                      <span className="text-red-500 font-medium text-[15px]">
                                        {row.exitFloorPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-yellow-400">
                                        Vol. Ratio:{" "}
                                        <span className="text-yellow-300 font-medium">
                                          {formattedRatio ?? "-"}
                                        </span>
                                      </span>
                                      <span className="text-blue-400">
                                        MA20:{" "}
                                        <span className="text-blue-300 font-medium">
                                          {formattedMA20 ?? "-"}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                      {formattedRSI !== null ? (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-400">
                                          RSI: -
                                        </span>
                                      )}
                                      <span className="text-purple-400">
                                        Pivot:{" "}
                                        <span className="text-purple-300 font-medium">
                                          {formattedPivot ?? "-"}
                                        </span>
                                      </span>
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
                              const isRSIOverbought =
                                rsi14 !== null && rsi14 > 70;
                              const ma20 = zoneRow ? getMA20(zoneRow) : null;
                              const formattedMA20 =
                                ma20 !== null ? ma20.toFixed(2) : null;
                              const pivot = zoneRow ? getPivot(zoneRow) : null;
                              const formattedPivot =
                                pivot !== null ? pivot.toFixed(2) : null;

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
                                        {row.avgBuyPriceWithCommission.toFixed(
                                          2,
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">
                                        Session Close:
                                      </span>
                                      <span className="text-green-400 font-medium text-[15px]">
                                        {row.sessionPrice.toFixed(2)}
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
                                        {row.targetPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-yellow-400">
                                        Vol. Ratio:{" "}
                                        <span className="text-yellow-300 font-medium">
                                          {formattedRatio ?? "-"}
                                        </span>
                                      </span>
                                      <span className="text-blue-400">
                                        MA20:{" "}
                                        <span className="text-blue-300 font-medium">
                                          {formattedMA20 ?? "-"}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                      {formattedRSI !== null ? (
                                        <span
                                          className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                        >
                                          RSI: {formattedRSI}
                                          {isRSIOverbought && " ⚠️"}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-400">
                                          RSI: -
                                        </span>
                                      )}
                                      <span className="text-purple-400">
                                        Pivot:{" "}
                                        <span className="text-purple-300 font-medium">
                                          {formattedPivot ?? "-"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Remaining Holdings Section */}
                      {remainingSaleList.length > 0 && (
                        <div className="mt-3">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/30 p-1 rounded-lg transition-colors"
                            onClick={toggleRemainingSales}
                          >
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-200 text-[9px] sm:text-xs md:text-sm">
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
                                const zoneRow = buyRows.find(
                                  (r) => r.company === row.company,
                                );
                                const volumeRatio = zoneRow
                                  ? getVolumeRatio(zoneRow)
                                  : null;
                                const formattedRatio =
                                  formatVolumeRatio(volumeRatio);
                                const rsi14 = zoneRow
                                  ? getRSI14(zoneRow)
                                  : null;
                                const formattedRSI =
                                  rsi14 !== null ? rsi14.toFixed(2) : null;
                                const isRSIOverbought =
                                  rsi14 !== null && rsi14 > 70;
                                const ma20 = zoneRow ? getMA20(zoneRow) : null;
                                const formattedMA20 =
                                  ma20 !== null ? ma20.toFixed(2) : null;
                                const pivot = zoneRow
                                  ? getPivot(zoneRow)
                                  : null;
                                const formattedPivot =
                                  pivot !== null ? pivot.toFixed(2) : null;

                                const profitLossPercent =
                                  ((row.sessionPrice -
                                    row.avgBuyPriceWithCommission) /
                                    row.avgBuyPriceWithCommission) *
                                  100;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-blue-950/20 border border-blue-800/50 rounded-lg p-1.5 sm:p-2 hover:bg-blue-900/30 transition-colors"
                                  >
                                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                                      <span className="font-semibold text-blue-300 text-[10px] sm:text-sm truncate flex-1">
                                        {row.company}
                                      </span>
                                      <span
                                        className={`text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                                          profitLossPercent >= 0
                                            ? "bg-green-800 text-green-300"
                                            : "bg-red-800 text-red-300"
                                        }`}
                                      >
                                        {profitLossPercent.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-blue-600 font-medium text-[10px] sm:text-sm   ">
                                          Buy Price:
                                        </span>
                                        <span className="text-blue-600 font-semibold text-[15px] sm:text-base">
                                          {row.avgBuyPriceWithCommission.toFixed(
                                            2,
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">
                                          Session Close:
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            profitLossPercent >= 0
                                              ? "text-green-500 text-[15px]"
                                              : "text-red-500 text-[15px]"
                                          }`}
                                        >
                                          {row.sessionPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">
                                          Quantity:
                                        </span>
                                        <span className="text-gray-300">
                                          {row.remainQtn.toLocaleString()}{" "}
                                          shares
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-red-500">
                                          Stop Loss:
                                        </span>
                                        <span className="text-red-500 font-medium text-[15px]">
                                          {row.exitFloorPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">
                                          Target:
                                        </span>
                                        <span className="text-green-400 font-medium">
                                          {row.targetPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-yellow-400">
                                          Vol. Ratio:{" "}
                                          <span className="text-yellow-300 font-medium">
                                            {formattedRatio ?? "-"}
                                          </span>
                                        </span>
                                        <span className="text-blue-400">
                                          MA20:{" "}
                                          <span className="text-blue-300 font-medium">
                                            {formattedMA20 ?? "-"}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                        {formattedRSI !== null ? (
                                          <span
                                            className={`${isRSIOverbought ? "text-rose-500 font-bold" : "text-yellow-400"}`}
                                          >
                                            RSI: {formattedRSI}
                                            {isRSIOverbought && " ⚠️"}
                                          </span>
                                        ) : (
                                          <span className="text-yellow-400">
                                            RSI: -
                                          </span>
                                        )}
                                        <span className="text-purple-400">
                                          Pivot:{" "}
                                          <span className="text-purple-300 font-medium">
                                            {formattedPivot ?? "-"}
                                          </span>
                                        </span>
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
