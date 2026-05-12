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
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
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
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/investment/${userId}`);
      setList(res.data);
      setFilteredList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSave = async () => {
    if (!amount) return alert("Enter amount");

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

  const handleView = () => {
    const filtered = list.filter((item) => {
      const d = new Date(item.date).setHours(0, 0, 0, 0);
      const f = new Date(fromDate).setHours(0, 0, 0, 0);
      const t = new Date(toDate).setHours(0, 0, 0, 0);
      return d >= f && d <= t;
    });

    setFilteredList(filtered);
    setShowReport(true);
  };

  const handleReset = () => {
    setFromDate(getBDDate());
    setToDate(getBDDate());
    setFilteredList(list);
    setShowReport(false);
  };

  // =========================
  // EXCEL EXPORT (CENTER FIXED)
  // =========================
  const handleExport = async () => {
    const data = filteredList.length ? filteredList : list;

    const sorted = [...data].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let totalDeposit = 0;
    let totalWithdraw = 0;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Investment Report");

    const centerStyle = {
      vertical: "middle",
      horizontal: "center",
    };

    // HEADER
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
        fgColor: { argb: "FF2F5597" },
      };
      cell.alignment = centerStyle;
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // DATA ROWS
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
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // TOTAL ROW
    const totalBalance = totalDeposit - totalWithdraw;

    const totalRow = sheet.addRow([
      "TOTAL",
      totalDeposit,
      totalWithdraw,
      totalBalance,
      "",
    ]);

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE599" },
      };
      cell.alignment = centerStyle;
      cell.border = {
        top: { style: "thick" },
        left: { style: "thick" },
        bottom: { style: "thick" },
        right: { style: "thick" },
      };
    });

    sheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 25 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "investment_report.xlsx");
  };

  // =========================
  // REPORT TOTALS
  // =========================
  const reportData = filteredList.length ? filteredList : list;

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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">💼 Investment</h1>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-4 rounded-xl space-y-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          >
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <input
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full p-3 rounded font-bold ${
              type === "deposit"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
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
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded"
            >
              View
            </button>

            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 p-2 rounded"
            >
              Report
            </button>

            <button
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 p-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>

        {/* REPORT TABLE */}
        {showReport && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm border border-gray-700 text-center">
              <thead className="bg-gray-800 font-bold text-center">
                <tr>
                  <th className="p-2 border text-center">Date</th>
                  <th className="p-2 border text-center">Deposit</th>
                  <th className="p-2 border text-center">Withdraw</th>
                  <th className="p-2 border text-center">Balance</th>
                  <th className="p-2 border text-center">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {reportData.map((item, i) => (
                  <tr key={i} className="border border-gray-700">
                    <td className="p-2 border text-center">
                      {new Date(item.date).toLocaleDateString("en-GB")}
                    </td>

                    <td className="p-2 border text-center text-green-400">
                      {item.type === "deposit" ? item.amount : ""}
                    </td>

                    <td className="p-2 border text-center text-red-400">
                      {item.type === "withdraw" ? item.amount : ""}
                    </td>

                    <td className="p-2 border text-center text-yellow-300">
                      {item.type === "deposit"
                        ? `+${item.amount}`
                        : `-${item.amount}`}
                    </td>

                    <td className="p-2 border text-center text-gray-300">
                      {item.note}
                    </td>
                  </tr>
                ))}

                {/* TOTAL */}
                <tr className="bg-yellow-900 font-bold text-center">
                  <td className="p-2 border">TOTAL</td>
                  <td className="p-2 border text-green-400">{totalDeposit}</td>
                  <td className="p-2 border text-red-400">{totalWithdraw}</td>
                  <td className="p-2 border text-yellow-300">{balance}</td>
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