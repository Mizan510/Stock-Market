import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { showAlert, showErrorAlert } from "../utils/sweetAlert";

const Zone = () => {
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

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        company: "",
        low: "",
        high: "",
        buyPercent: 20,
        sellPercent: 70,
        todaysHigh: "",
        todaysLow: "",
        closingPrice: "",
        isEditing: true,
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "company" ? value : value,
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

  const saveAll = async () => {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.company || !row.company.trim()) continue;
      await saveRow(i);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            📊 Trade Zones
          </h1>
          <p className="mt-1 text-lg font-semibold tracking-wide bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block">
            Smart Buy & Sell Zones Based on Pivot Analysis
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addRow}
            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
          >
            + Add Company
          </button>
          <button
            onClick={saveAll}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg"
          >
            Save All
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-700 px-3 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          No companies added yet. Click "Add Company".
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-800 text-center">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-3 border">Company</th>
                <th className="p-2 border">1Y Low</th>
                <th className="p-2 border">1Y High</th>
                <th className="p-2 border">Today's Low</th>
                <th className="p-2 border">Today's High</th>
                <th className="p-2 border">Closing</th>
                <th className="p-2 border">Pivot Point</th>
                <th className="p-2 border">Next Day Forecast</th>
                <th className="p-2 border">Buy % (≤)</th>
                <th className="p-2 border">Sell % (≥)</th>
                <th className="p-2 border">Buying Zone</th>
                <th className="p-2 border">Selling Zone</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const pivotPoint = computePivotPoint(row);
                const nextDayPlan = computeNextDayPlan(pivotPoint, row);
                const buyZone = calcZone(row.low, row.high, row.buyPercent);
                const sellZone = calcZone(row.low, row.high, row.sellPercent);

                return (
                  <tr key={row._id || index} className="border border-gray-800">
                    <td className="p-3">
                      {row.isEditing ? (
                        <input
                          type="text"
                          value={formatValue(row.company)}
                          onChange={(e) =>
                            handleChange(index, "company", e.target.value)
                          }
                          className="w-56 bg-gray-800 p-2 rounded text-center text-base font-semibold"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.company)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.low)}
                          onChange={(e) =>
                            handleChange(index, "low", e.target.value)
                          }
                          className="w-20 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.low)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.high)}
                          onChange={(e) =>
                            handleChange(index, "high", e.target.value)
                          }
                          className="w-20 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.high)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysLow)}
                          onChange={(e) =>
                            handleChange(index, "todaysLow", e.target.value)
                          }
                          className="w-24 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.todaysLow)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.todaysHigh)}
                          onChange={(e) =>
                            handleChange(index, "todaysHigh", e.target.value)
                          }
                          className="w-24 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.todaysHigh)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.closingPrice)}
                          onChange={(e) =>
                            handleChange(index, "closingPrice", e.target.value)
                          }
                          className="w-24 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.closingPrice)}
                        </div>
                      )}
                    </td>

                    <td className="p-2 text-yellow-300 font-bold">
                      {pivotPoint !== undefined ? pivotPoint.toFixed(2) : ""}
                    </td>

                    <td className="p-2">
                      <div className="text-lg">
                        {nextDayPlan === "Bullish" ? (
                          <span className="text-green-400 font-bold">
                            {nextDayPlan}
                          </span>
                        ) : nextDayPlan === "Bearish" ? (
                          <span className="text-red-400 font-bold">
                            {nextDayPlan}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-medium">
                            {nextDayPlan}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.buyPercent)}
                          onChange={(e) =>
                            handleChange(index, "buyPercent", e.target.value)
                          }
                          className="w-16 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.buyPercent)}
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {row.isEditing ? (
                        <input
                          type="number"
                          value={formatValue(row.sellPercent)}
                          onChange={(e) =>
                            handleChange(index, "sellPercent", e.target.value)
                          }
                          className="w-16 bg-gray-800 p-1 rounded text-center"
                        />
                      ) : (
                        <div className="min-h-9.5 flex items-center justify-center">
                          {formatValue(row.sellPercent)}
                        </div>
                      )}
                    </td>

                    <td className="p-2 text-green-400 font-bold">
                      {buyZone !== "" ? `≤ ${buyZone.toFixed(2)}` : ""}
                    </td>

                    <td className="p-2 text-red-400 font-bold">
                      {sellZone !== "" ? `≥ ${sellZone.toFixed(2)}` : ""}
                    </td>

                    <td className="p-2 flex flex-wrap gap-2 justify-center">
                      {row.isEditing ? (
                        <>
                          <button
                            onClick={() => saveRow(index)}
                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => toggleEdit(index)}
                            className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleEdit(index)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRow(index)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
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

export default Zone;
