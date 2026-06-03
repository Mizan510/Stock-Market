import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

import ExpenseFilter from "../components/ExpenseFilter";
import ExpenseHistory from "../components/ExpenseHistory";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Expense = () => {
  const navigate = useNavigate();
  const userId = "demo-user";

  // =========================
  // DATE (Bangladesh Time)
  // =========================
  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );
    return bd.toISOString().split("T")[0];
  };

  // =========================
  // FORM STATE
  // =========================
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [importance, setImportance] = useState("Essential");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getBDDate());
  const [editingId, setEditingId] = useState(null);

  // =========================
  // DATA STATE
  // =========================
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [showReport, setShowReport] = useState(false);

  // =========================
  // FILTER STATE
  // =========================
  const [fromDate, setFromDate] = useState(getBDDate());
  const [toDate, setToDate] = useState(getBDDate());

  // =========================
  // LOADING
  // =========================
  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // =========================
  // INIT LOAD
  // =========================
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expense/${userId}`);
      setList(res.data);
      setFilteredList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // CLEAR FORM
  // =========================
  const clearForm = () => {
    setTitle("");
    setCategory("Food");
    setImportance("Essential");
    setAmount("");
    setNote("");
    setDate(getBDDate());
    setEditingId(null);
  };

  // =========================
  // SAVE / UPDATE
  // =========================
  const handleSave = async () => {
    if (!title.trim() || !amount || !date) {
      alert("Please fill all required fields");
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Amount must be a valid number");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title,
        category,
        importance,
        amount: Number(amount),
        note,
        date,
        userId,
      };

      if (editingId) {
        const res = await api.put(`/expense/update/${editingId}`, payload);

        const updated = res.data.data;

        setList((prev) =>
          prev.map((i) => (i._id === updated._id ? updated : i)),
        );
        setFilteredList((prev) =>
          prev.map((i) => (i._id === updated._id ? updated : i)),
        );

        alert("Expense updated successfully");
      } else {
        const res = await api.post("/expense/add", payload);

        const newExpense = res.data.data;

        setList((prev) => [newExpense, ...prev]);
        setFilteredList((prev) => [newExpense, ...prev]);

        alert("Expense saved successfully");
      }

      clearForm();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error saving expense");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title);
    setCategory(item.category);
    setImportance(item.importance || "Essential");
    setAmount(String(item.amount));
    setNote(item.note || "");
    setDate(new Date(item.date).toISOString().split("T")[0]);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await api.delete(`/expense/delete/${id}`);

      setList((prev) => prev.filter((i) => i._id !== id));
      setFilteredList((prev) => prev.filter((i) => i._id !== id));

      alert("Expense deleted");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error deleting expense");
    }
  };

  // =========================
  // FILTER REPORT
  // =========================
  const handleReport = () => {
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

  // =========================
  // EXPORT TO EXCEL
  // =========================
  const handleExport = async () => {
    setExportLoading(true);

    try {
      const data = filteredList.length ? filteredList : list;

      const sorted = [...data].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      let totalAmount = 0;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Expense Report");

      const centerStyle = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // header
      const headerRow = sheet.addRow([
        "Date",
        "Title",
        "Category",
        "Importance",
        "Amount",
        "Note",
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

      // data rows
      sorted.forEach((item) => {
        const amt = Number(item.amount || 0);
        totalAmount += amt;

        const row = sheet.addRow([
          new Date(item.date).toLocaleDateString("en-GB"),
          item.title || "",
          item.category || "",
          item.importance || "",
          amt,
          item.note || "",
        ]);

        row.eachCell((cell) => {
          cell.alignment = centerStyle;
          cell.border = borderStyle;
        });
        row.height = 40;
      });

      // total row
      const totalRow = sheet.addRow(["TOTAL", "-", "-", "-", totalAmount, "-"]);
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
          fgColor: { argb: "FFFFD966" },
        };
      });

      sheet.columns = [
        { width: 14 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 12 },
        { width: 30 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "expense_report.xlsx");
    } catch (err) {
      console.log(err);
      alert("Failed to generate report");
    } finally {
      setExportLoading(false);
    }
  };

  // =========================
  // RESET FILTER
  // =========================
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

  // =========================
  // TOTAL
  // =========================
  const totalExpense = filteredList.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  // =========================
  // THIS MONTH TOTAL
  // =========================
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthTotal = list.reduce((sum, item) => {
    const d = new Date(item.date);

    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + Number(item.amount || 0);
    }

    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">💰 Expense Tracker</h1>
            <p className="text-sm text-gray-400">
              Save expenses and track reports
            </p>
          </div>

          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/dashboard");
              }
            }}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">


<div className="flex items-center justify-between gap-2">
  <h2 className="text-lg sm:text-xl font-semibold">
    {editingId ? "Edit Expense" : "New Expense"}
  </h2>

  <div className="whitespace-nowrap text-right">
    <span className="text-[12px] sm:text-xs text-red-300">
      This Month Total:
    </span>
    <span className="ml-1 text-red-500 font-bold text-xl sm:text-lg">
      ৳{thisMonthTotal.toLocaleString()}
    </span>
  </div>
</div>


          <input
            type="date"
            className="w-full p-3 bg-gray-800 rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            placeholder="Title"
            className="w-full p-3 bg-gray-800 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Utilities</option>
            <option>Shopping</option>
            <option>Health</option>
            <option>Other</option>
          </select>

          <select
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          >
            <option>Essential</option>
            <option>Non-Essential</option>
            <option>Entertainment</option>
            <option>Just Want</option>
          </select>

          <input
            type="number"
            placeholder="Amount"
            className="w-full p-3 bg-gray-800 rounded"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <textarea
            placeholder="Note (optional)"
            className="w-full p-3 bg-gray-800 rounded h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
            >
              {loading ? "Saving..." : editingId ? "Update" : "Save"}
            </button>

            {editingId && (
              <button
                onClick={clearForm}
                className="flex-1 bg-gray-700 p-3 rounded font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* FILTER */}
        <ExpenseFilter
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          handleView={handleReport}
          handleReset={handleReset}
          viewLoading={viewLoading}
          resetLoading={resetLoading}
          handleExport={handleExport}
          exportLoading={exportLoading}
          totalExpense={totalExpense}
        />

        {/* HISTORY */}
        <ExpenseHistory
          showReport={showReport}
          filteredList={filteredList}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Expense;
