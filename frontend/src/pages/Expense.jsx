import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Expense = () => {
  const navigate = useNavigate();
  const userId = "demo-user";

  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );
    return bd.toISOString().split("T")[0];
  };

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getBDDate());

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [fromDate, setFromDate] = useState(getBDDate());
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  const clearForm = () => {
    setTitle("");
    setCategory("Food");
    setAmount("");
    setNote("");
    setDate(getBDDate());
    setEditingId(null);
  };

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

      if (editingId) {
        const res = await api.put(`/expense/update/${editingId}`, {
          title,
          category,
          amount: Number(amount),
          note,
          date,
        });

        const updated = res.data.data;
        setList((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
        setFilteredList((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
        alert("Expense updated successfully");
      } else {
        const res = await api.post("/expense/add", {
          userId,
          title,
          category,
          amount: Number(amount),
          note,
          date,
        });

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

  const handleEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title);
    setCategory(item.category);
    setAmount(String(item.amount));
    setNote(item.note || "");
    setDate(new Date(item.date).toISOString().split("T")[0]);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this expense? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/expense/delete/${id}`);
      setList((prev) => prev.filter((item) => item._id !== id));
      setFilteredList((prev) => prev.filter((item) => item._id !== id));
      alert("Expense deleted");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error deleting expense");
    }
  };

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

  const totalExpense = filteredList.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">💰 Expense Tracker</h1>
            <p className="text-sm text-gray-400 mt-1">
              Save expenses, filter by date, and review totals.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-xl font-semibold">
              {editingId ? "Edit Expense" : "New Expense"}
            </h2>

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
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Utilities">Utilities</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>

            <input
              placeholder="Amount"
              type="number"
              className="w-full p-3 bg-gray-800 rounded"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <input
              type="date"
              className="w-full p-3 bg-gray-800 rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <textarea
              placeholder="Note (optional)"
              className="w-full p-3 bg-gray-800 rounded h-24 resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex-1 p-3 rounded font-bold transition ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update Expense"
                    : "Save Expense"}
              </button>

              {editingId && (
                <button
                  onClick={clearForm}
                  className="flex-1 p-3 rounded font-bold bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* FILTER SECTION */}
          <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-bold text-white">Filter Expenses</h2>
              <p className="text-sm text-gray-400 hidden sm:block">
                Select a date range and press View.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px_120px] items-end">
              <div>
                <label className="text-sm text-gray-400 block mb-2">From</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">To</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                onClick={handleView}
                disabled={viewLoading}
                className="h-12 w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
              >
                {viewLoading ? "Loading..." : "View"}
              </button>

              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="h-12 w-full bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold"
              >
                {resetLoading ? "Resetting..." : "Reset"}
              </button>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Expenses</p>
              <p className="text-3xl font-bold text-red-400 mt-1">
                ৳ {totalExpense.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Expense History</h2>

          {!showReport ? (
            <div className="text-center text-gray-400 py-16">
              Press View to load expense history for the selected date range.
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              No expenses found for the selected date range.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => (
                <div
                  key={item._id}
                  className="grid grid-cols-1 gap-3 bg-gray-950 p-4 rounded-lg border border-gray-800 md:grid-cols-[1.7fr_0.8fr_0.8fr_0.6fr_1fr]"
                >
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-400">
                      {item.note || "No note"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{item.category}</div>
                  <div className="text-right font-semibold text-red-400">
                    {Number(item.amount).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    {new Date(item.date).toLocaleDateString("en-GB")}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expense;
