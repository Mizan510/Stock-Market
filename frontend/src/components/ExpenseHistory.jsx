import React from "react";

const ExpenseHistory = ({
  showReport,
  filteredList,
  handleEdit,
  handleDelete,
}) => {
  // TOTAL
  let totalAmount = 0;

  const formatAmount = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  filteredList.forEach((item) => {
    totalAmount += Number(item.amount);
  });

  if (!showReport) {
    return (
      <div className="text-center text-gray-400 py-16">
        Press View to load expense history.
      </div>
    );
  }

  if (filteredList.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">No expenses found.</div>
    );
  }

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-800">
      <table className="w-full text-sm text-center table-fixed">
        {/* ================= HEADER ================= */}
        <thead className="bg-gray-800 text-gray-200">
          <tr>
            <th className="w-35 p-3 border border-gray-700">Date</th>

            <th className="w-40 p-3 border border-gray-700">Title</th>

            <th className="w-35 p-3 border border-gray-700">Category</th>

            <th className="w-35 p-3 border border-gray-700">Importance</th>

            <th className="w-30 p-3 border border-gray-700">Amount</th>

            <th className="w-50 p-3 border border-gray-700">Note</th>

            <th className="w-35 p-3 border border-gray-700">Action</th>
          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {filteredList.map((item) => (
            <tr key={item._id} className="hover:bg-gray-800/40 transition">
              {/* DATE (FIRST COLUMN) */}
              <td className="p-3 border border-gray-700 text-gray-300">
                {new Date(item.date).toLocaleDateString("en-GB")}
              </td>

              {/* TITLE */}
              <td className="p-3 border border-gray-700 font-semibold">
                {item.title}
              </td>

              {/* CATEGORY */}
              <td className="p-3 border border-gray-700 text-gray-300">
                {item.category}
              </td>

              {/* IMPORTANCE */}
              <td className="p-3 border border-gray-700 text-gray-300">
                {item.importance || "-"}
              </td>

              {/* AMOUNT */}
              <td className="p-3 border border-gray-700 font-semibold text-red-400">
                {formatAmount(item.amount)}
              </td>

              {/* NOTE */}
              <td className="p-3 border border-gray-700 text-gray-400">
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
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {/* ================= TOTAL ROW ================= */}
          <tr className="bg-yellow-900/60 font-bold">
            <td className="p-3 border border-gray-700">TOTAL</td>

            <td className="p-3 border border-gray-700">-</td>

            <td className="p-3 border border-gray-700">-</td>

            <td className="p-3 border border-gray-700">-</td>

            <td className="p-3 border border-gray-700 text-green-400">
              {formatAmount(totalAmount)}
            </td>

            <td className="p-3 border border-gray-700">-</td>

            <td className="p-3 border border-gray-700">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseHistory;
