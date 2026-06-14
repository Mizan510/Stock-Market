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

          const rawTrades = rawBuys;

          // 1. Map raw trade rows and clean strings
          const normalized = rawTrades.map((item) => {
            const date =
              item.date ||
              item.buyDate ||
              item.createdAt ||
              item.updatedAt ||
              item.Date ||
              item.tradeDate ||
              "";

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

            const tradeCompanyClean = company.toLowerCase();
            const matchedZone = rawZones.find((z) => {
              const zoneCompanyClean = (
                z.company ??
                z.companyName ??
                z.stockName ??
                z.symbol ??
                z.ticker ??
                ""
              )
                .trim()
                .toLowerCase();

              if (!zoneCompanyClean || !tradeCompanyClean) return false;
              return (
                zoneCompanyClean === tradeCompanyClean ||
                zoneCompanyClean.includes(tradeCompanyClean) ||
                tradeCompanyClean.includes(zoneCompanyClean)
              );
            });

            const rawClosingPrice = matchedZone
              ? (matchedZone.closingPrice ??
                matchedZone.close ??
                matchedZone.sessionClose ??
                matchedZone.price)
              : (item.closingPrice ?? item.close ?? item.sessionClose);

            const closingPrice =
              rawClosingPrice !== undefined && rawClosingPrice !== null
                ? Number(rawClosingPrice)
                : null;

            const slPercent = Number(item.stopLossPercent ?? 3);
            const tpPercent = Number(item.targetProfitPercent ?? 10);

            return {
              date,
              company,
              qty,
              price,
              closingPrice,
              slPercent,
              tpPercent,
              type: "buy",
            };
          });

          // Process sale records with same normalization
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

            const price = Number(
              item.perShareValue ?? item.salePerShareValue ?? item.price ?? 0,
            );

            return {
              company,
              qty,
              price,
              type: "sale",
              closingPrice: null, // Explicitly safe-guard against undefined values
            };
          });

          // Combine normalized data for aggregation
          const allNormalized = [...normalized, ...normalizedSales];

          // 2. Aggregate raw items - track buy and sale quantities separately
          const aggregatedMap = new Map();

          allNormalized.forEach((trade) => {
            if (!trade.company) return;
            const key = trade.company;

            // Strict verification step to ensure closing price mathematical operations only happen on valid items
            const hasValidClosingPrice = trade.type === "buy" && trade.closingPrice !== null && trade.closingPrice !== undefined;

            if (!aggregatedMap.has(key)) {
              aggregatedMap.set(key, {
                company: trade.company,
                totalBuyQty: trade.type === "buy" ? trade.qty : 0,
                totalSaleQty: trade.type === "sale" ? trade.qty : 0,
                totalValue: trade.type === "buy" ? trade.price * trade.qty : 0,
                totalCommission:
                  trade.type === "buy" ? trade.price * trade.qty * 0.004 : 0,
                weightedClosingPriceSum: hasValidClosingPrice ? trade.closingPrice * trade.qty : 0,
                closingPriceQtyCount: hasValidClosingPrice ? trade.qty : 0,
                weightedSlPercentSum:
                  trade.type === "buy" && trade.slPercent !== undefined
                    ? trade.slPercent * trade.qty
                    : 0,
                weightedTpPercentSum:
                  trade.type === "buy" && trade.tpPercent !== undefined
                    ? trade.tpPercent * trade.qty
                    : 0,
              });
            } else {
              const existing = aggregatedMap.get(key);
              if (trade.type === "buy") {
                existing.totalBuyQty += trade.qty;
                existing.totalValue += trade.price * trade.qty;
                existing.totalCommission += trade.price * trade.qty * 0.004;
                existing.weightedSlPercentSum += trade.slPercent * trade.qty;
                existing.weightedTpPercentSum += trade.tpPercent * trade.qty;
                
                // Track closing price numbers strictly inside the buy action sequence
                if (trade.closingPrice !== null && trade.closingPrice !== undefined) {
                  existing.weightedClosingPriceSum += trade.closingPrice * trade.qty;
                  existing.closingPriceQtyCount += trade.qty;
                }
              } else {
                existing.totalSaleQty += trade.qty;
              }
            }
          });

          // 3. Sequential Calculation Pipeline
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

              // CALCULATIONS DRIVEN BY priceWithCommission
              const slPrice = priceWithCommission * (1 - avgSlPercent / 100);
              const tpPrice = priceWithCommission * (1 + avgTpPercent / 100);
              
              // Updated to prioritize risk metrics calculated against actual remaining inventory
              const totalLoss = (priceWithCommission - slPrice) * remainQty;

              const closingPrice =
                agg.closingPriceQtyCount > 0
                  ? agg.weightedClosingPriceSum / agg.closingPriceQtyCount
                  : null;

              return {
                company: agg.company,
                qty: totalBuyQty,
                remainQty: remainQty,
                price: avgBasePrice,
                closingPrice,
                slPercent: avgSlPercent,
                slPrice,
                totalLoss,
                tpPercent: avgTpPercent,
                tpPrice,
                totalValueWithCommission: buyNetValue,
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
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6 border-b border-gray-900 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sale Zone
            </h1>
            <p className="mt-1 text-sm font-semibold tracking-wide bg-linear-to-r from-red-400 via-gray-300 to-emerald-400 bg-clip-text text-transparent inline-block">
              Red = Loss Sale | Green = Profit Sale | White = Middle Range (Active Only)
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-400 py-20 text-base">
            Loading trading profiles...
          </p>
        ) : trades.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No active trades available for analysis.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-300 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-3 border-r border-gray-800 text-left pl-4">
                    Company Name
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-indigo-950/30 text-indigo-300">
                    Buy (Total Qtn)
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-indigo-950/30 text-indigo-300">
                    Buy (Total Value with commission)
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-indigo-950/30 text-purple-300">
                    Remain Qtn
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-sky-950/30 text-sky-300">
                    Buy Per Share + Commission
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-sky-950/40 text-teal-300">
                    Session Close
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-red-950/40 text-red-400">
                    Stop Loss %
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-red-950/40 text-red-400">
                    Exit Floor Price
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-red-950/40 text-red-400">
                    Max Risk Capital
                  </th>
                  <th className="p-3 border-r border-gray-800 bg-emerald-950/40 text-emerald-300">
                    Target %
                  </th>
                  <th className="p-3 bg-emerald-950/40 text-emerald-300">
                    Target Price
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {trades.map((t) => {
                  let companyColorClass = "text-white bg-gray-900/30";

                  // NEW LOGIC: Only change color if there are items left in inventory
                  if (t.remainQty > 0 && t.closingPrice !== null) {
                    if (t.closingPrice <= t.slPrice) {
                      companyColorClass = "text-red-500 font-black bg-red-950/20";
                    } else if (t.closingPrice >= t.tpPrice) {
                      companyColorClass = "text-emerald-400 font-black bg-emerald-950/20";
                    }
                  }

                  return (
                    <tr
                      key={t.company}
                      className="hover:bg-gray-900/50 transition-colors"
                    >
                      <td
                        className={`p-3 border-r border-gray-800 text-left pl-4 font-bold tracking-wide ${companyColorClass}`}
                      >
                        {t.company || "-"}
                      </td>
                      <td className="p-3 bg-indigo-950/10 border-r border-gray-800 text-indigo-400 font-mono font-bold text-base">
                        {t.qty}
                      </td>
                      <td className="p-3 bg-indigo-950/10 border-r border-gray-800 text-indigo-400 font-mono font-bold text-base">
                        {formatCurrency(t.totalValueWithCommission)}
                      </td>
                      <td className="p-3 bg-indigo-950/10 border-r border-gray-800 text-purple-400 font-mono font-bold text-base">
                        {t.remainQty}
                      </td>
                      <td className="p-3 bg-sky-950/10 border-r border-gray-800 text-sky-400 font-mono font-bold text-base">
                        {formatCurrency(t.priceWithCommission)}
                      </td>
                      <td className="p-3 border-r border-gray-800 text-teal-400 font-bold bg-teal-950/10 text-base font-mono">
                        {t.closingPrice !== null
                          ? formatCurrency(t.closingPrice)
                          : "-"}
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold font-mono">
                        {t.slPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-500 font-bold text-base font-mono">
                        {formatCurrency(t.slPrice)}
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold font-mono">
                        {formatCurrency(t.totalLoss)}
                      </td>
                      <td className="p-3 bg-emerald-950/10 border-r border-gray-800 text-emerald-400 font-semibold font-mono">
                        {t.tpPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 bg-emerald-950/10 text-emerald-400 font-bold text-base font-mono">
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