import React, { useEffect, useState } from "react";
import api from "../api";

const BuySalePopup = ({ isOpen, onClose, buyList = [], saleList = [], loading = false }) => {
  const [buyRows, setBuyRows] = useState([]);
  const [saleRows, setSaleRows] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [pivotData, setPivotData] = useState({});

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

  const calculatePivot = (high, low, close) => {
    const highValue = parseNumber(high);
    const lowValue = parseNumber(low);
    const closeValue = parseNumber(close);

    if (
      highValue === undefined ||
      lowValue === undefined ||
      closeValue === undefined
    ) {
      return null;
    }

    return (highValue + lowValue + closeValue) / 3;
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

        // Calculate pivot points for each company
        const pivots = {};
        rawZones.forEach((zone) => {
          const company =
            zone.company || zone.companyName || zone.stockName || "";
          if (company) {
            const pivot = calculatePivot(
              zone.high,
              zone.low,
              zone.closingPrice || zone.sessionClose,
            );
            if (pivot !== null) {
              pivots[company] = pivot;
            }
          }
        });
        setPivotData(pivots);

        const mappedBuyData = rawZones
          .map((row) => ({
            ...row,
            company: row.company || row.companyName || row.stockName || "",
            low: row.low ?? "",
            high: row.high ?? "",
            buyPercent: row.buyPercent ?? 20,
            closingPrice: row.closingPrice ?? row.sessionClose ?? "",
          }))
          .sort((a, b) =>
            a.company.localeCompare(b.company, undefined, {
              sensitivity: "base",
            }),
          );

        setBuyRows(mappedBuyData);

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
              (z) => cleanString(z.company) === companyClean,
            );

            const closingPrice = Number(
              matchedZone?.closingPrice ??
                matchedZone?.close ??
                matchedZone?.sessionClose ??
                0,
            );

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

  // Yearly Low Buy - Show when Current Price is LESS than or equal to 20% Zone
  const yearlyLowBuyList = buyRows.filter((row) => {
    const currentPrice = parseNumber(row.closingPrice);
    const buyZone = calcZone(row.low, row.high, row.buyPercent);
    return (
      currentPrice !== undefined &&
      buyZone !== undefined &&
      currentPrice <= buyZone
    );
  });

  // Pivot Point Buy - Show when Current Price is GREATER than Pivot
  const pivotBuyList = buyRows.filter((row) => {
    const currentPrice = parseNumber(row.closingPrice);
    const pivotValue = pivotData[row.company];
    return (
      currentPrice !== undefined &&
      pivotValue !== undefined &&
      currentPrice > pivotValue
    );
  });

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
              <p className="text-gray-400 text-sm">Loading your portfolio data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content - Side by Side */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex gap-3 min-w-0">
                {/* BUY ZONE - Left Side */}
                <div className="flex-1 w-1/2 min-w-0">
                  <div className="space-y-4">
                    {/* Yearly Low Buy Section - TOP */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-center text-gray-200 text-sm">
                          📉 Yearly Low Buy <br />
                          (≤20% Zone)
                        </h3>
                        {yearlyLowBuyList.length > 0 && (
                          <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full">
                            {yearlyLowBuyList.length}
                          </span>
                        )}
                      </div>

                      {yearlyLowBuyList.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                          <p className="text-gray-500 text-xs">
                            No yearly low buy signals
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {yearlyLowBuyList.map((row, idx) => {
                            const currentPrice = parseNumber(row.closingPrice);
                            const buyZone = calcZone(
                              row.low,
                              row.high,
                              row.buyPercent,
                            );
                            return (
                              <div
                                key={idx}
                                className="bg-green-900/20 border border-green-800/50 rounded-lg p-2 hover:bg-green-900/30 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-green-300 text-xs sm:text-sm truncate flex-1">
                                    {row.company}
                                  </span>
                                  <span className="text-xs bg-green-800 text-green-300 px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                    Buy
                                  </span>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1">
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pivot Point Buy Section - BOTTOM */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-200 text-sm">
                          📊 Pivot Point Buy
                        </h3>
                        {pivotBuyList.length > 0 && (
                          <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded-full">
                            {pivotBuyList.length}
                          </span>
                        )}
                      </div>

                      {pivotBuyList.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                          <p className="text-gray-500 text-xs">
                            No pivot buy signals
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {pivotBuyList.map((row, idx) => {
                            const currentPrice = parseNumber(row.closingPrice);
                            const pivotValue = pivotData[row.company];
                            return (
                              <div
                                key={idx}
                                className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-2 hover:bg-blue-900/30 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-blue-300 text-xs sm:text-sm truncate flex-1">
                                    {row.company}
                                  </span>
                                  <span className="text-xs bg-blue-800 text-blue-300 px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                    Buy
                                  </span>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1">
                                  <span className="text-gray-400">
                                    Current:{" "}
                                    <span className="text-gray-300 font-medium">
                                      ৳{currentPrice?.toFixed(2)}
                                    </span>
                                  </span>
                                  <span className="text-blue-300">
                                    Pivot:{" "}
                                    <span className="font-medium">
                                      ৳{pivotValue?.toFixed(2)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SALE ZONE - Right Side */}
                <div className="flex-1 w-1/2 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-200 text-sm">
                      🔴 Sale Signals
                    </h3>
                    {redSaleList.length + greenSaleList.length > 0 && (
                      <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full">
                        {redSaleList.length + greenSaleList.length}
                      </span>
                    )}
                  </div>

                  {redSaleList.length === 0 && greenSaleList.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                      <p className="text-gray-500 text-xs">No sale signals</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Stop Loss */}
                      {redSaleList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-semibold text-red-400">
                              🚨 Stop Loss (3% Below)
                            </span>
                            <span className="text-xs bg-red-900 text-red-300 px-1 rounded">
                              {redSaleList.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {redSaleList.map((row, idx) => (
                              <div
                                key={idx}
                                className="bg-red-900/20 border border-red-800/50 rounded-lg p-2"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-red-300 text-xs sm:text-sm truncate flex-1">
                                    {row.company}
                                  </span>
                                  <span className="text-xs bg-red-800 text-red-300 px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                    Loss
                                  </span>
                                </div>
                                <div className="space-y-1 text-[10px]">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Buy Price:
                                    </span>
                                    <span className="text-gray-300 font-medium">
                                      ৳
                                      {row.avgBuyPriceWithCommission.toFixed(2)}
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
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target Profit */}
                      {greenSaleList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1 mt-2">
                            <span className="text-xs font-semibold text-green-400">
                              🏆 Target Hit (10% Above)
                            </span>
                            <span className="text-xs bg-green-900 text-green-300 px-1 rounded">
                              {greenSaleList.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {greenSaleList.map((row, idx) => (
                              <div
                                key={idx}
                                className="bg-green-900/20 border border-green-800/50 rounded-lg p-2"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-green-300 text-xs sm:text-sm truncate flex-1">
                                    {row.company}
                                  </span>
                                  <span className="text-xs bg-green-800 text-green-300 px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                    Profit
                                  </span>
                                </div>
                                <div className="space-y-1 text-[10px]">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Buy Price:
                                    </span>
                                    <span className="text-gray-300 font-medium">
                                      ৳
                                      {row.avgBuyPriceWithCommission.toFixed(2)}
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
                                </div>
                              </div>
                            ))}
                          </div>
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
            className="px-10 py-1.5 bg-blue-800 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySalePopup;