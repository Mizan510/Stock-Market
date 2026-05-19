import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

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
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const [stockList, setStockList] = useState([]);
  const [showList, setShowList] = useState(false);

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

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = () => setShowList(false);
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // SAVE SALE
  const handleSave = async () => {
    if (!stockName || !quantity || !price) {
      return alert("Please fill all fields");
    }

    try {
      setLoading(true);

      const userId = "demo-user";

      const res = await api.post("/sale/add", {
        userId,
        stockName,
        quantity,
        price,
        date: getBDDate(), // optional but useful for backend/report
      });

      alert(res.data.message);

      setStockName("");
      setQuantity("");
      setPrice("");
    } catch (err) {
      alert(err.response?.data?.message || "Error saving sale");
    } finally {
      setLoading(false);
    }
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

          {/* QUANTITY */}
          <input
            placeholder="Quantity"
            type="number"
            className="w-full p-3 bg-gray-800 rounded"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {/* PRICE */}
          <input
            placeholder="Price"
            type="number"
            className="w-full p-3 bg-gray-800 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          {/* BUTTON */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 p-3 rounded font-bold"
          >
            {loading ? "Saving..." : "Save Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sale;
