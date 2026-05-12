import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Buy = () => {
  const navigate = useNavigate();

  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const userId = "demo-user";

      await api.post("/buy/add", {
        userId,
        stockName,
        quantity,
        price,
      });

      alert("Buy saved successfully!");
      setStockName("");
      setQuantity("");
      setPrice("");

    } catch (err) {
      alert("Error saving buy");
    } finally {
      setLoading(false);
    }
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

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">

          <input
            placeholder="Stock Name"
            className="w-full p-3 mb-3 bg-gray-800 rounded"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
          />

          <input
            placeholder="Quantity"
            type="number"
            className="w-full p-3 mb-3 bg-gray-800 rounded"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            placeholder="Price"
            type="number"
            className="w-full p-3 mb-3 bg-gray-800 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
          >
            {loading ? "Saving..." : "Save Buy"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default Buy;