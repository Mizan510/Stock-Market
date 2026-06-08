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

const RiskBenefitAnalysis = () => {
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
          const res = await api
            .get(`/buy/${userId}`)
            .catch(() => ({ data: [] }));
          const raw = res.data?.data || res.data || [];

          const normalized = raw.map((item) => {
            // 🔥 FIX: multiple DB field support
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

            const slPercent = Number(item.stopLossPercent ?? 3);
            const tpPercent = Number(item.targetProfitPercent ?? 20);

            const slPrice = price * (1 - slPercent / 100);
            const tpPrice = price * (1 + tpPercent / 100);

            const totalLoss = (price - slPrice) * qty;

            return {
              date,
              company,

              qty,
              price,

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
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Risk / Benefit Analysis</h1>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-600"
          >
            Back
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-slate-400 py-10">Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="min-w-full text-sm text-left text-slate-200">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3 text-sky-300">Buy Total Qtn</th>
                  <th className="px-4 py-3 text-sky-300">
                    Buy per Share Value
                  </th>
                  <th className="px-4 py-3 text-red-400">Stop Loss (%)</th>
                  <th className="px-4 py-3 text-red-600">
                    Stop Loss Price/Share
                  </th>
                  <th className="px-4 py-3 text-red-400">Total Loss</th>
                  <th className="px-4 py-3 text-emerald-400">
                    Target Profit (%)
                  </th>
                  <th className="px-4 py-3 text-emerald-400">
                    Target Price/Share
                  </th>
                </tr>
              </thead>

              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="px-4 py-3">
                      {t.date ? formatDateValue(t.date) : "-"}
                    </td>

                    <td className="px-4 py-3">{t.company || "-"}</td>

                    <td className="px-4 py-3 text-sky-300 font-semibold">
                      {t.qty}
                    </td>

                    <td className="px-4 py-3 text-sky-300 font-semibold">
                      {formatCurrency(t.price)}
                    </td>

                    <td className="px-4 py-3 text-red-400 font-semibold">
                      {t.slPercent}%
                    </td>

                    <td className="px-4 py-3 text-red-600 font-semibold text-lg">
                      {formatCurrency(t.slPrice)}
                    </td>

                    <td className="px-4 py-3 text-red-400 font-semibold">
                      {formatCurrency(t.totalLoss)}
                    </td>

                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      {t.tpPercent}%
                    </td>

                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      {formatCurrency(t.tpPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskBenefitAnalysis;
