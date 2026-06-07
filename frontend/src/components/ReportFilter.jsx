import React, { useRef } from "react";

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
  companies,
  selectedCompany,
  setSelectedCompany,
}) => {
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const formatDate = (d) => {
    if (!d) return "DD-MMM-YYYY";
    try {
      const [y, m, day] = d.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const mon = monthNames[Number(m) - 1] || "???";
      return `${day}-${mon}-${y}`;
    } catch (e) {
      return d;
    }
  };

  const formattedFrom = formatDate(fromDate);
  const formattedTo = formatDate(toDate);
  return (
    <div className="bg-gray-900 p-4 rounded-2xl mb-6 space-y-3 border border-gray-700">
      <div className="flex items-start gap-2 flex-nowrap">
        <div className="flex-1 min-w-0 flex flex-col">
          <label className="text-gray-300">From Date</label>
          <div className="mt-1">
            <div
              className="w-full px-3 py-2 bg-gray-800 rounded-lg text-gray-100 cursor-text flex items-center"
              onClick={() =>
                fromRef.current && fromRef.current.showPicker
                  ? fromRef.current.showPicker()
                  : fromRef.current && fromRef.current.focus()
              }
            >
              <span className="truncate text-base">{formattedFrom}</span>
            </div>
            <input
              ref={fromRef}
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <label className=" text-gray-300">To Date</label>
          <div className="mt-1">
            <div
              className="w-full px-3 py-2 bg-gray-800 rounded-lg text-gray-100 cursor-text flex items-center"
              onClick={() =>
                toRef.current && toRef.current.showPicker
                  ? toRef.current.showPicker()
                  : toRef.current && toRef.current.focus()
              }
            >
              <span className="truncate text-base">{formattedTo}</span>
            </div>
            <input
              ref={toRef}
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-lg outline-none"
        >
          <option value="All">All Companies</option>
          {companies &&
            companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>
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
