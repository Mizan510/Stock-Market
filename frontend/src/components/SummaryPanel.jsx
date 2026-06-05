import React from "react";

const SummaryPanel = ({
  loading = false,
  deposit = 0,
  withdraw = 0,
  dividend = 0,
  balance = 0,
  profit = 0,
  remainingShareValue = 0,
  totalAssets = 0,
  realizedProfit = 0,
  unrealizedProfit = 0,
  holdingCount = 0,
}) => {
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    return `৳ ${Number(amount || 0).toFixed(2)}`;
  };

  const Card = ({ title, value, color, subtitle, icon }) => (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 hover:bg-gray-800 transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-gray-400 mb-2 wrap-break-word leading-snug">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <p
        className={`text-2xl font-bold mt-3 overflow-wrap: break-word leading-tight ${color}`}
      >
        {value}
      </p>
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          💼 Investment Portfolio
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Complete financial overview & portfolio analytics
        </p>
      </div>

      {/* ===================================== */}
      {/* SECTION 1: CASH FLOW */}
      {/* ===================================== */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          💵 Cash Flow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="Deposit"
            subtitle="Money Added"
            value={formatMoney(deposit)}
            color="text-green-400"
            icon="📥"
          />
          <Card
            title="Withdraw"
            subtitle="Money Removed"
            value={formatMoney(withdraw)}
            color="text-red-400"
            icon="📤"
          />
          <Card
            title="Dividend Income"
            subtitle="Stock Dividends"
            value={formatMoney(dividend)}
            color="text-cyan-300"
            icon="💎"
          />
          <Card
            title="Available Cash"
            subtitle="Ready to Invest"
            value={formatMoney(balance)}
            color="text-yellow-300"
            icon="💰"
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* SECTION 2: HOLDINGS & VALUE */}
      {/* ===================================== */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📊 Holdings & Value
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Holdings Value"
            subtitle={`${holdingCount} Stocks Held`}
            value={formatMoney(remainingShareValue)}
            color="text-purple-300"
            icon="📈"
          />
          <Card
            title="Cash Balance"
            subtitle="Uninvested"
            value={formatMoney(balance)}
            color="text-yellow-300"
            icon="🏦"
          />
          <Card
            title="Total Assets"
            subtitle="Portfolio Value"
            value={formatMoney(totalAssets)}
            color="text-pink-300"
            icon="👑"
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* SECTION 3: PROFIT & LOSS */}
      {/* ===================================== */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📈 Profit & Loss Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Realized Profit"
            subtitle="From Completed Sales"
            value={formatMoney(realizedProfit)}
            color={realizedProfit >= 0 ? "text-emerald-400" : "text-red-500"}
            icon="✅"
          />
          <Card
            title="Unrealized Profit"
            subtitle="Current Holdings"
            value={formatMoney(unrealizedProfit)}
            color={unrealizedProfit >= 0 ? "text-emerald-400" : "text-red-500"}
            icon="🔄"
          />
          <Card
            title="Total Profit/Loss"
            subtitle="Overall Performance"
            value={formatMoney(profit)}
            color={profit >= 0 ? "text-emerald-400" : "text-red-500"}
            icon={profit >= 0 ? "🎯" : "⚠️"}
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* SECTION 4: KEY METRICS */}
      {/* ===================================== */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          ⚙️ Key Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="ROI"
            subtitle="Return on Investment"
            value={
              totalAssets > 0
                ? `${((profit / deposit) * 100).toFixed(2)}%`
                : "0%"
            }
            color={profit >= 0 ? "text-green-400" : "text-red-400"}
            icon="📊"
          />
          <Card
            title="Holdings Count"
            subtitle="Unique Stocks"
            value={holdingCount}
            color="text-blue-400"
            icon="📌"
          />
          <Card
            title="Total Invested"
            subtitle="In Holdings"
            value={formatMoney(remainingShareValue)}
            color="text-indigo-400"
            icon="💳"
          />
          <Card
            title="Portfolio Health"
            subtitle="Diversification"
            value={holdingCount > 0 ? "Good" : "N/A"}
            color={holdingCount > 0 ? "text-lime-400" : "text-gray-400"}
            icon={holdingCount > 0 ? "✨" : "❌"}
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
