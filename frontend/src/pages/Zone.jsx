import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Zone = () => {
  const navigate = useNavigate();

  const STORAGE_KEY = "zone_rows";

  // =========================
  // LOAD FROM LOCALSTORAGE
  // =========================
  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // =========================
  // SYNC TO LOCALSTORAGE (SAFE)
  // =========================
  const syncStorage = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // keep storage synced when rows change (extra safety)
  useEffect(() => {
    syncStorage(rows);
  }, [rows]);

  // =========================
  // ADD ROW
  // =========================
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        company: "",
        low: 0,
        high: 0,
        buyPercent: 20,
        sellPercent: 70,
      },
    ]);
  };

  // =========================
  // DELETE ROW
  // =========================
  const deleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================
  // EDIT ROW
  // =========================
  const handleChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];

      updated[index][field] = field === "company" ? value : Number(value);

      return updated;
    });
  };

  // =========================
  // CALCULATION
  // =========================
  const calcZone = (low, high, percent) => {
    return low + ((high - low) * percent) / 100;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Buy / Sell Zone Calculator</h1>

        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
          >
            + Add Company
          </button>

          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {rows.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          No companies added yet. Click "Add Company".
        </div>
      )}

      {/* TABLE */}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-800 text-center">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-3 border">Company</th>
                <th className="p-2 border">1Y Low</th>
                <th className="p-2 border">1Y High</th>
                <th className="p-2 border">Buy % (≤)</th>
                <th className="p-2 border">Sell % (≥)</th>
                <th className="p-2 border">Buying Zone</th>
                <th className="p-2 border">Selling Zone</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => {
                const buyZone = calcZone(row.low, row.high, row.buyPercent);
                const sellZone = calcZone(row.low, row.high, row.sellPercent);

                return (
                  <tr key={i} className="border border-gray-800">
                    {/* COMPANY */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.company}
                        onChange={(e) =>
                          handleChange(i, "company", e.target.value)
                        }
                        className="w-56 bg-gray-800 p-2 rounded text-center text-base font-semibold"
                      />
                    </td>

                    {/* LOW */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.low}
                        onChange={(e) => handleChange(i, "low", e.target.value)}
                        className="w-20 bg-gray-800 p-1 rounded text-center"
                      />
                    </td>

                    {/* HIGH */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.high}
                        onChange={(e) =>
                          handleChange(i, "high", e.target.value)
                        }
                        className="w-20 bg-gray-800 p-1 rounded text-center"
                      />
                    </td>

                    {/* BUY % */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.buyPercent}
                        onChange={(e) =>
                          handleChange(i, "buyPercent", e.target.value)
                        }
                        className="w-16 bg-gray-800 p-1 rounded text-center"
                      />
                    </td>

                    {/* SELL % */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.sellPercent}
                        onChange={(e) =>
                          handleChange(i, "sellPercent", e.target.value)
                        }
                        className="w-16 bg-gray-800 p-1 rounded text-center"
                      />
                    </td>

                    {/* BUY ZONE */}
                    <td className="p-2 text-green-400 font-bold">
                      ≤ {buyZone.toFixed(2)}
                    </td>

                    {/* SELL ZONE */}
                    <td className="p-2 text-red-400 font-bold">
                      ≥ {sellZone.toFixed(2)}
                    </td>

                    {/* ACTION */}
                    <td className="p-2">
                      <button
                        onClick={() => deleteRow(i)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
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
