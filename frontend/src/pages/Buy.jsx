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

  const userId = getCurrentUserId();
  const [stockName, setStockName] = useState("");
  const [buyQuantity, setBuyQuantity] = useState("");
  const [perShareValue, setPerShareValue] = useState("");
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

  // AUTO-CALCULATE FIELDS
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
    if (!buyQuantity || !perShareValue) {
      showAlert("Buy Quantity and Per Share Value are required");
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
        });

        const updated = res.data.data || res.data || {};
        setBuyList((prev) =>
          prev.map((b) => (b._id === editingId ? updated : b)),
        );
        setEditingId(null);
        setStockName("");
        setBuyQuantity("");
        setPerShareValue("");
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
          date: getBDDate(),
        });

        const saved = res.data?.buy || res.data?.data || res.data;
        if (saved) setBuyList((prev) => [saved, ...prev]);
        showSuccessAlert(res.data.message || "Buy saved successfully!");

        setStockName("");
        setBuyQuantity("");
        setPerShareValue("");
      }
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Error saving buy");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setStockName(item.stockName || "");
    setBuyQuantity(item.buyQuantity ?? item.quantity ?? "");
    setPerShareValue(item.perShareValue ?? item.price ?? "");
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
      }
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Delete failed");
    }
  };

  // RESET FORM
  const handleReset = () => {
    setStockName("");
    setBuyQuantity("");
    setPerShareValue("");
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🟢 Buy Stocks</h1>

          <button
            onClick={() => navigate("/dashboard")}
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
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 p-3 rounded font-bold"
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
