import React from "react";

const SummaryPanel = ({
  loading = false,
  deposit = 0,
  withdraw = 0,
  dividend = 0,
  balance = 0,
  profit = 0,
  remainingShareValue = 0,
  totalBuyCost = 0,
  totalAssets = 0,
  totalBuyQty = 0,
  totalSaleQty = 0,
  totalSaleValueWithCommission = 0,
  totalRemainQty = 0,
  tillNowProfitLoss = 0,
  tillNowCurrentAssets = 0,
}) => {
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    return `৳ ${Number(amount || 0).toFixed(2)}`;
  };

  const Card = ({
    title,
    value,
    subtitle,
    icon,
    bgColor = "bg-slate-950",
    borderColor = "border-slate-800",
    accent = "text-white",
  }) => (
    <div
      className={`p-5 rounded-2xl border ${borderColor} ${bgColor} hover:shadow-xl transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-gray-300 mb-2 leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <p className={`text-2xl font-bold mt-3 leading-tight ${accent}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">💼 Portfolio Summary</h2>
        <p className="text-gray-400 text-sm mt-1">
          High-level portfolio performance and ROI at a glance
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📦 Total Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Total Deposit"
            subtitle="Money added so far"
            value={formatMoney(deposit)}
            bgColor="bg-emerald-950"
            borderColor="border-emerald-700"
            accent="text-emerald-300"
            icon="📥"
          />
          <Card
            title="Total Withdraw"
            subtitle="Money removed so far"
            value={formatMoney(withdraw)}
            bgColor="bg-red-950"
            borderColor="border-red-700"
            accent="text-red-300"
            icon="📤"
          />
          <Card
            title="Net Cash Invested"
            subtitle="Deposit minus withdraw"
            value={formatMoney(deposit - withdraw)}
            bgColor="bg-yellow-950"
            borderColor="border-yellow-700"
            accent="text-yellow-300"
            icon="💰"
          />
          <Card
            title="Shares Purchased"
            subtitle="Total shares bought"
            value={totalBuyQty}
            bgColor="bg-indigo-950"
            borderColor="border-indigo-700"
            accent="text-indigo-300"
            icon="🟢"
          />
          <Card
            title="Buy Value After Fees"
            subtitle="Total purchase cost"
            value={formatMoney(totalBuyCost)}
            bgColor="bg-purple-950"
            borderColor="border-purple-700"
            accent="text-purple-300"
            icon="💹"
          />
          <Card
            title="Shares Sold"
            subtitle="Total shares sold"
            value={totalSaleQty}
            bgColor="bg-rose-950"
            borderColor="border-rose-700"
            accent="text-rose-300"
            icon="🔴"
          />
          <Card
            title="Sale Value After Fees"
            subtitle="Total sale proceeds"
            value={formatMoney(totalSaleValueWithCommission)}
            bgColor="bg-fuchsia-950"
            borderColor="border-fuchsia-700"
            accent="text-fuchsia-300"
            icon="📉"
          />
          <Card
            title="Remaining Shares"
            subtitle="Shares still held"
            value={totalRemainQty}
            bgColor="bg-amber-950"
            borderColor="border-amber-700"
            accent="text-amber-300"
            icon="🟡"
          />
          <Card
            title="Remaining Shares Value"
            subtitle="Current holding value"
            value={formatMoney(remainingShareValue)}
            bgColor="bg-sky-950"
            borderColor="border-sky-700"
            accent="text-sky-300"
            icon="📊"
          />
          <Card
            title="Overall Profit/Loss"
            subtitle="Net portfolio return"
            value={formatMoney(tillNowProfitLoss)}
            bgColor={tillNowProfitLoss >= 0 ? "bg-emerald-950" : "bg-red-950"}
            borderColor={
              tillNowProfitLoss >= 0 ? "border-emerald-700" : "border-red-700"
            }
            accent={
              tillNowProfitLoss >= 0 ? "text-emerald-300" : "text-red-300"
            }
            icon={tillNowProfitLoss >= 0 ? "🎯" : "⚠️"}
          />
          <Card
            title="Dividend Income"
            subtitle="Earnings from dividends"
            value={formatMoney(dividend)}
            bgColor="bg-cyan-950"
            borderColor="border-cyan-700"
            accent="text-cyan-300"
            icon="💎"
          />
          <Card
            title="Current Portfolio Value"
            subtitle="Total assets now"
            value={formatMoney(tillNowCurrentAssets)}
            bgColor="bg-pink-950"
            borderColor="border-pink-700"
            accent="text-pink-300"
            icon="🌐"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📌 Performance Snapshot
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Cash Investment"
            subtitle="Total money used to buy shares"
            value={formatMoney(totalBuyCost)}
            bgColor="bg-emerald-950"
            borderColor="border-emerald-700"
            accent="text-emerald-300"
            icon="💵"
          />
          <Card
            title="Total Profit"
            subtitle="Realized and unrealized gain"
            value={formatMoney(profit)}
            bgColor={profit >= 0 ? "bg-emerald-950" : "bg-red-950"}
            borderColor={profit >= 0 ? "border-emerald-700" : "border-red-700"}
            accent={profit >= 0 ? "text-emerald-300" : "text-red-300"}
            icon={profit >= 0 ? "📈" : "📉"}
          />
          <Card
            title="Total Dividends"
            subtitle="Dividend income received"
            value={formatMoney(dividend)}
            bgColor="bg-cyan-950"
            borderColor="border-cyan-700"
            accent="text-cyan-300"
            icon="💎"
          />
          <Card
            title=" Final  Invest Without Dividend "
            subtitle="Holdings value only"
            value={formatMoney(totalAssets - dividend)}
            bgColor="bg-violet-950"
            borderColor="border-violet-700"
            accent="text-violet-300"
            icon="🧾"
          />
          <Card
            title="Cash + Profit"
            subtitle="Available value plus gains"
            value={formatMoney(balance + profit)}
            bgColor="bg-yellow-950"
            borderColor="border-yellow-700"
            accent="text-yellow-300"
            icon="🏦"
          />
          <Card
            title="Profit + Dividend"
            subtitle="Total asset increase"
            value={formatMoney(profit + dividend)}
            bgColor="bg-lime-950"
            borderColor="border-lime-700"
            accent="text-lime-300"
            icon="✨"
          />
          <Card
            title="Current Holdings Value"
            subtitle="Present Purchased Share Value"
            value={formatMoney(remainingShareValue)}
            bgColor="bg-purple-950"
            borderColor="border-purple-700"
            accent="text-purple-300"
            icon="📊"
          />
          <Card
            title="Available Balance"
            subtitle="Cash ready for investment"
            value={formatMoney(balance)}
            bgColor="bg-sky-950"
            borderColor="border-sky-700"
            accent="text-sky-300"
            icon="💰"
          />
          <Card
            title="Total Assets"
            subtitle="Overall portfolio value"
            value={formatMoney(totalAssets)}
            bgColor="bg-pink-950"
            borderColor="border-pink-700"
            accent="text-pink-300"
            icon="🌐"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          ⚙️ Key Metric
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Card
            title="ROI"
            subtitle="Return on Investment"
            value={
              totalAssets > 0
                ? `${((profit / deposit) * 100).toFixed(2)}%`
                : "0%"
            }
            bgColor="bg-slate-950"
            borderColor="border-slate-700"
            accent={profit >= 0 ? "text-green-300" : "text-red-300"}
            icon="📊"
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
