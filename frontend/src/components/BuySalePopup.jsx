import React, { useEffect, useState } from "react";
import api from "../api";

const BuySalePopup = ({ isOpen, onClose, buyList, saleList, loading }) => {
  const [buyRows, setBuyRows] = useState([]);
  const [saleRows, setSaleRows] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);

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

        // 🟢 PROCESSING FOR BUY ZONE
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

        // 🔴 PROCESSING FOR SALE ZONE - Aggregate buy and sale data
        // First, aggregate all buy transactions per company
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

        // Then, aggregate all sale transactions per company
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

        // Now create normalized sale data with proper calculations
        const normalizedSaleData = Object.keys(buyAggregation)
          .map((company) => {
            const buyData = buyAggregation[company];
            const saleData = saleAggregation[company] || { totalQty: 0 };

            const totalBuyQty = buyData.totalQty;
            const totalSaleQty = saleData.totalQty;
            const remainQty = totalBuyQty - totalSaleQty;

            // Calculate average buy price with commission
            const avgBuyPriceWithCommission =
              buyData.totalQty > 0
                ? (buyData.totalValue + buyData.totalCommission) /
                  buyData.totalQty
                : 0;

            // Match with zone data for closing price
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

            // Calculate Exit Floor Price (Stop Loss: 3% below buy price with commission)
            const exitFloorPrice = avgBuyPriceWithCommission * (1 - 3 / 100);

            // Calculate Target Price (Profit Target: 10% above buy price with commission)
            const targetPrice = avgBuyPriceWithCommission * (1 + 10 / 100);

            return {
              company,
              remainQtn: remainQty,
              closingPrice,
              exitFloorPrice,
              targetPrice,
              avgBuyPriceWithCommission,
              totalBuyQty,
              totalSaleQty,
            };
          })
          .filter((item) => item.remainQtn > 0) // Only show companies with remaining quantity
          .sort((a, b) =>
            a.company.localeCompare(b.company, undefined, {
              sensitivity: "base",
            }),
          );

        setSaleRows(normalizedSaleData);
      } catch (err) {
        console.error("Popup complex data fetch error:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchAllData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Use provided loading state or local loading state
  const isLoading = loading || localLoading;

  const greenBuyList = buyRows.filter((row) => {
    const closePriceNum = parseNumber(row.closingPrice);
    const buyZone = calcZone(row.low, row.high, row.buyPercent);
    return (
      closePriceNum !== undefined &&
      buyZone !== undefined &&
      closePriceNum <= buyZone
    );
  });

  // 🔴 Rule: remainQtn > 0 && Session Close <= Exit Floor Price (RED)
  const redSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice <= row.exitFloorPrice,
  );

  // 🟢 Rule: remainQtn > 0 && Session Close >= Target Price (GREEN)
  const greenSaleList = saleRows.filter(
    (row) =>
      row.remainQtn > 0 &&
      row.closingPrice > 0 &&
      row.closingPrice >= row.targetPrice,
  );

  return (
    <>
      <style>{`
        @keyframes strongGreenBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
          50% { opacity: 0.3; text-shadow: none; }
        }
        @keyframes strongRoseBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(244, 63, 94, 0.6); }
          50% { opacity: 0.3; text-shadow: none; }
        }
        .animate-strong-green-blink {
          animation: strongGreenBlink 1.2s ease-in-out infinite;
        }
        .animate-strong-rose-blink {
          animation: strongRoseBlink 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-screen bg-gray-950 border-y border-gray-900 rounded-none text-white min-h-[70vh] max-h-[90vh] flex flex-col justify-between shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-500 hover:text-white transition-colors text-base font-bold z-20"
          >
            ✕
          </button>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-1.5 py-6">
              <span className="w-5 h-5 border-2 border-emerald-500 border-r-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-mono tracking-wider">
                Syncing Portfolio Matrices...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 divide-x divide-gray-900 flex-1 overflow-hidden">
                {/* 🟢 LEFT SIDE: BUY ZONE */}
                <div className="p-4 pr-3 bg-emerald-950/10 flex flex-col overflow-hidden">
                  <div className="mb-2 pb-1 border-b border-emerald-600/90">
                    <h2 className="text-xl font-bold text-emerald-400 font-mono tracking-wide flex items-center gap-1.5">
                      <span className="text-xs">🟢</span> Buy Zone
                    </h2>
                    <span className="block text-[12px] font-bold text-emerald-500/90 font-mono tracking-wider mt-0.5 pl-5 uppercase animate-strong-green-blink">
                      Ready for Buy
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {greenBuyList.length === 0 ? (
                      <p className="text-[11px] text-gray-600 italic pl-5">
                        No assets detected in buy zone
                      </p>
                    ) : (
                      <ul className="space-y-1 pl-5 list-disc marker:text-emerald-500 marker:text-[10px]">
                        {greenBuyList.map((row, index) => (
                          <li
                            key={index}
                            className="font-mono text-[14px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors tracking-normal"
                          >
                            {row.company}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* 🔴 RIGHT SIDE: SALE ZONE - Companies fetched from aggregated buy/sale data */}
                <div className="p-4 pl-3 bg-rose-950/20 flex flex-col overflow-hidden gap-3">
                  <div className="mb-2 pb-1 border-b border-rose-600/90">
                    <h2 className="text-xl font-bold text-rose-400 font-mono tracking-wide flex items-center gap-1.5 shrink-0">
                      <span className="text-xs">🔴</span> Sale Zone
                    </h2>
                    <span className="block text-[12px] font-bold text-rose-400/90 font-mono tracking-wider mt-0.5 pl-5 uppercase animate-strong-rose-blink">
                      Ready for Sale
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {/* SUBSECTION 1: Exit Floor Price Reached - RED */}
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/30 border border-red-900/40 px-1.5 py-0.5 rounded mb-1.5 inline-block font-mono">
                        🚨 3% Price Reached
                      </h3>
                      {redSaleList.length === 0 ? (
                        <p className="text-[11px] text-gray-600 italic pl-2">
                          No assets reached stop-loss floor
                        </p>
                      ) : (
                        <ul className="space-y-1 pl-4 list-disc marker:text-red-500 marker:text-[10px]">
                          {redSaleList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-[14px] font-medium text-red-400 hover:text-red-300 transition-colors tracking-normal"
                            >
                              {row.company}
                              {/* ✅ Color Matched: Changed from blue-500 to a cohesive muted red-400/60 */}
                              <div className="text-[10px] text-red-400/60 mt-0.5 font-sans">
                                Close:{" "}
                                <span className="font-mono font-semibold">
                                  {row.closingPrice.toFixed(2)}
                                </span>{" "}
                                ≤ Floor:{" "}
                                <span className="font-mono font-semibold">
                                  {row.exitFloorPrice.toFixed(2)}
                                </span>
                                <br />
                                <span className="text-gray-500 text-[10px]">
                                  Remaining: {row.remainQtn} shares
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* SUBSECTION 2: Target Price Reached - GREEN */}
                    <div>
                      <h3 className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded mb-1.5 inline-block font-mono">
                        🏆 Target Price Reached
                      </h3>
                      {greenSaleList.length === 0 ? (
                        <p className="text-[11px] text-gray-600 italic pl-2">
                          No assets reached profit target
                        </p>
                      ) : (
                        <ul className="space-y-1 pl-4 list-disc marker:text-emerald-400 marker:text-[10px]">
                          {greenSaleList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-[14px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors tracking-normal"
                            >
                              {row.company}
                              {/* ✅ Design Aligned: Muted emerald typography and layout structure perfectly mirrors the red section */}
                              <div className="text-[10px] text-emerald-400/60 mt-0.5 font-sans">
                                Close:{" "}
                                <span className="font-mono font-semibold">
                                  {row.closingPrice.toFixed(2)}
                                </span>{" "}
                                ≥ Target:{" "}
                                <span className="font-mono font-semibold">
                                  {row.targetPrice.toFixed(2)}
                                </span>
                                <br />
                                <span className="text-gray-500 text-[10px]">
                                  Remaining: {row.remainQtn} shares
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center p-3 bg-gray-950/40 backdrop-blur-md border-t border-gray-900/60 shrink-0">
                <button
                  onClick={onClose}
                  className="w-full max-w-xs py-2 px-4 bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white font-mono text-xs font-medium rounded-xl shadow-lg shadow-emerald-950/20 transition-all duration-300 tracking-wide"
                >
                  Dismiss Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BuySalePopup;
