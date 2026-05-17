import React from "react";

const ExpenseFilter = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  handleView,
  handleReset,
  handleExport,
  handleEdit,
  handleDelete,
  viewLoading,
  resetLoading,
  exportLoading,
  showReport,
  reportData,
}) => {
  // TOTAL AMOUNT
  const totalAmount = reportData?.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  return (
    <div className="space-y-5">

      {/* ================= FILTER ================= */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">

        {/* DATE INPUTS */}
        <div className="grid grid-cols-2 gap-3">

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl outline-none"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl outline-none"
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
      </div>

      {/* ================= REPORT TABLE ================= */}
      {showReport && (
        <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-800">

          <table className="w-full text-sm text-center">

            {/* HEADER */}
            <thead className="bg-gray-800 text-gray-200">
              <tr>
                <th className="p-3 border border-gray-700">
                  Date
                </th>

                <th className="p-3 border border-gray-700">
                  Title
                </th>

                <th className="p-3 border border-gray-700">
                  Category
                </th>

                <th className="p-3 border border-gray-700">
                  Amount
                </th>

                <th className="p-3 border border-gray-700">
                  Note
                </th>

                <th className="p-3 border border-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>

              {reportData?.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-5 text-gray-400"
                  >
                    No expense data found
                  </td>
                </tr>
              )}

              {reportData?.map((item, i) => (
                <tr
                  key={item._id || i}
                  className="hover:bg-gray-800/50 transition"
                >

                  {/* DATE */}
                  <td className="p-3 border border-gray-700">
                    {new Date(item.date).toLocaleDateString(
                      "en-GB",
                    )}
                  </td>

                  {/* TITLE */}
                  <td className="p-3 border border-gray-700 text-cyan-300 font-medium">
                    {item.title}
                  </td>

                  {/* CATEGORY */}
                  <td className="p-3 border border-gray-700">
                    {item.category}
                  </td>

                  {/* AMOUNT */}
                  <td className="p-3 border border-gray-700 text-yellow-300 font-semibold">
                    ৳{" "}
                    {Number(item.amount || 0).toFixed(2)}
                  </td>

                  {/* NOTE */}
                  <td className="p-3 border border-gray-700 text-gray-300">
                    {item.note || "-"}
                  </td>

                  {/* ACTION */}
                  <td className="p-3 border border-gray-700">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(item._id)
                        }
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>
              ))}

              {/* TOTAL ROW */}
              {reportData?.length > 0 && (
                <tr className="bg-yellow-900/70 font-bold">

                  <td className="p-3 border border-gray-700">
                    TOTAL
                  </td>

                  <td className="p-3 border border-gray-700">
                    -
                  </td>

                  <td className="p-3 border border-gray-700">
                    -
                  </td>

                  <td className="p-3 border border-gray-700 text-yellow-300 text-lg">
                    ৳ {totalAmount.toFixed(2)}
                  </td>

                  <td className="p-3 border border-gray-700">
                    -
                  </td>

                  <td className="p-3 border border-gray-700">
                    -
                  </td>

                </tr>
              )}

            </tbody>
          </table>

        </div>
      )}
    </div>
  );
};

export default ExpenseFilter;