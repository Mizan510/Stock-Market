import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ReportFilter from "../components/ReportFilter";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Sale = () => {
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

  const [stockName, setStockName] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [perShareValue, setPerShareValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-calculated fields
  const [sallingTotalShareValue, setSallingTotalShareValue] = useState(0);
  const [commission, setCommission] = useState(0);
  const [totalValueWithCommission, setTotalValueWithCommission] = useState(0);

  const [stockList, setStockList] = useState([]);
  const [showList, setShowList] = useState(false);

  const [saleList, setSaleList] = useState([]);
  const [filteredSaleList, setFilteredSaleList] = useState([]);
  const [showSaleReport, setShowSaleReport] = useState(false);
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

  const fetchSaleRecords = async () => {
    try {
      const res = await api.get(`/sale/demo-user`);
      setSaleList(res.data || []);
      return res.data || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const handleViewReport = async () => {
    setViewLoading(true);

    try {
      const sales = saleList.length ? saleList : await fetchSaleRecords();
      const filtered = (sales || []).filter((item) => {
        const itemDate = formatDateString(item.createdAt || item.date);
        return itemDate >= fromDate && itemDate <= toDate;
      });

      setFilteredSaleList(filtered);
      setShowSaleReport(true);
    } finally {
      setViewLoading(false);
    }
  };

  const handleResetReport = () => {
    setResetLoading(true);

    setTimeout(() => {
      setFromDate(getFirstDayOfMonth());
      setToDate(getBDDate());
      setFilteredSaleList(saleList);
      setShowSaleReport(false);
      setResetLoading(false);
    }, 100);
  };

  const handleExportReport = async () => {
    const data = showSaleReport ? filteredSaleList : saleList;

    if (!data || data.length === 0) {
      alert("No sale data to export. View report first.");
      return;
    }

    setExportLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sale Report");

      sheet.addRow([
        "Date",
        "Stock Name",
        "Sale Quantity",
        "Per Share Value",
        "Total Value",
        "Commission",
        "Total with Commission",
      ]);

      data.forEach((item) => {
        sheet.addRow([
          formatDateString(item.createdAt || item.date),
          item.stockName,
          item.saleQuantity || "-",
          item.perShareValue || item.price || "-",
          item.sallingTotalShareValue || item.total || "-",
          item.commission || "-",
          item.totalValueWithCommission || item.total || "-",
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `sale_report_${fromDate}_${toDate}.xlsx`);
    } catch (err) {
      console.log(err);
      alert("Unable to export sale report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // FETCH BUYED STOCK NAMES
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const userId = "demo-user";
        const res = await api.get(`/buy/names/${userId}`);
        setStockList(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchStocks();
  }, []);

  // AUTO-CALCULATE FIELDS
  useEffect(() => {
    const qty = parseFloat(saleQuantity) || 0;
    const perShare = parseFloat(perShareValue) || 0;

    const totalShareValue = qty * perShare;
    setSallingTotalShareValue(totalShareValue);

    const commissionAmount = totalShareValue * 0.004; // 0.4%
    setCommission(commissionAmount);

    const finalValue = totalShareValue - commissionAmount;
    setTotalValueWithCommission(finalValue);
  }, [saleQuantity, perShareValue]);

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = () => setShowList(false);
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // SAVE SALE
  const handleSave = async () => {
    if (!saleQuantity || !perShareValue) {
      return alert("Sale Quantity and Per Share Value are required");
    }

    try {
      setLoading(true);

      const userId = "demo-user";

      const res = await api.post("/sale/add", {
        userId,
        stockName,
        saleQuantity: parseFloat(saleQuantity),
        perShareValue: parseFloat(perShareValue),
        sallingTotalShareValue,
        commission,
        totalValueWithCommission,
        date: getBDDate(),
      });

      alert(res.data.message);

      setStockName("");
      setSaleQuantity("");
      setPerShareValue("");
    } catch (err) {
      alert(err.response?.data?.message || "Error saving sale");
    } finally {
      setLoading(false);
    }
  };

  // RESET FORM
  const handleReset = () => {
    setStockName("");
    setSaleQuantity("");
    setPerShareValue("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🔴 Sale Stocks</h1>

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
          {/* STOCK DROPDOWN */}
          <div className="relative">
            <input
              placeholder="Stock Name"
              className="w-full p-3 bg-gray-800 rounded"
              value={stockName}
              onChange={(e) => {
                setStockName(e.target.value);
                setShowList(true);
              }}
              onFocus={() => setShowList(true)}
            />

            {showList && stockList.length > 0 && (
              <div className="absolute z-10 w-full bg-gray-900 border border-gray-700 rounded max-h-40 overflow-y-auto mt-1">
                {stockList
                  .filter((item) =>
                    item.toLowerCase().includes(stockName.toLowerCase()),
                  )
                  .map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setStockName(item);
                        setShowList(false);
                      }}
                      className="p-2 hover:bg-gray-700 cursor-pointer"
                    >
                      {item}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* SALE QUANTITY - EDITABLE (REQUIRED) */}
          <div>
            <label className="text-gray-400 text-sm">
              Sale Quantity <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Sale Quantity"
              type="number"
              step="0.01"
              className={`w-full p-3 bg-gray-800 rounded border-2 ${
                !saleQuantity ? "border-red-500" : "border-gray-700"
              }`}
              value={saleQuantity}
              onChange={(e) => setSaleQuantity(e.target.value)}
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

          {/* SALLING TOTAL SHARE VALUE - READ-ONLY */}
          <div>
            <label className="text-gray-400 text-sm">
              Salling Total Share Value
            </label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold">
              {sallingTotalShareValue.toFixed(2)}
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
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 p-3 rounded font-bold"
            >
              {loading ? "Saving..." : "Save Sale"}
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
              <h2 className="text-xl font-bold">Sale Report</h2>
              <p className="text-gray-400 text-sm">
                View, export, or reset sale reports from here.
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

          {showSaleReport ? (
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
                  {filteredSaleList.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-800 hover:bg-gray-900"
                    >
                      <td className="p-3">
                        {formatDateString(item.createdAt || item.date)}
                      </td>
                      <td className="p-3">{item.stockName}</td>
                      <td className="p-3">{item.saleQuantity || "-"}</td>
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
              Click View to show sale report data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sale;
