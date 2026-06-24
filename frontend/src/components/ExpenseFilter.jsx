import React from "react";

const ExpenseFilter = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  handleView,
  handleReset,
  handleExport,
  viewLoading,
  resetLoading,
  exportLoading,
  totalExpense,
}) => {
  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
      {/* DATE INPUTS */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={fromDate || ""}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white"
        />

        <input
          type="date"
          value={toDate || ""}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white"
        />
      </div>

      {/* BUTTONS */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleView}
          disabled={viewLoading}
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {viewLoading ? "Loading..." : "View"}
        </button>

        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {exportLoading ? "Generating..." : "Report"}
        </button>

        <button
          onClick={handleReset}
          disabled={resetLoading}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {resetLoading ? "Resetting..." : "Reset"}
        </button>
      </div>

      {/* Total Display */}
      <div className="text-center pt-2 border-t border-gray-700">
        <span className="text-red-400">Selected Date Total: </span>
        <span className="text-red-600 font-bold text-lg">
          ৳{totalExpense.toFixed(0)}
        </span>
      </div>
    </div>
  );
};

export default ExpenseFilter;