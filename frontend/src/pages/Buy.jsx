import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import BuyReport from "../components/BuyReport";
import { useConfirm } from "../components/ConfirmProvider";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const Buy = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // ✅ Get clean local Bangladesh Date formatted for native input element (YYYY-MM-DD)
  const getInitialBDDate = () => {
    const d = new Date();
    const localizedStr = d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const localizedDate = new Date(localizedStr);
    
    const year = localizedDate.getFullYear();
    const month = String(localizedDate.getMonth() + 1).padStart(2, "0");
    const day = String(localizedDate.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  };

  const userId = getCurrentUserId();
  const [stockName, setStockName] = useState("");
  const [buyQuantity, setBuyQuantity] = useState("");
  const [perShareValue, setPerShareValue] = useState("");
  const [buyDate, setBuyDate] = useState(getInitialBDDate()); 
  const [loading, setLoading] = useState(false);

  // Auto-calculated fields
  const [buyingTotalShareValue, setBuyingTotalShareValue] = useState(0);
  const [commission, setCommission] = useState(0);
  const [totalValueWithCommission, setTotalValueWithCommission] = useState(0);

  const [buyList, setBuyList] = useState([]);
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    fetchBuyRecords();
  }, []);

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
    if (!buyQuantity || !perShareValue || !buyDate) {
      showAlert("Buy Quantity, Per Share Value, and Entry Date are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        const res = await api.put(`/buy/update/${editingId}`, {
          stockName,
          buyQuantity: parseFloat(buyQuantity),
          perShareValue: parseFloat(perShareValue),
          buyingTotalShareValue,
          commission,
          totalValueWithCommission,
          quantity: parseFloat(buyQuantity),
          price: parseFloat(perShareValue),
          total: totalValueWithCommission,
          date: buyDate,     // Key Option 1
          buyDate: buyDate,  // Key Option 2 (Matches backend fallback names if required)
        });

        let updated = res.data.data || res.data || {};
        
        // 🛠️ Force the user-selected date into state to stop server timestamps overwriting it
        updated = { ...updated, date: buyDate, buyDate: buyDate };

        setBuyList((prev) =>
          prev.map((b) => (b._id === editingId ? updated : b)),
        );
        setEditingId(null);
        setStockName("");
        setBuyQuantity("");
        setPerShareValue("");
        setBuyDate(getInitialBDDate());
        showSuccessAlert(res.data.message || "Buy updated successfully!");
      } else {
        const res = await api.post("/buy/add", {
          userId,
          stockName,
          buyQuantity: parseFloat(buyQuantity),
          perShareValue: parseFloat(perShareValue),
          buyingTotalShareValue,
          commission,
          totalValueWithCommission,
          date: buyDate,     // Key Option 1
          buyDate: buyDate,  // Key Option 2 (Matches backend fallback names if required)
        });

        let saved = res.data?.buy || res.data?.data || res.data;
        
        if (saved) {
          // 🛠️ Force the user-selected date into state to stop server timestamps overwriting it
          saved = { ...saved, date: buyDate, buyDate: buyDate };
          setBuyList((prev) => [saved, ...prev]);
        }
        
        showSuccessAlert(res.data.message || "Buy saved successfully!");

        setStockName("");
        setBuyQuantity("");
        setPerShareValue("");
        setBuyDate(getInitialBDDate());
      }
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Error saving buy");
    } division: {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setStockName(item.stockName || "");
    setBuyQuantity(item.buyQuantity ?? item.quantity ?? "");
    setPerShareValue(item.perShareValue ?? item.price ?? "");
    
    // Check both potential key naming choices coming down from database
    const rawTargetDate = item.date || item.buyDate;
    if (rawTargetDate) {
      setBuyDate(formatDateString(rawTargetDate));
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = await confirm("Delete this buy record?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/buy/delete/${item._id}`);
      setBuyList((prev) => prev.filter((b) => b._id !== item._id));
      if (editingId === item._id) {
        setEditingId(null);
        setStockName("");
        setBuyQuantity("");
        setPerShareValue("");
        setBuyDate(getInitialBDDate());
      }
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleReset = () => {
    setStockName("");
    setBuyQuantity("");
    setPerShareValue("");
    setBuyDate(getInitialBDDate()); 
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🟢 Buy Stocks</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
          <div>
            <label className="text-gray-400 text-sm">
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold focus:outline-hidden focus:border-green-500"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              style={{ colorScheme: "dark" }} 
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Stock Name</label>
            <input
              placeholder="Stock Name"
              className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:outline-hidden focus:border-gray-500"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">
              Buy Quantity <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Buy Quantity"
              type="number"
              step="0.01"
              className={`w-full p-3 bg-gray-800 rounded border-2 focus:outline-hidden ${
                !buyQuantity ? "border-red-500" : "border-gray-700"
              }`}
              value={buyQuantity}
              onChange={(e) => setBuyQuantity(e.target.value)}
            />
          </div>

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

          <div>
            <label className="text-gray-400 text-sm">
              Buying Total Share Value
            </label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold">
              {buyingTotalShareValue.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Commission (0.4%)</label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white font-semibold">
              {commission.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">
              Total Value with Commission
            </label>
            <div className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-green-400 font-bold text-lg">
              {totalValueWithCommission.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 p-3 rounded font-bold cursor-pointer transition-colors text-white"
            >
              {loading
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Buy"
                  : "Save Buy"}
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

        <BuyReport
          buyList={buyList}
          userId={userId}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Buy;