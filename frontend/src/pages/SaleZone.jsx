import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const SaleZone = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let userId = null;
        const authStr = localStorage.getItem("auth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          userId = auth?.id || null;
        }

        if (userId) {
          const [buyResponse, saleResponse, zoneResponse] = await Promise.all([
            api.get(`/buy/${userId}`).catch(() => ({ data: [] })),
            api.get(`/sale/${userId}`).catch(() => ({ data: [] })),
            api.get("/zone").catch(() => ({ data: [] })),
          ]);

          const rawBuys = buyResponse.data?.data || buyResponse.data || [];
          const rawSales = saleResponse.data?.data || saleResponse.data || [];
          const rawZones = zoneResponse.data?.data || zoneResponse.data || [];

          // Create a map of company -> session close from zone data (EXACTLY like Buy Zone)
          const zoneMap = new Map();
          rawZones.forEach((z) => {
            const company = (
              z.company ??
              z.companyName ??
              z.stockName ??
              z.symbol ??
              z.ticker ??
              ""
            )
              .trim()
              .toUpperCase();
            
            if (company) {
              // Get session close - same logic as Buy Zone
              const sessionClose = Number(
                z.closingPrice ??
                z.close ??
                z.sessionClose ??
                z.price ??
                null
              );
              
              zoneMap.set(company, {
                sessionClose: !isNaN(sessionClose) ? sessionClose : null,
                // Also store other zone data if needed for future
                sessionLow: z.todaysLow ?? z.sessionLow ?? z.low ?? null,
                sessionHigh: z.todaysHigh ?? z.sessionHigh ?? z.high ?? null,
              });
            }
          });

          // 1. Map raw trade rows and clean strings
          const normalized = rawBuys.map((item) => {
            const company = (
              item.stockName ||
              item.company ||
              item.companyName ||
              item.Company ||
              item.symbol ||
              ""
            )
              .trim()
              .toUpperCase();

            const qty = Number(
              item.quantity ?? item.buyQuantity ?? item.BuyTotalQtn ?? 0,
            );

            const price = Number(
              item.sharePrice ?? item.buyPerShareValue ?? item.price ?? 0,
            );

            // Get session close from zone map (just like Buy Zone uses row.closingPrice)
            const zoneData = zoneMap.get(company);
            const closingPrice = zoneData?.sessionClose ?? null;

            const slPercent = Number(item.stopLossPercent ?? 3);
            const tpPercent = Number(item.targetProfitPercent ?? 10);

            return {
              company,
              qty,
              price,
              closingPrice, // Now from zone data, not from buy record
              slPercent,
              tpPercent,
              type: "buy",
            };
          });

          // Process sale records
          const normalizedSales = rawSales.map((item) => {
            const company = (
              item.stockName ||
              item.company ||
              item.companyName ||
              item.Company ||
              item.symbol ||
              ""
            )
              .trim()
              .toUpperCase();

            const qty = Number(
              item.quantity ?? item.saleQuantity ?? item.saleTotalQtn ?? 0,
            );

            return {
              company,
              qty,
              type: "sale",
              closingPrice: null,
            };
          });

          const allNormalized = [...normalized, ...normalizedSales];

          // 2. Aggregate raw items
          const aggregatedMap = new Map();

          allNormalized.forEach((trade) => {
            if (!trade.company) return;
            const key = trade.company;

            if (!aggregatedMap.has(key)) {
              aggregatedMap.set(key, {
                company: trade.company,
                totalBuyQty: trade.type === "buy" ? trade.qty : 0,
                totalSaleQty: trade.type === "sale" ? trade.qty : 0,
                totalValue: trade.type === "buy" ? trade.price * trade.qty : 0,
                totalCommission:
                  trade.type === "buy" ? trade.price * trade.qty * 0.004 : 0,
                weightedSlPercentSum:
                  trade.type === "buy" && trade.slPercent !== undefined
                    ? trade.slPercent * trade.qty
                    : 0,
                weightedTpPercentSum:
                  trade.type === "buy" && trade.tpPercent !== undefined
                    ? trade.tpPercent * trade.qty
                    : 0,
                // Store closing price from zone
                closingPrice: trade.type === "buy" ? trade.closingPrice : null,
              });
            } else {
              const existing = aggregatedMap.get(key);
              if (trade.type === "buy") {
                existing.totalBuyQty += trade.qty;
                existing.totalValue += trade.price * trade.qty;
                existing.totalCommission += trade.price * trade.qty * 0.004;
                existing.weightedSlPercentSum += trade.slPercent * trade.qty;
                existing.weightedTpPercentSum += trade.tpPercent * trade.qty;
                // Keep the closing price from zone
                if (existing.closingPrice === null && trade.closingPrice !== null) {
                  existing.closingPrice = trade.closingPrice;
                }
              } else {
                existing.totalSaleQty += trade.qty;
              }
            }
          });

          // 3. Calculate final trades
          const finalMergedTrades = Array.from(aggregatedMap.values()).map(
            (agg) => {
              const totalBuyQty = agg.totalBuyQty;
              const totalSaleQty = agg.totalSaleQty;
              const remainQty = totalBuyQty - totalSaleQty;

              const totalValue = agg.totalValue;
              const totalCommission = Number(agg.totalCommission.toFixed(2));
              const buyNetValue = Number(
                (totalValue + totalCommission).toFixed(2),
              );

              const avgBasePrice =
                totalBuyQty > 0 ? totalValue / totalBuyQty : 0;
              const priceWithCommission =
                totalBuyQty > 0 ? buyNetValue / totalBuyQty : 0;

              const avgSlPercent =
                totalBuyQty > 0 ? agg.weightedSlPercentSum / totalBuyQty : 3;
              const avgTpPercent =
                totalBuyQty > 0 ? agg.weightedTpPercentSum / totalBuyQty : 10;

              const slPrice = priceWithCommission * (1 - avgSlPercent / 100);
              const tpPrice = priceWithCommission * (1 + avgTpPercent / 100);
              const totalLoss = (priceWithCommission - slPrice) * remainQty;

              return {
                company: agg.company,
                qty: totalBuyQty,
                remainQty: remainQty,
                price: avgBasePrice,
                closingPrice: agg.closingPrice, // From zone data
                slPercent: avgSlPercent,
                slPrice,
                totalLoss,
                tpPercent: avgTpPercent,
                tpPrice,
                priceWithCommission: priceWithCommission,
              };
            },
          );

          setTrades(finalMergedTrades);
        }
      } catch (err) {
        console.error("Error cross-referencing session matrices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-row items-center justify-between gap-4 mb-4 border-b border-gray-900 pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Sale Zone
            </h1>
            <p className="mt-0.5 text-[0.7rem] font-semibold tracking-wide bg-linear-to-r from-red-400 via-gray-300 to-emerald-400 bg-clip-text text-transparent inline-block">
              Red = Loss Sale | Green = Profit Sale | White = Middle Range (Active Only)
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-400 py-20 text-sm">
            Loading trading profiles...
          </p>
        ) : trades.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No active trades available for analysis.
          </div>
        ) : (
          <div className="overflow-auto max-h-[75vh] rounded-xl border border-gray-800">
            <table className="w-full text-[0.65rem] text-center border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-300 font-semibold uppercase tracking-wider">
                  <th
                    className="sticky left-0 z-20 bg-gray-900 p-1.5 border-r border-gray-800 text-left pl-2 min-w-100px"
                    style={{ backgroundColor: "#111827" }}
                  >
                    Company Name
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-indigo-950/30 text-indigo-300 min-w-80px">
                    Buy (Total Qtn)
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-indigo-950/30 text-purple-300 min-w-80px">
                    Remain Qtn
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-sky-950/30 text-sky-300 min-w-100px">
                    Buy Per Share + Commission
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-sky-950/40 text-teal-300 min-w-80px">
                    Session Close
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-red-950/40 text-red-400 min-w-70px">
                    Stop Loss %
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-red-950/40 text-red-400 min-w-90px">
                    Exit Floor Price
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-red-950/40 text-red-400 min-w-90px">
                    Max Risk Capital
                  </th>
                  <th className="p-1.5 border-r border-gray-800 bg-emerald-950/40 text-emerald-300 min-w-70px">
                    Target %
                  </th>
                  <th className="p-1.5 bg-emerald-950/40 text-emerald-300 min-w-90px">
                    Target Price
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {trades.map((t) => {
                  let companyColorClass = "text-white";

                  // Determine row/company color based on session close vs SL/TP
                  if (t.remainQty > 0 && t.closingPrice !== null && !isNaN(t.closingPrice)) {
                    if (t.closingPrice <= t.slPrice) {
                      companyColorClass = "text-red-500 font-black";
                    } else if (t.closingPrice >= t.tpPrice) {
                      companyColorClass = "text-emerald-400 font-black";
                    }
                  }

                  const stickyBg = t.remainQty > 0 && t.closingPrice !== null && !isNaN(t.closingPrice)
                    ? (t.closingPrice <= t.slPrice ? "bg-red-950/20" :
                       (t.closingPrice >= t.tpPrice ? "bg-emerald-950/20" : "bg-gray-900/30"))
                    : "bg-gray-900/30";

                  return (
                    <tr
                      key={t.company}
                      className="hover:bg-gray-900/50 transition-colors"
                    >
                      <td
                        className={`sticky left-0 z-10 p-1.5 border-r border-gray-800 text-left pl-2 font-bold tracking-wide ${companyColorClass} ${stickyBg}`}
                        style={{ backgroundColor: "inherit" }}
                      >
                        {t.company || "-"}
                      </td>
                      <td className="p-1.5 bg-indigo-950/10 border-r border-gray-800 text-indigo-400 font-mono font-bold">
                        {t.qty}
                      </td>
                      <td className="p-1.5 bg-indigo-950/10 border-r border-gray-800 text-purple-400 font-mono font-bold">
                        {t.remainQty}
                      </td>
                      <td className="p-1.5 bg-sky-950/10 border-r border-gray-800 text-sky-400 font-mono font-bold">
                        {formatCurrency(t.priceWithCommission)}
                      </td>
                      <td className="p-1.5 border-r border-gray-800 text-teal-400 font-bold bg-teal-950/10 font-mono">
                        {t.closingPrice !== null && !isNaN(t.closingPrice)
                          ? formatCurrency(t.closingPrice)
                          : "-"}
                      </td>
                      <td className="p-1.5 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold font-mono">
                        {t.slPercent.toFixed(1)}%
                      </td>
                      <td className="p-1.5 bg-red-950/10 border-r border-gray-800 text-red-500 font-bold font-mono">
                        {formatCurrency(t.slPrice)}
                      </td>
                      <td className="p-1.5 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold font-mono">
                        {formatCurrency(t.totalLoss)}
                      </td>
                      <td className="p-1.5 bg-emerald-950/10 border-r border-gray-800 text-emerald-400 font-semibold font-mono">
                        {t.tpPercent.toFixed(1)}%
                      </td>
                      <td className="p-1.5 bg-emerald-950/10 text-emerald-400 font-bold font-mono">
                        {formatCurrency(t.tpPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleZone;