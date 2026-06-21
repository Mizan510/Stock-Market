import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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

  // Get Pivot Signal from backend (already calculated)
  const getPivotSignal = (row) => {
    return row.pivotSignal || "Neutral";
  };

  // Get Volume Signal from backend (already calculated)
  const getVolumeSignal = (row) => {
    return row.volumeSignal || row.customSignal || "Neutral";
  };

  // Get Pivot Point from backend (already calculated)
  const getPivotPoint = (row) => {
    return row.pivotPoint || null;
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

  // Get Volume Signal Style
  const getVolumeSignalStyle = (signal) => {
    if (!signal || signal === "N/A") return "text-gray-400";
    
    const signalUpper = signal.toUpperCase();
    
    if (signalUpper === "STRONG BULLISH" || signalUpper === "VERY STRONG BUYER") {
      return "text-emerald- 400 font-bold";
    } else if (signalUpper === "BULLISH" || signalUpper === "STRONG BUYER") {
      return "text-emerald-300 font-bold";
    } else if (signalUpper === "MILD BULLISH" || signalUpper === "WEAK BUYER") {
      return "text-emerald-200";
    } else if (signalUpper === "STRONG BEARISH" || signalUpper === "VERY STRONG SELLER") {
      return "text-rose-400 font-bold";
    } else if (signalUpper === "BEARISH" || signalUpper === "STRONG SELLER") {
      return "text-rose-300 font-bold";
    } else if (signalUpper === "MILD BEARISH" || signalUpper === "WEAK SELLER") {
      return "text-rose-200";
    } else {
      return "text-gray-400";
    }
  };

  // Get Pivot Signal Style
  const getPivotSignalStyle = (signal) => {
    if (!signal) return "text-gray-400";
    
    const signalUpper = signal.toUpperCase();
    
    if (signalUpper === "BULLISH") {
      return "text-emerald-400 font-bold";
    } else if (signalUpper === "BEARISH") {
      return "text-rose-400 font-bold";
    } else {
      return "text-gray-400";
    }
  };

  // Get Company Name Style based on Pivot Signal
  const getCompanyNameStyle = (row) => {
    const pivotSignal = getPivotSignal(row);
    const signalUpper = pivotSignal.toUpperCase();
    
    if (signalUpper === "BULLISH") {
      return "text-emerald-400";
    } else if (signalUpper === "BEARISH") {
      return "text-rose-400";
    } else {
      return "text-white";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/zone");
        const mappedData = (res.data || []).map((row) => ({
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
          todayVolume:
            row.todayVolume !== undefined && row.todayVolume !== null
              ? row.todayVolume
              : "",
          avgVolume1M:
            row.avgVolume1M !== undefined && row.avgVolume1M !== null
              ? row.avgVolume1M
              : "",
          // Use backend calculated values
          pivotPoint: row.pivotPoint || null,
          pivotSignal: row.pivotSignal || row.originalSignal || "Neutral",
          volumeSignal: row.volumeSignal || row.customSignal || "Neutral",
          isEditing: false,
        }));

        const sortedData = mappedData.sort((a, b) =>
          a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
        );

        setRows(sortedData);
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
      todayVolume: parseNumber(row.todayVolume),
      avgVolume1M: parseNumber(row.avgVolume1M),
    };

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
                    : 20,
                sellPercent:
                  res.data.sellPercent !== undefined &&
                  res.data.sellPercent !== null
                    ? res.data.sellPercent
                    : 70,
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
                todayVolume:
                  res.data.todayVolume !== undefined &&
                  res.data.todayVolume !== null
                    ? res.data.todayVolume
                    : "",
                avgVolume1M:
                  res.data.avgVolume1M !== undefined &&
                  res.data.avgVolume1M !== null
                    ? res.data.avgVolume1M
                    : "",
                pivotPoint: res.data.pivotPoint || null,
                pivotSignal: res.data.pivotSignal || res.data.originalSignal || "Neutral",
                volumeSignal: res.data.volumeSignal || res.data.customSignal || "Neutral",
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
    const companyName = row.company || "this company";

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Are you sure to remove "${companyName}"!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "#030712",
      color: "#ffffff",
      iconColor: "#f43f5e",
    });

    if (!result.isConfirmed) return;

    if (row._id) {
      try {
        await api.delete(`/zone/${row._id}`);
        setRows((prev) => prev.filter((item) => item._id !== row._id));

        Swal.fire({
          title: "Deleted!",
          text: `"${companyName}" has been successfully wiped.`,
          icon: "success",
          background: "#030712",
          color: "#ffffff",
          confirmButtonColor: "#2563eb",
        });
      } catch (err) {
        console.error(err);
        showErrorAlert("Failed to delete row.");
      }
    } else {
      setRows((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="flex flex-row items-center justify-between gap-4 mb-2 border-b border-gray-900 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Buy Zone
          </h1>
          <p className="mt-0.5 text-xs font-semibold tracking-wide bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block">
            Green = Buy | Red = Sell | White = Middle Range
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 text-xs">
          No companies available.
        </div>
      ) : (
        <div className="overflow-auto max-h-[calc(100vh-110px)] rounded-xl border border-gray-800 mt-1">
          <table className="w-full table-fixed min-w-max text-[13px] text-center border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800 text-gray-300 font-semibold tracking-tight text-[13px]">
                <th
                  className="p-1.5 border-r border-gray-800 sticky top-0 left-0 bg-gray-900 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)] truncate"
                  style={{ width: "110px" }}
                >
                  Company Name
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#131b2e] text-blue-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "50px" }}
                >
                  1Y Low
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#131b2e] text-blue-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "50px" }}
                >
                  1Y High
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#112022] text-emerald-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "60px" }}
                >
                  Session Low
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#112022] text-emerald-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "60px" }}
                >
                  Session High
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#112022] text-emerald-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "60px" }}
                >
                  Session Close
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#1b1c21] text-amber-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "55px" }}
                >
                  Pivot Point
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#1a2e1a] text-emerald-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "55px" }}
                >
                  Pivot Signal
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#2e1a1a] text-rose-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "65px" }}
                >
                  Volume Signal
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#161a2c] text-purple-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "50px" }}
                >
                  Buy %
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#161a2c] text-purple-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "50px" }}
                >
                  Sell %
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#1c1a22] text-orange-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "70px" }}
                >
                  Buy Entry
                </th>
                <th
                  className="p-1.5 border-r border-gray-800 bg-[#1c1a22] text-orange-300 sticky top-0 z-20 whitespace-normal leading-tight"
                  style={{ width: "70px" }}
                >
                  Sell Target
                </th>
                <th
                  className="p-1.5 bg-gray-900 sticky top-0 z-20"
                  style={{ width: "90px" }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row, index) => {
                const pivotPoint = getPivotPoint(row);
                const pivotSignal = getPivotSignal(row);
                const volumeSignal = getVolumeSignal(row);
                const buyZone = calcZone(row.low, row.high, row.buyPercent);
                const sellZone = calcZone(row.low, row.high, row.sellPercent);
                const companyNameStyle = getCompanyNameStyle(row);

                return (
                  <tr
                    key={row._id || index}
                    className="group hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="p-1 bg-gray-950 border-r border-gray-800 font-medium sticky left-0 z-10 group-hover:bg-gray-900 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.4)] truncate">
                      {row.isEditing ? (
                        <input
                          type="text"
                          value={formatValue(row.company)}
                          onChange={(e) =>
                            handleChange(index, "company", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-1 rounded text-center text-[13px] font-semibold focus:outline-hidden focus:border-blue-500 text-white"
                        />
                      ) : (
                        <div className={`py-0.5 px-0.5 truncate block w-full text-center text-[13px] font-bold ${companyNameStyle}`}>
                          {formatValue(row.company)}
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-blue-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.low)}
                          onChange={(e) =>
                            handleChange(index, "low", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5">{formatValue(row.low)}</div>
                      )}
                    </td>

                    <td className="p-1 bg-blue-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.high)}
                          onChange={(e) =>
                            handleChange(index, "high", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5">{formatValue(row.high)}</div>
                      )}
                    </td>

                    <td className="p-1 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysLow)}
                          onChange={(e) =>
                            handleChange(index, "todaysLow", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5">
                          {formatValue(row.todaysLow)}
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysHigh)}
                          onChange={(e) =>
                            handleChange(index, "todaysHigh", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5">
                          {formatValue(row.todaysHigh)}
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-emerald-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.closingPrice)}
                          onChange={(e) =>
                            handleChange(index, "closingPrice", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5">
                          {formatValue(row.closingPrice)}
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-amber-950/10 border-r border-gray-800 text-amber-400 font-bold">
                      {pivotPoint !== null ? pivotPoint.toFixed(2) : ""}
                    </td>

                    {/* Pivot Signal Cell - using backend value */}
                    <td className="p-1 bg-emerald-950/10 border-r border-gray-800">
                      <div className={`text-[10px] font-bold tracking-tighter uppercase ${getPivotSignalStyle(pivotSignal)}`}>
                        {pivotSignal}
                      </div>
                    </td>

                    {/* Volume Signal Cell - using backend value */}
                    <td className="p-1 bg-rose-950/10 border-r border-gray-800">
                      <div className={`text-[10px] font-bold tracking-tighter ${getVolumeSignalStyle(volumeSignal)}`}>
                        {volumeSignal}
                      </div>
                    </td>

                    <td className="p-1 bg-purple-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.buyPercent)}
                          onChange={(e) =>
                            handleChange(index, "buyPercent", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5 text-purple-300 font-medium">
                          {formatValue(row.buyPercent)}%
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-purple-950/10 border-r border-gray-800">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.sellPercent)}
                          onChange={(e) =>
                            handleChange(index, "sellPercent", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-700 py-0.5 px-0.5 rounded text-center text-white text-[13px] focus:outline-hidden"
                        />
                      ) : (
                        <div className="py-0.5 text-purple-300 font-medium">
                          {formatValue(row.sellPercent)}%
                        </div>
                      )}
                    </td>

                    <td className="p-1 bg-orange-950/10 border-r border-gray-800 text-emerald-400 font-bold">
                      {buyZone !== "" ? `≤${buyZone.toFixed(2)}` : ""}
                    </td>

                    <td className="p-1 bg-orange-950/10 border-r border-gray-800 text-rose-400 font-bold">
                      {sellZone !== "" ? `≥${sellZone.toFixed(2)}` : ""}
                    </td>

                    <td className="p-1 bg-slate-900/40">
                      <div className="flex gap-1 justify-center items-center">
                        {row.isEditing ? (
                          <>
                            <button
                              onClick={() => saveRow(index)}
                              className="bg-blue-600 hover:bg-blue-500 transition-colors px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => toggleEdit(index)}
                              className="bg-gray-700 hover:bg-gray-600 transition-colors px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Can
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleEdit(index)}
                              className="bg-amber-600 hover:bg-amber-500 transition-colors px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteRow(index)}
                              className="bg-rose-600 hover:bg-rose-500 transition-colors px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Del
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