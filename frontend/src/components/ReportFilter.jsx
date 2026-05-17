import React from "react";

const ReportFilter = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  handleView,
  handleExport,
  handleReset,
  filterLoading,
  reportLoading,
  resetLoading,
}) => {
  return (
    <div className="bg-gray-900 p-4 rounded-2xl mb-6 space-y-3 border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="p-3 bg-gray-800 rounded-lg outline-none"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="p-3 bg-gray-800 rounded-lg outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleView}
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold"
        >
          View
        </button>

        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold"
        >
          Report
        </button>

        <button
          onClick={handleReset}
          className="bg-gray-700 hover:bg-gray-800 p-3 rounded-lg font-semibold"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ReportFilter;
