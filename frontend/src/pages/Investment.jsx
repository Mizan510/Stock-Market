import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import { useConfirm } from "../components/ConfirmProvider";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const Investment = () => {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return bd.toISOString().split("T")[0];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Main Form Fields State
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getBDDate());

  // Tracks the entire transaction object being edited
  const [selectedEditItem, setSelectedEditItem] = useState(null);

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const [fromDate, setFromDate] = useState(getBDDate());
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    fetchData();
  }, []);

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

  // ==========================================
  // HANDLERS: SAVE (NEW) & UPDATE (EDITED)
  // ==========================================
  const handleSaveOrUpdate = async () => {
    if (!amount || !date || !type) {
      showAlert("Please fill all required fields");
      return;
    }

    if (isNaN(Number(amount))) {
      showAlert("Amount must be a number");
      return;
    }

    try {
      setLoading(true);

      if (selectedEditItem) {
        // UPDATE MODE
        const res = await api.put(`/investment/update/${selectedEditItem._id}`, {
          amount: Number(amount),
          note,
          date,
          type, // Sent type as well in case it was switched during edit
        });

        const updatedItem = res.data.data || res.data;

        // Apply edits & keep tracking state arrays sorted chronologically
        const updateState = (prev) =>
          prev.map((x) => (x._id === selectedEditItem._id ? updatedItem : x))
              .sort((a, b) => new Date(a.date) - new Date(b.date));

        setList(updateState);
        setFilteredList(updateState);
        showSuccessAlert("Transaction updated successfully!");
        handleCancelEdit(); // Clear form states out of edit mode
      } else {
        // NEW CREATION MODE
        const res = await api.post("/investment/add", {
          userId,
          type,
          amount: Number(amount),
          note,
          date,
        });

        const newItem = res.data.data || res.data;

        const insertState = (prev) =>
          [...prev, newItem].sort((a, b) => new Date(a.date) - new Date(b.date));

        setList(insertState);
        setFilteredList(insertState);

        setAmount("");
        setNote("");
        setDate(getBDDate());
        showSuccessAlert("Transaction saved successfully!");
      }
    } catch (err) {
      showErrorAlert(selectedEditItem ? "Error updating transaction" : "Error saving transaction");
    } division: {
      setLoading(false);
    }
  };

  // Loads table row details into main input fields
  const handleEditClick = (item) => {
    setSelectedEditItem(item);
    setDate(item.date.split("T")[0]);
    setType(item.type);
    setAmount(item.amount);
    setNote(item.note || "");
    
    // Smooth scroll back to form view on mobile devices
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setSelectedEditItem(null);
    setDate(getBDDate());
    setType("deposit");
    setAmount("");
    setNote("");
  };

  // =====================
  // VIEW / RESET / EXPORT
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const data = filteredList.length ? filteredList : list;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

      let totalDeposit = 0;
      let totalWithdraw = 0;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Investment Report");

      const centerStyle = { vertical: "middle", horizontal: "center" };
      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const headerRow = sheet.addRow(["Date", "Deposit", "Withdraw", "Balance", "Remarks"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
        cell.alignment = centerStyle;
        cell.border = borderStyle;
      });

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

        const row = sheet.addRow([formatDate(item.date), depositCell, withdrawCell, balanceCell, item.note || ""]);
        row.eachCell((cell) => {
          cell.alignment = centerStyle;
          cell.border = borderStyle;
        });
      });

      const totalBalance = totalDeposit - totalWithdraw;
      const totalRow = sheet.addRow(["TOTAL", totalDeposit, totalWithdraw, totalBalance, "-"]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = centerStyle;
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD966" } };
      });

      sheet.columns = [{ width: 14 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 25 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, "investment_report.xlsx");
    } catch (err) {
      showErrorAlert("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  // Compute summary rows safely
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

  const handleDelete = async (item) => {
    const confirmDelete = await confirm("Are you sure you want to delete this transaction?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await api.delete(`/investment/delete/${item._id}`);
      setFilteredList((prev) => prev.filter((x) => x._id !== item._id));
      setList((prev) => prev.filter((x) => x._id !== item._id));
      showSuccessAlert("Transaction deleted successfully!");
      if (selectedEditItem?._id === item._id) handleCancelEdit();
    } catch (err) {
      showErrorAlert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gray-950 p-4 text-gray-100 sm:p-6">
      <div className={`w-full space-y-6 transition-all duration-300 ${showReport ? "max-w-5xl" : "max-w-md"}`}>
        
        {/* Form Container */}
        <div className="mx-auto w-full max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {selectedEditItem ? "📝 Edit Transaction" : "💼 Investment"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg bg-gray-800 px-4 py-2 font-medium transition duration-200 hover:bg-gray-700 active:bg-gray-600"
            >
              Back
            </button>
          </div>

          {/* MAIN FORM */}
          <div className={`space-y-3 rounded-xl border p-4 shadow-xl transition-all ${
            selectedEditItem ? "border-blue-500 bg-blue-950/20" : "border-gray-800 bg-gray-900"
          }`}>
            {selectedEditItem && (
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-400">
                <span>Modifying entry</span>
                <span className="text-gray-500">ID: {selectedEditItem._id?.slice(-6)}</span>
              </div>
            )}

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <input
              type="text"
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveOrUpdate}
                disabled={loading}
                className={`w-full rounded-lg p-3 font-bold text-white shadow-md transition duration-200 ${
                  selectedEditItem 
                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800" 
                    : type === "deposit"
                    ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
                    : "bg-red-600 hover:bg-red-700 active:bg-red-800"
                } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {loading ? "Processing..." : selectedEditItem ? "Update Transaction" : "Save Transaction"}
              </button>
              
              {selectedEditItem && (
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-gray-700 px-4 font-semibold text-gray-200 transition hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* FILTER CRITERIA PANEL */}
          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm font-semibold">
              <button
                onClick={handleView}
                disabled={viewLoading}
                className="rounded-lg bg-blue-600 p-2.5 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {viewLoading ? "Loading..." : "View"}
              </button>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="rounded-lg bg-emerald-600 p-2.5 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportLoading ? "Exporting..." : "Report"}
              </button>
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="rounded-lg bg-gray-700 p-2.5 transition hover:bg-gray-600 active:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetLoading ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>

        {/* REPORT DATA LISTING */}
        {showReport && (
          <div className="w-full overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
            <table className="w-full table-auto border-collapse text-center text-sm">
              <thead className="border-b border-gray-700 bg-gray-800 font-bold text-gray-300">
                <tr>
                  <th className="whitespace-nowrap border-r border-gray-700 p-3">Date</th>
                  <th className="border-r border-gray-700 p-3">Deposit</th>
                  <th className="border-r border-gray-700 p-3">Withdraw</th>
                  <th className="border-r border-gray-700 p-3">Balance</th>
                  <th className="border-r border-gray-700 p-3">Remarks</th>
                  <th className="whitespace-nowrap p-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                {reportData.map((item, i) => {
                  const isItemBeingEdited = selectedEditItem?._id === item._id;
                  return (
                    <tr 
                      key={item._id || i} 
                      className={`transition duration-150 ${
                        isItemBeingEdited ? "bg-blue-950/40 ring-1 ring-blue-500" : "hover:bg-gray-800/30"
                      }`}
                    >
                      <td className="whitespace-nowrap border-r border-gray-800 p-3">
                        {formatDate(item.date)}
                      </td>
                      <td className="border-r border-gray-800 p-3 text-green-400 font-medium">
                        {item.type === "deposit" ? item.amount : ""}
                      </td>
                      <td className="border-r border-gray-800 p-3 text-red-400 font-medium">
                        {item.type === "withdraw" ? item.amount : ""}
                      </td>
                      <td className="border-r border-gray-800 p-3 font-semibold text-yellow-400">
                        {item.type === "deposit" ? `+${item.amount}` : `-${item.amount}`}
                      </td>
                      <td className="max-w-xs break-all border-r border-gray-800 p-3 text-center text-gray-300">
                        {item.note || "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            disabled={isItemBeingEdited}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                              isItemBeingEdited 
                                ? "bg-blue-800/40 text-blue-300 cursor-not-allowed" 
                                : "bg-blue-600/90 hover:bg-blue-600"
                            }`}
                          >
                            {isItemBeingEdited ? "Editing..." : "Edit"}
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded bg-red-600/90 px-2.5 py-1 text-xs font-medium transition hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                <tr className="border-t border-gray-700 bg-yellow-950/30 font-bold text-yellow-400">
                  <td className="whitespace-nowrap border-r border-gray-800 p-3">TOTAL</td>
                  <td className="border-r border-gray-800 p-3 text-green-400">{totalDeposit}</td>
                  <td className="border-r border-gray-800 p-3 text-red-400">{totalWithdraw}</td>
                  <td className="border-r border-gray-800 p-3 text-yellow-400">{balance}</td>
                  <td className="border-r border-gray-800 p-3 text-gray-500">-</td>
                  <td className="p-3 text-gray-500">-</td>
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