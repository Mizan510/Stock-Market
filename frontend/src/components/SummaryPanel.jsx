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
  lbslCostAmount = null,
  lbslCurrentAssetsPP = null,
  totalBuyQty = 0,
  totalSaleQty = 0,
  totalSaleValueWithCommission = 0,
  totalRemainQty = 0,
  tillNowProfitLoss = 0,
  tillNowCurrentAssets = 0,
  monthlyExpense = 0,
  cardPadding = "p-2",
  cardValueSize = "text-xl",
  cardTitleSize = "text-base md:text-lg font-semibold",
  cardSubtitleSize = "text-[10px] md:text-xs",
  cardRadius = "rounded-2xl",
  cardGap = "gap-3",
}) => {
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    return `৳ ${Number(amount || 0).toFixed(2)}`;
  };

  const finalCashInvestment = deposit - withdraw;
  const assetsIncrease = profit + dividend;
  const currentAssetsCashProfit = finalCashInvestment + tillNowProfitLoss;
  const availableBalance =
    finalCashInvestment + totalBuyCost + totalSaleValueWithCommission;
  const totalAssetsValue = availableBalance + remainingShareValue + profit;
  const lbslCostAmountValue =
    lbslCostAmount !== null && lbslCostAmount !== undefined
      ? lbslCostAmount
      : totalBuyCost;
  const lbslCurrentAssetsValue =
    lbslCurrentAssetsPP !== null && lbslCurrentAssetsPP !== undefined
      ? lbslCurrentAssetsPP
      : tillNowCurrentAssets;
  const costDeviation = lbslCostAmountValue - availableBalance;
  const currentDeviation = lbslCurrentAssetsValue - currentAssetsCashProfit;

  const Card = ({
    title,
    value,
    subtitle,
    bgColor = "bg-slate-950",
    borderColor = "border-slate-800",
    accent = "text-white",
    textColor = "text-gray-100",
    subtitleColor = "text-gray-200",
  }) => (
    <div
      className={`${cardPadding} ${cardRadius} border ${borderColor} ${bgColor} hover:shadow-xl transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden`}
    >
      <div>
        <h3 className={`${cardTitleSize} ${textColor} mb-0.5 leading-snug`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`${cardSubtitleSize} ${subtitleColor} leading-snug`}>
            {subtitle}
          </p>
        )}
      </div>

      <p className={`${cardValueSize} font-bold mt-2 leading-tight ${accent}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            💼 Portfolio Summary
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            High-level portfolio performance and ROI at a glance
          </p>
        </div>
        <div className="rounded-2xl border border-red-500 bg-slate-950/20 px-4 py-1 text-right">
          <p className="text-sm text-red-400">Monthly Expense</p>
          <p className="text-lg font-semibold text-red-600">
            {formatMoney(monthlyExpense)}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-1">
        <Card
          title="ROI (Return on Investment)"
          subtitle="(Profit / Deposit) * 100"
          value={
            deposit > 0 ? `${((profit / deposit) * 100).toFixed(2)}%` : "0%"
          }
          bgColor="bg-yellow-200"
          borderColor="border-yellow-400"
          accent="text-slate-950"
          textColor="text-slate-950"
          subtitleColor="text-slate-700"
        />
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📊 Result Summary
        </h3>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${cardGap}`}
        >
          <Card
            title="Profit/Loss"
            subtitle="Net gain"
            value={formatMoney(tillNowProfitLoss)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Dividend after Purification"
            subtitle="Sum of netDividend after purification"
            value={formatMoney(dividend)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Assets Increase"
            subtitle="Profit + Dividend"
            value={formatMoney(assetsIncrease)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Total Assets"
            subtitle="Available Balance + Remaining Purchased Share Value + Profit/Loss"
            value={formatMoney(totalAssetsValue)}
            bgColor="bg-slate-900"
            borderColor="border-slate-700"
            accent="text-white"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          💰 Cash Summary
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Total Deposit"
            subtitle="Money added"
            value={formatMoney(deposit)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Total Withdraw"
            subtitle="Money removed"
            value={formatMoney(withdraw)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Final Cash Investment"
            subtitle="Deposit - Withdraw"
            value={formatMoney(finalCashInvestment)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-700"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📦 Holdings Summary
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${cardGap}`}>
          <Card
            title="Remaining Purchased Share Qtn"
            subtitle="Remaining shares quantity after sale"
            value={totalRemainQty}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Remaining Purchased Share Value"
            subtitle="Remaining shares value after sale"
            value={formatMoney(remainingShareValue)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          🟢 Liquidity / Cost
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Available Balance (for Further Purchase)"
            subtitle="Final Cash Investment + Total buy Value with Commission + Total sale Value with Commission"
            value={formatMoney(availableBalance)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="As per LBSL (Cost Amount (TK.)"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCostAmountValue)}
            bgColor="bg-slate-800"
            borderColor="border-slate-700"
            accent="text-white"
          />
          <Card
            title="Deviation"
            subtitle="LBSL Cost Amount - Available Balance"
            value={formatMoney(costDeviation)}
            bgColor="bg-violet-600"
            borderColor="border-violet-700"
            accent="text-white"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          📈 Current Asset Details
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Current Assets"
            subtitle="Final Cash Investment + Profit/Loss"
            value={formatMoney(currentAssetsCashProfit)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-700"
          />
          <Card
            title="As per LBSL (Current Assets)/ PP"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCurrentAssetsValue)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-700"
          />
          <Card
            title="Deviation"
            subtitle="LBSL Current Assets PP - Current Assets (Cash + Profit)"
            value={formatMoney(currentDeviation)}
            bgColor="bg-violet-500"
            borderColor="border-violet-600"
            accent="text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
