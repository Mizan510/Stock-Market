import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { showAlert, showErrorAlert } from "../utils/sweetAlert";

const BuyZone = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  const parseNumber = (value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  };

  const formatValue = (value) => {
    return value === undefined || value === null ? "" : value;
  };

  const computePivotPoint = (row) => {
    const low = parseNumber(row.todaysLow);
    const high = parseNumber(row.todaysHigh);
    const close = parseNumber(row.closingPrice);

    if (low === undefined || high === undefined || close === undefined) {
      return undefined;
    }

    return parseFloat(((low + high + close) / 3).toFixed(2));
  };

  const computeNextDayPlan = (pivotPoint, row) => {
    const close = parseNumber(row.closingPrice);
    if (pivotPoint === undefined || close === undefined) return "";
    if (pivotPoint < close) return "Bullish";
    if (pivotPoint > close) return "Bearish";
    return "Neutral";
  };

  const calcZone = (low, high, percent) => {
    const lowValue = parseNumber(low);
    const highValue = parseNumber(high);
    const percentValue = parseNumber(percent);
    if (
      lowValue === undefined ||
      highValue === undefined ||
      percentValue === undefined
    )
      return "";
    return lowValue + ((highValue - lowValue) * percentValue) / 100;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/zone");
        setRows(
          (res.data || []).map((row) => ({
            ...row,
            company: row.company || "",
            low: row.low !== undefined && row.low !== null ? row.low : "",
            high: row.high !== undefined && row.high !== null ? row.high : "",
            buyPercent:
              row.buyPercent !== undefined && row.buyPercent !== null
                ? row.buyPercent
                : 20,
            sellPercent:
              row.sellPercent !== undefined && row.sellPercent !== null
                ? row.sellPercent
                : 70,
            todaysHigh:
              row.todaysHigh !== undefined && row.todaysHigh !== null
                ? row.todaysHigh
                : "",
            todaysLow:
              row.todaysLow !== undefined && row.todaysLow !== null
                ? row.todaysLow
                : "",
            closingPrice:
              row.closingPrice !== undefined && row.closingPrice !== null
                ? row.closingPrice
                : "",
            isEditing: false,
          })),
        );
      } catch (err) {
        console.error(err);
        showErrorAlert("Failed to load zones from server.");
      }
    };

    load();
  }, []);

  const handleChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const toggleEdit = (index) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isEditing: !updated[index].isEditing,
      };
      return updated;
    });
  };

  const buildPayload = (row) => {
    const payload = {
      company: row.company ? row.company.trim() : "",
      low: parseNumber(row.low),
      high: parseNumber(row.high),
      buyPercent: parseNumber(row.buyPercent),
      sellPercent: parseNumber(row.sellPercent),
      todaysHigh: parseNumber(row.todaysHigh),
      todaysLow: parseNumber(row.todaysLow),
      closingPrice: parseNumber(row.closingPrice),
    };

    const pivotPoint = computePivotPoint(row);
    if (pivotPoint !== undefined) payload.pivotPoint = pivotPoint;

    return Object.fromEntries(
      Object.entries(payload).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    );
  };

  const saveRow = async (index) => {
    const row = rows[index];
    if (!row.company || !row.company.trim()) {
      showAlert("Company name is required.");
      return;
    }
    const payload = buildPayload(row);
    try {
      const res = row._id
        ? await api.put(`/zone/${row._id}`, payload)
        : await api.post("/zone", payload);

      setRows((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...res.data,
                company: res.data.company || "",
                low:
                  res.data.low !== undefined && res.data.low !== null
                    ? res.data.low
                    : "",
                high:
                  res.data.high !== undefined && res.data.high !== null
                    ? res.data.high
                    : "",
                buyPercent:
                  res.data.buyPercent !== undefined &&
                  res.data.buyPercent !== null
                    ? res.data.buyPercent
                    : "",
                sellPercent:
                  res.data.sellPercent !== undefined &&
                  res.data.sellPercent !== null
                    ? res.data.sellPercent
                    : "",
                todaysHigh:
                  res.data.todaysHigh !== undefined &&
                  res.data.todaysHigh !== null
                    ? res.data.todaysHigh
                    : "",
                todaysLow:
                  res.data.todaysLow !== undefined &&
                  res.data.todaysLow !== null
                    ? res.data.todaysLow
                    : "",
                closingPrice:
                  res.data.closingPrice !== undefined &&
                  res.data.closingPrice !== null
                    ? res.data.closingPrice
                    : "",
                isEditing: false,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);
      showErrorAlert("Failed to save row.");
    }
  };

  const deleteRow = async (index) => {
    const row = rows[index];
    if (row._id) {
      try {
        await api.delete(`/zone/${row._id}`);
        setRows((prev) => prev.filter((_, i) => i !== index));
      } catch (err) {
        console.error(err);
        showErrorAlert("Failed to delete row.");
      }
    } else {
      setRows((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Dynamic Global Style Injection for Strict High-Intensity Blinking */}
      <style>{`
        @keyframes strongBlinkGreen {
          0%, 100% { color: #10b981; opacity: 1; text-shadow: 0 0 10px rgba(16,185,129,0.4); }
          50% { color: transparent; opacity: 0.2; }
        }
        @keyframes strongBlinkRed {
          0%, 100% { color: #f43f5e; opacity: 1; text-shadow: 0 0 10px rgba(244,63,94,0.4); }
          50% { color: transparent; opacity: 0.2; }
        }
      `}</style>

      {/* Header layout aligned for side-by-side distribution */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Buy Zone
          </h1>
          <p className="mt-1 text-lg font-semibold tracking-wide bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block">
            Green = Buy | Red = Sell | White = Middle Range
          </p>
        </div>

        {/* Action Container aligned strictly to the right side */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          No companies available.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              {/* Top Header Grouping */}
              <tr className="bg-blue-950 text-xs font-bold uppercase tracking-wider text-blue-200 border-b border-gray-800">
                <th className="p-3 border-r border-gray-800 sticky left-0 bg-blue-950 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Asset</th>
                <th className="p-3 border-r border-gray-800" colSpan="2">
                  1 Year Range
                </th>
                <th className="p-3 border-r border-gray-800" colSpan="3">
                  Today's Session Data
                </th>
                <th className="p-3 border-r border-gray-800" colSpan="2">
                  Predictive Metrics
                </th>
                <th className="p-3 border-r border-gray-800" colSpan="2">
                  Target Configurations
                </th>
                <th className="p-3 border-r border-gray-800" colSpan="2">
                  Execution Thresholds
                </th>
                <th className="p-3">Operations</th>
              </tr>
              {/* Detailed Multi-Color Subheaders */}
              <tr className="bg-gray-900 border-b border-gray-800 text-gray-300 font-semibold">
                <th className="p-3 border-r border-gray-800 sticky left-0 bg-gray-900 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Company Name</th>
                <th className="p-2 border-r border-gray-800 bg-blue-950/40 text-blue-300">
                  1Y Low
                </th>
                <th className="p-2 border-r border-gray-800 bg-blue-950/40 text-blue-300">
                  1Y High
                </th>
                <th className="p-2 border-r border-gray-800 bg-emerald-950/40 text-emerald-300">
                  Session Low
                </th>
                <th className="p-2 border-r border-gray-800 bg-emerald-950/40 text-emerald-300">
                  Session High
                </th>
                <th className="p-2 border-r border-gray-800 bg-emerald-950/40 text-emerald-300">
                  Session Close
                </th>
                <th className="p-2 border-r border-gray-800 bg-amber-950/40 text-amber-300">
                  Pivot Point
                </th>
                <th className="p-2 border-r border-gray-800 bg-amber-950/40 text-amber-300">
                  Forecast Matrix
                </th>
                <th className="p-2 border-r border-gray-800 bg-purple-950/40 text-purple-300">
                  Buy % Target
                </th>
                <th className="p-2 border-r border-gray-800 bg-purple-950/40 text-purple-300">
                  Sell % Target
                </th>
                <th className="p-2 border-r border-gray-800 bg-orange-950/40 text-orange-300">
                  Buy Action Entry
                </th>
                <th className="p-2 border-r border-gray-800 bg-orange-950/40 text-orange-300">
                  Sell Action Target
                </th>
                <th className="p-2">Action Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row, index) => {
                const pivotPoint = computePivotPoint(row);
                const nextDayPlan = computeNextDayPlan(pivotPoint, row);
                const buyZone = calcZone(row.low, row.high, row.buyPercent);
                const sellZone = calcZone(row.low, row.high, row.sellPercent);
                const closePriceNum = parseNumber(row.closingPrice);

                // Precise inline-styles targeting real-time evaluations
                let inlineBlinkStyle = {};

                if (closePriceNum !== undefined) {
                  if (typeof buyZone === "number" && closePriceNum <= buyZone) {
                    // Less than or equal to Buy Action Entry -> High-Intensity Blinking Green
                    inlineBlinkStyle = {
                      animation: "strongBlinkGreen 1s infinite steps(1, start)",
                      fontWeight: "700",
                    };
                  } else if (
                    typeof sellZone === "number" &&
                    closePriceNum >= sellZone
                  ) {
                    // Greater than or equal to Sell Action Target -> No blink, static Red color with text shadow
                    inlineBlinkStyle = {
                      color: "#f43f5e",
                      textShadow: "0 0 10px rgba(244,63,94,0.4)",
                      fontWeight: "700",
                    };
                  }
                }

                return (
                  <tr
                    key={row._id || index}
                    className="group hover:bg-gray-900/50 transition-colors"
                  >
                    {/* Company (Frozen Column Layout) */}
                    <td className="p-2 bg-gray-950 border-r border-gray-800 font-medium sticky left-0 z-10 group-hover:bg-gray-900 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                      {row.isEditing ? (
                        <input
                          type="text"
                          value={formatValue(row.company)}
                          onChange={(e) =>
                            handleChange(index, "company", e.target.value)
                          }
                          className="w-full max-w-180px bg-gray-800 border border-gray-700 p-1.5 rounded text-center text-sm font-semibold focus:outline-hidden focus:border-blue-500 text-white"
                          placeholder="e.g. AAPL"
                        />
                      ) : (
                        <div
                          style={inlineBlinkStyle}
                          className="py-1.5 px-2 truncate max-w-180px inline-block w-full text-center text-white text-base transition-all"
                        >
                          {formatValue(row.company)}
                        </div>
                      )}
                    </td>

                    {/* 1Y Low */}
                    <td className="p-2 bg-blue-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.low)}
                          onChange={(e) =>
                            handleChange(index, "low", e.target.value)
                          }
                          className="w-20 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1">{formatValue(row.low)}</div>
                      )}
                    </td>

                    {/* 1Y High */}
                    <td className="p-2 bg-blue-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.high)}
                          onChange={(e) =>
                            handleChange(index, "high", e.target.value)
                          }
                          className="w-20 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1">{formatValue(row.high)}</div>
                      )}
                    </td>

                    {/* Today's Low */}
                    <td className="p-2 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysLow)}
                          onChange={(e) =>
                            handleChange(index, "todaysLow", e.target.value)
                          }
                          className="w-20 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1">{formatValue(row.todaysLow)}</div>
                      )}
                    </td>

                    {/* Today's High */}
                    <td className="p-2 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysHigh)}
                          onChange={(e) =>
                            handleChange(index, "todaysHigh", e.target.value)
                          }
                          className="w-20 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1">
                          {formatValue(row.todaysHigh)}
                        </div>
                      )}
                    </td>

                    {/* Today's Close (With Active Highlight & Blink Styles) */}
                    <td className="p-2 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.closingPrice)}
                          onChange={(e) =>
                            handleChange(index, "closingPrice", e.target.value)
                          }
                          className="w-20 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div style={inlineBlinkStyle} className="py-1 transition-all">
                          {formatValue(row.closingPrice)}
                        </div>
                      )}
                    </td>

                    {/* Pivot Point */}
                    <td className="p-2 bg-amber-950/10 border-r border-gray-800 text-amber-400 font-bold">
                      {pivotPoint !== undefined ? pivotPoint.toFixed(2) : ""}
                    </td>

                    {/* Forecast */}
                    <td className="p-2 bg-amber-950/10 border-r border-gray-800">
                      <div className="text-xs font-bold tracking-wider uppercase">
                        {nextDayPlan === "Bullish" ? (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-sm">
                            {nextDayPlan}
                          </span>
                        ) : nextDayPlan === "Bearish" ? (
                          <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-sm">
                            {nextDayPlan}
                          </span>
                        ) : nextDayPlan === "Neutral" ? (
                          <span className="bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-sm">
                            {nextDayPlan}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    </td>

                    {/* Buy % */}
                    <td className="p-2 bg-purple-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.buyPercent)}
                          onChange={(e) =>
                            handleChange(index, "buyPercent", e.target.value)
                          }
                          className="w-16 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1 text-purple-300 font-medium">
                          {formatValue(row.buyPercent)}%
                        </div>
                      )}
                    </td>

                    {/* Sell % */}
                    <td className="p-2 bg-purple-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.sellPercent)}
                          onChange={(e) =>
                            handleChange(index, "sellPercent", e.target.value)
                          }
                          className="w-16 bg-gray-800 border border-gray-700 p-1 rounded text-center text-white focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-1 text-purple-300 font-medium">
                          {formatValue(row.sellPercent)}%
                        </div>
                      )}
                    </td>

                    {/* Buy Zone */}
                    <td className="p-2 bg-orange-950/10 border-r border-gray-800 text-emerald-400 font-bold">
                      {buyZone !== "" ? `≤ ${buyZone.toFixed(2)}` : ""}
                    </td>

                    {/* Sell Zone */}
                    <td className="p-2 bg-orange-950/10 border-r border-gray-800 text-rose-400 font-bold">
                      {sellZone !== "" ? `≥ ${sellZone.toFixed(2)}` : ""}
                    </td>

                    {/* Actions */}
                    <td className="p-2 bg-slate-900/40">
                      <div className="flex gap-1.5 justify-center items-center min-h-32px">
                        {row.isEditing ? (
                          <>
                            <button
                              onClick={() => saveRow(index)}
                              className="bg-blue-600 hover:bg-blue-500 transition-colors px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => toggleEdit(index)}
                              className="bg-gray-700 hover:bg-gray-600 transition-colors px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleEdit(index)}
                              className="bg-amber-600 hover:bg-amber-500 transition-colors px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteRow(index)}
                              className="bg-rose-600 hover:bg-rose-500 transition-colors px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuyZone;