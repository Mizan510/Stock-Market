import React from "react";

const SummaryPanel = ({
  loading,
  deposit = 0,
  withdraw = 0,
  balance = 0,
  profit = 0,
  dividend = 0,
}) => {
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    return `৳ ${Number(amount || 0).toFixed(2)}`;
  };

  const Card = ({ title, value, color }) => (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 hover:bg-gray-800 transition-all duration-300 shadow-lg  min-height: 140px;] flex flex-col justify-between overflow-hidden">
      <h3 className="text-sm text-gray-400 mb-3 wrap-break-word leading-snug">
        {title}
      </h3>

      <p className={`text-2xl font-bold ${color}  overflow-wrap: break-word leading-tight`}>
        {value}
      </p>
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          🏦 Investment Summary
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Financial overview & portfolio analytics
        </p>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Deposit */}
        <Card
          title="Deposit"
          value={formatMoney(deposit)}
          color="text-green-400"
        />

        {/* Withdraw */}
        <Card
          title="Withdraw"
          value={formatMoney(withdraw)}
          color="text-red-400"
        />

        {/* Profit */}
        <Card
          title="Profit"
          value={formatMoney(profit)}
          color={
            profit >= 0
              ? "text-emerald-400"
              : "text-red-500"
          }
        />

        {/* Dividend */}
        <Card
          title="Dividend"
          value={formatMoney(dividend)}
          color="text-cyan-300"
        />

        {/* Balance */}
        <Card
          title="Balance"
          value={formatMoney(balance)}
          color="text-yellow-300"
        />

        {/* Total Assets */}
        <Card
          title="Current Assets"
          value={formatMoney(balance + profit + dividend)}
          color="text-pink-300"
        />

      </div>
    </div>
  );
};

export default SummaryPanel;