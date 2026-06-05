import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ReportFilter from "../components/ReportFilter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Buy = () => {
  const navigate = useNavigate();

  // ✅ Bangladesh Local Date (Safe & Clean)
  const getBDDate = () => {
    const options = {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    return new Intl.DateTimeFormat("en-GB", options)
      .format(new Date())
      .replace(/ /g, "-");
  };

  const userId = "demo-user";
  const [stockName, setStockName] = useState("");
  const [buyQuantity, setBuyQuantity] = useState("");
  const [perShareValue, setPerShareValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-calculated fields
  const [buyingTotalShareValue, setBuyingTotalShareValue] = useState(0);
  const [commission, setCommission] = useState(0);
  const [totalValueWithCommission, setTotalValueWithCommission] = useState(0);

  const [buyList, setBuyList] = useState([]);
  const [filteredBuyList, setFilteredBuyList] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [fromDate, setFromDate] = useState(getBDDate());
  const [toDate, setToDate] = useState(getBDDate());
  const [viewLoading, setViewLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const getFirstDayOfMonth = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );

    const year = bd.getFullYear();
    const month = String(bd.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const formatDateString = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    return parsed.toISOString().split("T")[0];
  };

  const fetchBuyRecords = async () => {
    try {
      const res = await api.get(`/buy/${userId}`);
      setBuyList(res.data || []);
      return res.data || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const handleViewReport = async () => {
    setViewLoading(true);

    try {
      const buys = buyList.length ? buyList : await fetchBuyRecords();
      const filtered = (buys || []).filter((item) => {
        const itemDate = formatDateString(item.createdAt || item.date);
        return itemDate >= fromDate && itemDate <= toDate;
      });

      setFilteredBuyList(filtered);
      setShowReport(true);
    } finally {
      setViewLoading(false);
    }
  };

  const handleResetReport = () => {
    setResetLoading(true);

    setTimeout(() => {
      setFromDate(getFirstDayOfMonth());
      setToDate(getBDDate());
      setFilteredBuyList(buyList);
      setShowReport(false);
      setResetLoading(false);
    }, 100);
  };

  const handleExportReport = async () => {
    const data = showReport ? filteredBuyList : buyList;

    if (!data || data.length === 0) {
      alert("No buy data to export. View report first.");
      return;
    }

    setExportLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Buy Report");

      sheet.addRow([
        "Date",
        "Stock Name",
        "Buy Quantity",
        "Per Share Value",
        "Total Value",
        "Commission",
        "Total with Commission",
      ]);

      data.forEach((item) => {
        sheet.addRow([
          formatDateString(item.createdAt || item.date),
          item.stockName,
          item.buyQuantity || item.quantity || "-",
          item.perShareValue || item.price || "-",
          item.buyingTotalShareValue || item.total || "-",
          item.commission || "-",
          item.totalValueWithCommission || item.total || "-",
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `buy_report_${fromDate}_${toDate}.xlsx`);
    } catch (err) {
      console.log(err);
      alert("Unable to export buy report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // AUTO-CALCULATE FIELDS
  useEffect(() => {
    const qty = parseFloat(buyQuantity) || 0;
    const perShare = parseFloat(perShareValue) || 0;

    const totalShareValue = qty * perShare;
    setBuyingTotalShareValue(totalShareValue);

    const commissionAmount = totalShareValue * 0.004; // 0.4%
    setCommission(commissionAmount);

    const finalValue = totalShareValue + commissionAmount;
    setTotalValueWithCommission(finalValue);
  }, [buyQuantity, perShareValue]);

  const handleSave = async () => {
    if (!buyQuantity || !perShareValue) {
      alert("Buy Quantity and Per Share Value are required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/buy/add", {
        userId,
        stockName,
        buyQuantity: parseFloat(buyQuantity),
        perShareValue: parseFloat(perShareValue),
        buyingTotalShareValue,
        commission,
        totalValueWithCommission,
        date: getBDDate(),
      });

      alert("Buy saved successfully!");

      setStockName("");
      setBuyQuantity("");
      setPerShareValue("");
    } catch (err) {
      alert(err.response?.data?.message || "Error saving buy");
    } finally {
      setLoading(false);
    }
  };

  // RESET FORM
  const handleReset = () => {
    setStockName("");
    setBuyQuantity("");
    setPerShareValue("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🟢 Buy Stocks</h1>

          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/dashboard");
              }
            }}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* CURRENT DATE */}
        <div className="bg-gray-800 p-3 rounded-lg mb-4 text-center">
          <p className="text-gray-400 text-sm">Today's Date</p>
          <p className="text-xl font-semibold text-white">{getBDDate()}</p>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
          {/* STOCK NAME */}
          <div>
            <label className="text-gray-400 text-sm">Stock Name</label>
            <input
              placeholder="Stock Name"
              className="w-full p-3 bg-gray-800 rounded border border-gray-700"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
            />
          </div>

          {/* BUY QUANTITY - EDITABLE (REQUIRED) */}
          <div>
            <label className="text-gray-400 text-sm">
              Buy Quantity <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Buy Quantity"
              type="number"
              step="0.01"
              className={`w-full p-3 bg-gray-800 rounded border-2 ${
                !buyQuantity ? "border-red-500" : "border-gray-700"
              }`}
              value={buyQuantity}
              onChange={(e) => setBuyQuantity(e.target.value)}
            />
          </div>

          {/* PER SHARE VALUE - EDITABLE (REQUIRED) */}
          <div>
            <label className="text-gray-400 text-sm">
              Per Share Value <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Per Share Value"
              type="number"
              step="0.01"
              className={`w-full p-3 bg-gray-800 rounded border-2 ${
                !perShareValue ? "border-red-500" : "border-gray-700"
              }`}
              value={perShareValue}
              onChange={(e) => setPerShareValue(e.target.value)}
            />
          </div>

          {/* BUYING TOTAL SHARE VALUE - READ-ONLY */}
          <div>
            <label className="text-gray-400 text-sm">
              Buying Total Share Value
            </label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold">
              {buyingTotalShareValue.toFixed(2)}
            </div>
          </div>

          {/* COMMISSION - READ-ONLY */}
          <div>
            <label className="text-gray-400 text-sm">Commission (0.4%)</label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold">
              {commission.toFixed(2)}
            </div>
          </div>

          {/* TOTAL VALUE WITH COMMISSION - READ-ONLY */}
          <div>
            <label className="text-gray-400 text-sm">
              Total Value with Commission
            </label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-green-400 font-bold text-lg">
              {totalValueWithCommission.toFixed(2)}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 p-3 rounded font-bold"
            >
              {loading ? "Saving..." : "Save Buy"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 p-3 rounded font-bold"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Buy Report</h2>
              <p className="text-gray-400 text-sm">
                View, export, or reset buy reports from here.
              </p>
            </div>
          </div>

          <ReportFilter
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
            handleView={handleViewReport}
            handleExport={handleExportReport}
            handleReset={handleResetReport}
            filterLoading={viewLoading}
            reportLoading={exportLoading}
            resetLoading={resetLoading}
          />

          {showReport ? (
            <div className="overflow-x-auto bg-gray-950 rounded-2xl border border-gray-800 p-3">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800 text-gray-200">
                  <tr>
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Stock</th>
                    <th className="p-3 border">Quantity</th>
                    <th className="p-3 border">Price</th>
                    <th className="p-3 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyList.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-800 hover:bg-gray-900"
                    >
                      <td className="p-3">
                        {formatDateString(item.createdAt || item.date)}
                      </td>
                      <td className="p-3">{item.stockName}</td>
                      <td className="p-3">
                        {item.buyQuantity || item.quantity || "-"}
                      </td>
                      <td className="p-3">
                        {item.perShareValue || item.price || "-"}
                      </td>
                      <td className="p-3">
                        {item.totalValueWithCommission || item.total || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-6">
              Click View to show buy report data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Buy;
