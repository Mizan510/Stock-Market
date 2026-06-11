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
  cardPadding = "p-4",
  cardValueSize = "text-xl md:text-2xl",
  cardTitleSize = "text-base font-semibold",
  cardSubtitleSize = "text-[11px] md:text-xs",
  cardRadius = "rounded-2xl",
  cardGap = "gap-4",
}) => {
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    const numericValue = Number(amount || 0);
    return `৳ ${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const finalCashInvestment = deposit - withdraw;
  const assetsIncrease = profit + dividend;
  const currentAssetsCashProfit = finalCashInvestment + tillNowProfitLoss + dividend;
  const availableBalance = balance;
  const totalAssetsValue = balance + remainingShareValue;

  // Only use LBSL values if they are actually saved in DB, otherwise 0
  const lbslCostAmountValue = lbslCostAmount !== null && lbslCostAmount !== undefined ? lbslCostAmount : 0;
  const lbslCurrentAssetsValue = lbslCurrentAssetsPP !== null && lbslCurrentAssetsPP !== undefined ? lbslCurrentAssetsPP : 0;

  const costDeviation = lbslCostAmountValue - availableBalance;
  const currentDeviation = lbslCurrentAssetsValue - currentAssetsCashProfit;

  // Reusable card template component
  const Card = ({
    title,
    value,
    subtitle,
    bgColor = "bg-slate-900",
    borderColor = "border-slate-800",
    accent = "text-white",
    textColor = "text-gray-200",
    subtitleColor = "text-gray-400",
  }) => (
    <div
      className={`${cardPadding} ${cardRadius} border ${borderColor} ${bgColor} hover:scale-[1.01] transition-all duration-200 shadow-md flex flex-col justify-between overflow-hidden`}
    >
      <div>
        <h3 className={`${cardTitleSize} ${textColor} mb-1 leading-snug`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`${cardSubtitleSize} ${subtitleColor} leading-normal`}>
            {subtitle}
          </p>
        )}
      </div>
      <p className={`${cardValueSize} font-bold mt-4 leading-none ${accent}`}>
        {value}
      </p>
    </div>
  );

  // Helper helper to flag financial color ranges dynamically
  const getFinancialAccent = (val, isDarkBg = true) => {
    if (val > 0) return isDarkBg ? "text-emerald-400" : "text-emerald-700";
    if (val < 0) return isDarkBg ? "text-rose-400" : "text-rose-700";
    return isDarkBg ? "text-white" : "text-slate-950";
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <span>💼</span> Portfolio Summary
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            High-level portfolio performance and ROI at a glance
          </p>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-left sm:text-right min-w-160px">
          <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">Monthly Expense</p>
          <p className="text-xl md:text-2xl font-bold text-rose-500 mt-0.5">
            {formatMoney(monthlyExpense)}
          </p>
        </div>
      </div>

      {/* ROI HERO SECTION */}
      <div className="grid grid-cols-1 gap-4">
        <Card
          title="ROI (Return on Investment)"
          subtitle="(Profit / Deposit) * 100"
          value={deposit > 0 ? `${((profit / deposit) * 100).toFixed(2)}%` : "0.00%"}
          bgColor="bg-amber-400"
          borderColor="border-amber-500"
          accent="text-slate-950"
          textColor="text-slate-950"
          subtitleColor="text-slate-800 font-medium"
        />
      </div>

      {/* RESULT METRICS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📊</span> Result Summary
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${cardGap}`}>
          <Card
            title="Profit/Loss"
            subtitle="Net gain"
            value={formatMoney(tillNowProfitLoss)}
            accent={getFinancialAccent(tillNowProfitLoss)}
          />
          <Card
            title="Dividend after Purification"
            subtitle="Sum of netDividend after purification"
            value={formatMoney(dividend)}
            accent={getFinancialAccent(dividend)}
          />
          <Card
            title="Assets Increase"
            subtitle="Profit + Dividend"
            value={formatMoney(assetsIncrease)}
            accent={getFinancialAccent(assetsIncrease)}
          />
          <Card
            title="Total Assets"
            subtitle="Cash Balance + Remaining Purchased Share Value"
            value={formatMoney(totalAssetsValue)}
          />
        </div>
      </div>

      {/* CASH FLOW SECTION */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>💰</span> Cash Summary
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Total Deposit"
            subtitle="Money added"
            value={formatMoney(deposit)}
          />
          <Card
            title="Total Withdraw"
            subtitle="Money removed"
            value={formatMoney(withdraw)}
          />
          <Card
            title="Final Cash Investment"
            subtitle="Deposit - Withdraw"
            value={formatMoney(finalCashInvestment)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-600"
          />
        </div>
      </div>

      {/* STOCK INVENTORIES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📦</span> Holdings Summary
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${cardGap}`}>
          <Card
            title="Remaining Purchased Share Qtn"
            subtitle="Remaining shares quantity after sale"
            value={loading ? "Loading..." : totalRemainQty.toLocaleString()}
            accent="text-sky-400"
          />
          <Card
            title="Remaining Purchased Share Value"
            subtitle="Remaining shares value after sale"
            value={formatMoney(remainingShareValue)}
          />
        </div>
      </div>

      {/* LIQUIDITY ANALYSIS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🟢</span> Liquidity / Cost
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Available Balance (for Further Purchase)"
            subtitle="Current Cash Balance"
            value={formatMoney(availableBalance)}
          />
          <Card
            title="As per LBSL (Cost Amount (TK.)"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCostAmountValue)}
          />
          <Card
            title="Deviation"
            subtitle="LBSL Cost Amount - Available Balance"
            value={formatMoney(costDeviation)}
            bgColor="bg-violet-950"
            borderColor="border-violet-800/80"
            accent={getFinancialAccent(costDeviation)}
          />
        </div>
      </div>

      {/* CURRENT RUNNING VALUATION */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📈</span> Current Asset Details
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Current Assets"
            subtitle="Final Cash Investment + Profit/Loss + Dividend"
            value={formatMoney(currentAssetsCashProfit)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-600"
          />
          <Card
            title="As per LBSL (Current Assets)/ PP"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCurrentAssetsValue)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-600"
          />
          <Card
            title="Deviation"
            subtitle="LBSL Current Assets PP - Current Assets (Cash + Profit)"
            value={formatMoney(currentDeviation)}
            bgColor="bg-violet-900"
            borderColor="border-violet-700"
            accent={getFinancialAccent(currentDeviation)}
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;