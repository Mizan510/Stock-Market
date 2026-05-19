import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Investment = () => {
  const navigate = useNavigate();
  const userId = "demo-user";

  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return bd.toISOString().split("T")[0];
  };

  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getBDDate());

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const [fromDate, setFromDate] = useState(getBDDate());
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Set fromDate to first data entry date
  useEffect(() => {
    if (list.length > 0) {
      const sortedByDate = [...list].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );
      const firstDate = sortedByDate[0].date.split("T")[0];
      setFromDate(firstDate);
    }
  }, [list]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/investment/${userId}`);
      setList(res.data);
      setFilteredList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // =====================
  // SAVE
  // =====================
  const handleSave = async () => {
    if (!amount || !date || !type) {
      alert("Please fill all required fields");
      return;
    }

    if (isNaN(Number(amount))) {
      alert("Amount must be a number");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/investment/add", {
        userId,
        type,
        amount: Number(amount),
        note,
        date,
      });

      const newItem = res.data.data || res.data;

      setList((prev) => [newItem, ...prev]);
      setFilteredList((prev) => [newItem, ...prev]);

      setAmount("");
      setNote("");
      setDate(getBDDate());
    } catch (err) {
      alert("Error saving transaction");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // VIEW
  // =====================
  const handleView = () => {
    setViewLoading(true);

    setTimeout(() => {
      const filtered = list.filter((item) => {
        const itemDate = new Date(item.date).toISOString().split("T")[0];
        return itemDate >= fromDate && itemDate <= toDate;
      });

      setFilteredList(filtered);
      setShowReport(true);
      setViewLoading(false);
    }, 300);
  };

  // =====================
  // RESET
  // =====================
  const handleReset = () => {
    setResetLoading(true);

    setTimeout(() => {
      setFromDate(getBDDate());
      setToDate(getBDDate());
      setFilteredList(list);
      setShowReport(false);
      setResetLoading(false);
    }, 300);
  };

  // =====================
  // EXPORT
  // =====================
  const handleExport = async () => {
    setExportLoading(true);

    try {
      const data = filteredList.length ? filteredList : list;

      const sorted = [...data].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      let totalDeposit = 0;
      let totalWithdraw = 0;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Investment Report");

      const centerStyle = {
        vertical: "middle",
        horizontal: "center",
      };

      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // ================= HEADER =================
      const headerRow = sheet.addRow([
        "Date",
        "Deposit",
        "Withdraw",
        "Balance",
        "Remarks",
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.alignment = centerStyle;
        cell.border = borderStyle;
      });

      // ================= DATA =================
      sorted.forEach((item) => {
        const amt = Number(item.amount);

        let depositCell = "";
        let withdrawCell = "";
        let balanceCell = "";

        if (item.type === "deposit") {
          totalDeposit += amt;
          depositCell = amt;
          balanceCell = `+${amt}`;
        } else {
          totalWithdraw += amt;
          withdrawCell = amt;
          balanceCell = `-${amt}`;
        }

        const row = sheet.addRow([
          new Date(item.date).toLocaleDateString("en-GB"),
          depositCell,
          withdrawCell,
          balanceCell,
          item.note || "",
        ]);

        row.eachCell((cell) => {
          cell.alignment = centerStyle;
          cell.border = borderStyle;
        });
      });

      // ================= TOTAL ROW =================
      const totalBalance = totalDeposit - totalWithdraw;

      const totalRow = sheet.addRow([
        "TOTAL",
        totalDeposit,
        totalWithdraw,
        totalBalance,
        "-",
      ]);

      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = centerStyle;
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" }, // highlight yellow
        };
      });

      // ================= COLUMN WIDTH (TABLE STYLE) =================
      sheet.columns = [
        { width: 14 }, // Date
        { width: 12 }, // Deposit
        { width: 12 }, // Withdraw
        { width: 14 }, // Balance
        { width: 25 }, // Remarks
      ];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "investment_report.xlsx");
    } finally {
      setExportLoading(false);
    }
  };

  // =====================
  // TOTALS
  // =====================
  const reportData = showReport ? filteredList : list;

  let totalDeposit = 0;
  let totalWithdraw = 0;
  let balance = 0;

  reportData.forEach((item) => {
    const amt = Number(item.amount);

    if (item.type === "deposit") {
      totalDeposit += amt;
      balance += amt;
    } else {
      totalWithdraw += amt;
      balance -= amt;
    }
  });
  // =====================
  // DELETE ROW
  // =====================
  const handleDelete = async (index, item) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmDelete) return; // stop if user clicks Cancel

    try {
      setLoading(true);

      await api.delete(`/investment/delete/${item._id}`);

      // remove from UI after DB delete
      const updated = reportData.filter((_, i) => i !== index);
      setFilteredList(updated);

      const mainUpdated = list.filter((x) => x._id !== item._id);
      setList(mainUpdated);
    } catch (err) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // EDIT ROW (simple inline edit using prompt)
  // =====================
  const handleEdit = async (index, item) => {
    const newAmount = prompt("Enter new amount", item.amount);
    const newNote = prompt("Enter new note", item.note || "");

    if (newAmount === null) return;

    if (isNaN(Number(newAmount))) {
      alert("Amount must be a number");
      return;
    }

    try {
      const res = await api.put(`/investment/update/${item._id}`, {
        amount: Number(newAmount),
        note: newNote,
      });

      const updatedItem = res.data.data;

      // update UI
      const updatedList = list.map((x) =>
        x._id === item._id ? updatedItem : x,
      );

      setList(updatedList);
      setFilteredList(updatedList);
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">💼 Investment</h1>

          <button
            onClick={() => {
              setBackLoading(true);
              setTimeout(() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/dashboard");
                }
                setBackLoading(false);
              }, 300);
            }}
            disabled={backLoading}
            className="bg-gray-700 px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {backLoading ? "Loading..." : "Back"}
          </button>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-4 rounded-xl space-y-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          >
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <input
            type="text"
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full p-3 rounded font-bold ${
              type === "deposit"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } ${loading ? "opacity-60" : ""}`}
          >
            {loading ? "Saving..." : "Save Transaction"}
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-gray-900 p-3 rounded-xl mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 bg-gray-800 rounded"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 bg-gray-800 rounded"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleView}
              disabled={viewLoading}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:opacity-60"
            >
              {viewLoading ? "Loading..." : "View"}
            </button>

            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="bg-green-600 hover:bg-green-700 p-2 rounded disabled:opacity-60"
            >
              {exportLoading ? "Exporting..." : "Report"}
            </button>

            <button
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-gray-600 hover:bg-gray-700 p-2 rounded disabled:opacity-60"
            >
              {resetLoading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>

        {/* REPORT TABLE */}
        {showReport && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm border border-gray-700 text-center">
              <thead className="bg-gray-800 font-bold text-center">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Deposit</th>
                  <th className="p-2 border">Withdraw</th>
                  <th className="p-2 border">Balance</th>
                  <th className="p-2 border">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {reportData.map((item, i) => (
                  <tr key={i} className="border border-gray-700">
                    <td className="p-2 border">
                      {new Date(item.date).toLocaleDateString("en-GB")}
                    </td>

                    <td className="p-2 border text-green-400">
                      {item.type === "deposit" ? item.amount : ""}
                    </td>

                    <td className="p-2 border text-red-400">
                      {item.type === "withdraw" ? item.amount : ""}
                    </td>

                    <td className="p-2 border text-yellow-300">
                      {item.type === "deposit"
                        ? `+${item.amount}`
                        : `-${item.amount}`}
                    </td>

                    <td className="p-2 border text-gray-300">{item.note}</td>

                    {/* ACTION BUTTONS */}
                    <td className="p-2 border">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(i, item)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(i, item)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr className="bg-yellow-900 font-bold">
                  <td className="p-2 border">TOTAL</td>
                  <td className="p-2 border text-green-400">{totalDeposit}</td>
                  <td className="p-2 border text-red-400">{totalWithdraw}</td>
                  <td className="p-2 border text-yellow-300">{balance}</td>
                  <td className="p-2 border">-</td>
                  <td className="p-2 border">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Investment;
