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

const formatDateValue = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .replace(/ /g, "-");
  }
  return dateValue;
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
          // Fetch both user purchase data and live zone pricing metrics collectively
          const [buyResponse, zoneResponse] = await Promise.all([
            api.get(`/buy/${userId}`).catch(() => ({ data: [] })),
            api.get("/zone").catch(() => ({ data: [] }))
          ]);

          const rawTrades = buyResponse.data?.data || buyResponse.data || [];
          const rawZones = zoneResponse.data?.data || zoneResponse.data || [];

          const normalized = rawTrades.map((item) => {
            const date =
              item.date ||
              item.buyDate ||
              item.createdAt ||
              item.updatedAt ||
              item.Date ||
              item.tradeDate ||
              "";

            const company =
              item.stockName ||
              item.company ||
              item.companyName ||
              item.Company ||
              "";

            const qty = Number(
              item.quantity ?? item.buyQuantity ?? item.BuyTotalQtn ?? 0,
            );

            const price = Number(
              item.sharePrice ?? item.buyPerShareValue ?? item.price ?? 0,
            );

            // Cross-reference up-to-date data properties inside the zone dataset arrays
            const matchedZone = rawZones.find(
              (z) => z.company?.trim().toLowerCase() === company?.trim().toLowerCase()
            );

            // Access the true stored document variable cleanly
            const rawClosingPrice = matchedZone
              ? (matchedZone.closingPrice ?? matchedZone.close ?? matchedZone.sessionClose)
              : (item.closingPrice ?? item.close ?? item.sessionClose);

            const closingPrice = rawClosingPrice !== undefined && rawClosingPrice !== null 
              ? Number(rawClosingPrice) 
              : null;

            const priceWithCommission = price * 1.004;

            const slPercent = Number(item.stopLossPercent ?? 3);
            const tpPercent = Number(item.targetProfitPercent ?? 10);

            const slPrice = priceWithCommission * (1 - slPercent / 100);
            const tpPrice = priceWithCommission * (1 + tpPercent / 100);

            const totalLoss = (priceWithCommission - slPrice) * qty;

            return {
              date,
              company,
              qty,
              price,
              closingPrice,
              priceWithCommission,
              slPercent,
              slPrice,
              totalLoss,
              tpPercent,
              tpPrice,
            };
          });

          setTrades(normalized);
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
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sale Zone Analysis
            </h1>
            <p className="mt-1 text-lg font-semibold tracking-wide bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent inline-block">
              Risk Management & Automated Target Matrices
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-700 hover:bg-gray-600 transition px-4 py-2 rounded-lg text-sm font-medium border border-gray-600"
            >
              Back
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-400 py-20 text-base">Loading trading profiles...</p>
        ) : trades.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No active trades available for analysis.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-gray-800">
                  <th className="p-3 border-r border-gray-800" colSpan="2">Asset Info</th>
                  <th className="p-3 border-r border-gray-800" colSpan="4">Entry Metrics</th>
                  <th className="p-3 border-r border-gray-800" colSpan="3">Risk Mitigation</th>
                  <th className="p-3" colSpan="2">Profit Targets</th>
                </tr>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-300 font-semibold">
                  <th className="p-3 border-r border-gray-800">Date</th>
                  <th className="p-3 border-r border-gray-800">Company</th>
                  <th className="p-2 border-r border-gray-800 bg-sky-950/40 text-sky-300">Buy Qtn</th>
                  <th className="p-2 border-r border-gray-800 bg-sky-950/40 text-sky-300">Base Price</th>
                  <th className="p-2 border-r border-gray-800 bg-sky-950/40 text-teal-300">Session Close</th>
                  <th className="p-2 border-r border-gray-800 bg-blue-950/40 text-blue-300">With Comm. (0.4%)</th>
                  <th className="p-2 border-r border-gray-800 bg-red-950/40 text-red-400">Stop Loss %</th>
                  <th className="p-2 border-r border-gray-800 bg-red-950/40 text-red-400">Exit Floor Price</th>
                  <th className="p-2 border-r border-gray-800 bg-red-950/40 text-red-400">Max Risk Capital</th>
                  <th className="p-2 border-r border-gray-800 bg-emerald-950/40 text-emerald-300">Target %</th>
                  <th className="p-2 bg-emerald-950/40 text-emerald-300">Target Price</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {trades.map((t, i) => {
                  return (
                    <tr key={i} className="hover:bg-gray-900/50 transition-colors">
                      <td className="p-3 bg-gray-900/30 border-r border-gray-800">
                        {t.date ? formatDateValue(t.date) : "-"}
                      </td>
                      <td className="p-3 bg-gray-900/30 border-r border-gray-800 font-bold tracking-wide">
                        {t.company || "-"}
                      </td>
                      <td className="p-3 bg-sky-950/10 border-r border-gray-800 text-sky-300 font-semibold">
                        {t.qty}
                      </td>
                      <td className="p-3 bg-sky-950/10 border-r border-gray-800 text-sky-300 font-semibold">
                        {formatCurrency(t.price)}
                      </td>
                    <td className="p-3 border-r border-gray-800 text-teal-400 font-bold bg-teal-950/10">
  {t.closingPrice !== null ? formatCurrency(t.closingPrice) : "-"}
</td>
                      <td className="p-3 bg-blue-950/10 border-r border-gray-800 text-blue-400 font-semibold">
                        {formatCurrency(t.priceWithCommission)}
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold">
                        {t.slPercent}%
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-500 font-bold text-base">
                        {formatCurrency(t.slPrice)}
                      </td>
                      <td className="p-3 bg-red-950/10 border-r border-gray-800 text-red-400 font-semibold">
                        {formatCurrency(t.totalLoss)}
                      </td>
                      <td className="p-3 bg-emerald-950/10 border-r border-gray-800 text-emerald-400 font-semibold">
                        {t.tpPercent}%
                      </td>
                      <td className="p-3 bg-emerald-950/10 text-emerald-400 font-bold text-base">
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