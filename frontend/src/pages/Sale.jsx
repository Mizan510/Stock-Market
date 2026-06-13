import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import SaleReport from "../components/SaleReport";
import { useConfirm } from "../components/ConfirmProvider";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const Sale = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const userId = getCurrentUserId();

  // ✅ Get local Bangladesh Date formatted for native input element (YYYY-MM-DD)
  const getInitialBDDate = () => {
    const d = new Date();
    const localizedStr = d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const localizedDate = new Date(localizedStr);

    const year = localizedDate.getFullYear();
    const month = String(localizedDate.getMonth() + 1).padStart(2, "0");
    const day = String(localizedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [stockName, setStockName] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [perShareValue, setPerShareValue] = useState("");
  const [saleDate, setSaleDate] = useState(getInitialBDDate()); // ✅ NEW: State for customizable sale entry date
  const [loading, setLoading] = useState(false);

  // Auto-calculated fields
  const [sallingTotalShareValue, setSallingTotalShareValue] = useState(0);
  const [commission, setCommission] = useState(0);
  const [totalValueWithCommission, setTotalValueWithCommission] = useState(0);

  const [stockList, setStockList] = useState([]);
  const [showList, setShowList] = useState(false);

  const [saleList, setSaleList] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
      const res = await api.get(`/sale/${userId}`);
      setSaleList(res.data || []);
      return res.data || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    fetchSaleRecords();
  }, []);

  // FETCH BUYED STOCK NAMES
  useEffect(() => {
    const fetchStocks = async () => {
      try {
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
    if (!saleQuantity || !perShareValue || !saleDate) {
      return showAlert("Sale Quantity, Per Share Value, and Entry Date are required");
    }

    try {
      setLoading(true);

      if (editingId) {
        const res = await api.put(`/sale/update/${editingId}`, {
          stockName,
          saleQuantity: parseFloat(saleQuantity),
          perShareValue: parseFloat(perShareValue),
          sallingTotalShareValue,
          commission,
          totalValueWithCommission,
          date: saleDate, // ✅ Passes the edited date on updates
        });

        const updated = res.data.data || res.data || {};
        setSaleList((prev) =>
          prev.map((item) => (item._id === editingId ? updated : item)),
        );
        setEditingId(null);
        setSaleDate(getInitialBDDate());
        showSuccessAlert(res.data.message || "Sale updated successfully!");
      } else {
        const res = await api.post("/sale/add", {
          userId,
          stockName,
          saleQuantity: parseFloat(saleQuantity),
          perShareValue: parseFloat(perShareValue),
          sallingTotalShareValue,
          commission,
          totalValueWithCommission,
          date: saleDate, // ✅ UPDATED: Dynamic state input string instead of static function execution
        });

        const saved = res.data?.data || res.data;
        if (saved) {
          setSaleList((prev) => [saved, ...prev]);
        }
        showSuccessAlert(res.data.message);
        setSaleDate(getInitialBDDate());
      }

      setStockName("");
      setSaleQuantity("");
      setPerShareValue("");
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Error saving sale");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setStockName(item.stockName || "");
    setSaleQuantity(item.saleQuantity ?? "");
    setPerShareValue(item.perShareValue ?? "");

    // Format incoming database date string properly to initialize field layout view
    if (item.date) {
      setSaleDate(formatDateString(item.date));
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = await confirm("Delete this sale record?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/sale/delete/${item._id}`);
      setSaleList((prev) => prev.filter((sale) => sale._id !== item._id));
      if (editingId === item._id) {
        setEditingId(null);
        setStockName("");
        setSaleQuantity("");
        setPerShareValue("");
        setSaleDate(getInitialBDDate());
      }
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Delete failed");
    }
  };

  // RESET FORM
  const handleReset = () => {
    setStockName("");
    setSaleQuantity("");
    setPerShareValue("");
    setSaleDate(getInitialBDDate()); // ✅ Safely returns calendar state back to today's date context
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🔴 Sale Stocks</h1>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
          
          {/* ✅ TRANSACTION ENTRY DATE - MOVED AND RENDERED AS EDITABLE INPUT */}
          <div>
            <label className="text-gray-400 text-sm">
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold focus:outline-hidden focus:border-red-500 color-scheme-dark"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              style={{ colorScheme: "dark" }} // Enforces clean native browser styling over custom dark layout templates
            />
          </div>

          {/* STOCK DROPDOWN */}
          <div className="relative">
            <label className="text-gray-400 text-sm">Stock Name</label>
            <input
              placeholder="Stock Name"
              className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:outline-hidden focus:border-gray-500"
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
              className={`w-full p-3 bg-gray-800 rounded border-2 focus:outline-hidden ${
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
              className={`w-full p-3 bg-gray-800 rounded border-2 focus:outline-hidden ${
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
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 p-3 rounded font-bold cursor-pointer transition-colors text-white"
            >
              {loading
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Sale"
                  : "Save Sale"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 p-3 rounded font-bold cursor-pointer transition-colors text-white"
            >
              Reset
            </button>
          </div>
        </div>

        <SaleReport
          saleList={saleList}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Sale;