import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function StockCalculator() {
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyQty, setBuyQty] = useState("");
  const [sellQty, setSellQty] = useState("");
  const [fee, setFee] = useState(0.4);

  // AUTO COPY BUY QTY → SELL QTY
  useEffect(() => {
    setSellQty(buyQty);
  }, [buyQty]);

  // RESET
  const handleReset = () => {
    setBuyPrice("");
    setSellPrice("");
    setBuyQty("");
    setSellQty("");
    setFee(0.4);
  };

  // CALCULATIONS
  const buyTotal = Number(buyPrice || 0) * Number(buyQty || 0);
  const sellTotal = Number(sellPrice || 0) * Number(sellQty || 0);

  const buyFee = (buyTotal * Number(fee || 0)) / 100;
  const sellFee = (sellTotal * Number(fee || 0)) / 100;

  const totalFee = buyFee + sellFee;

  const totalBuyValue = buyTotal + buyFee;
  const totalSellValue = sellTotal - sellFee;

  const grossProfit = sellTotal - buyTotal;
  const netProfit = totalSellValue - totalBuyValue;

  return (
    <div className="h-dvh bg-black flex flex-col text-white overflow-hidden">
      
      <div className="flex-1 p-2 flex items-start justify-center overflow-hidden">
        
        <div className="bg-gray-900 p-3 sm:p-4 rounded-xl w-full max-w-3xl max-h-full overflow-hidden">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-2">

            <Link to="/login">
              <h2 className="text-xl sm:text-3xl font-bold tracking-wide hover:text-blue-400 transition cursor-pointer">
                📊 Stock Calculator
              </h2>
            </Link>

            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 sm:px-7 sm:py-1 rounded-xl text-base sm:text-lg font-semibold"
            >
              Reset
            </button>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">

            {/* BUY */}
            <div className="bg-gray-800 p-2 sm:p-3 rounded-lg space-y-2">

              <h3 className="text-green-400 text-sm font-bold">
                BUY
              </h3>

              <input
                placeholder="Qty"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
                inputMode="numeric"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <input
                placeholder="Price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                inputMode="decimal"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <input
                placeholder="Fee %"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                inputMode="decimal"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <div className="text-sm border-t border-gray-700 pt-1">
                <p>Fee: {Math.round(buyFee)}</p>

                <p className="text-green-300 font-bold">
                  Buy Value: {Math.round(totalBuyValue)}
                </p>
              </div>
            </div>

            {/* SELL */}
            <div className="bg-gray-800 p-2 sm:p-3 rounded-lg space-y-2">

              <h3 className="text-red-400 text-sm font-bold">
                SELL
              </h3>

              <input
                placeholder="Qty"
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                inputMode="numeric"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <input
                placeholder="Price"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                inputMode="decimal"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <input
                placeholder="Fee %"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                inputMode="decimal"
                className="w-full p-2 rounded-lg bg-gray-900 text-sm outline-none"
              />

              <div className="text-sm border-t border-gray-700 pt-1">
                <p>Fee: {Math.round(sellFee)}</p>

                <p className="text-red-300 font-bold">
                  Sell Value: {Math.round(totalSellValue)}
                </p>
              </div>
            </div>
          </div>

          {/* PROFIT */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-base sm:text-xl font-bold">

            <div className="bg-gray-800 p-2 rounded-lg">
              Gross Profit: {Math.round(grossProfit)}
            </div>

            <div className="bg-gray-800 p-2 rounded-lg text-red-400 font-bold">
              Total Fee: {Math.round(totalFee)}
            </div>

            <div className="col-span-2 text-center font-bold text-base sm:text-3xl border border-gray-700 p-2 rounded-lg">

              Net Profit:{" "}

              <span
                className={
                  netProfit >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {Math.round(netProfit)}
              </span>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}