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
  cardPadding = "p-5",
  cardValueSize = "text-xl md:text-2xl",
  cardTitleSize = "text-sm md:text-base font-semibold",
  cardSubtitleSize = "text-[11px] md:text-xs",
  cardRadius = "rounded-2xl",
  cardGap = "gap-4",
}) => {
  // =========================
  // FORMATTING UTILITIES
  // =========================
  const formatMoney = (amount) => {
    if (loading) return "Loading...";
    const numericValue = Number(amount || 0);
    return `৳ ${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const getFinancialAccent = (val, isDarkBg = true) => {
    if (val > 0) return isDarkBg ? "text-emerald-400" : "text-emerald-700";
    if (val < 0) return isDarkBg ? "text-rose-400" : "text-rose-700";
    return isDarkBg ? "text-white" : "text-slate-950";
  };

  // =========================
  // FINANCIAL CALCULATIONS
  // =========================
  const finalCashInvestment = deposit - withdraw;
  const assetsIncrease = profit + dividend;
  const availableBalance =
    finalCashInvestment + totalSaleValueWithCommission - totalBuyCost;
  const totalAssetsValue = remainingShareValue + availableBalance;
  const netProfitLoss = profit;

  // Database Null Safeguards
  const lbslCostAmountValue =
    lbslCostAmount !== null && lbslCostAmount !== undefined
      ? lbslCostAmount
      : 0;
  const lbslCurrentAssetsValue =
    lbslCurrentAssetsPP !== null && lbslCurrentAssetsPP !== undefined
      ? lbslCurrentAssetsPP
      : 0;

  const costDeviation = Math.round(lbslCostAmountValue - availableBalance);
  const currentDeviation = Math.round(
    lbslCurrentAssetsValue - remainingShareValue,
  );

  // =========================
  // SUB-COMPONENT: CARD TEMPLATE
  // =========================
  const Card = ({
    title,
    value,
    subtitle,
    bgColor = "bg-slate-900",
    borderColor = "border-slate-800/80",
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

  return (
    <div className="space-y-1">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800/60 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <span>💼</span> Portfolio Summary
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Portfolio performance and ROI at a glance
          </p>
        </div>

        {/* Added 'w-fit' to wrap the text and 'ml-auto' to push the box to the right */}
        <div className="w-fit ml-auto text-right bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-xl">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
            Monthly Expense
          </p>
          <p className="text-xl md:text-2xl font-bold text-red-500 mt-0.5">
            {formatMoney(monthlyExpense)}
          </p>
        </div>
      </div>

      {/* ROI HERO SECTION */}

      <div>
        <div
          className={`${cardPadding} ${cardRadius} border border-amber-500/30 bg-amber-400/90 backdrop-blur-sm hover:scale-[1.01] transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex flex-col justify-between overflow-hidden`}
        >
          <h3 className={`${cardTitleSize} text-slate-950 leading-none`}>
            📈 ROI (Return on Investment)
          </h3>

          <div className="space-y-1 mt-1">
            {/* ROI on Deposit - Green Section */}
            <div className="flex items-center justify-between rounded bg-emerald-500/20 px-1 py-0.5 border border-emerald-500/20">
              <div>
                <p className="text-[10px] font-medium text-slate-800 leading-tight">
                  Return on Deposit
                </p>
                <p className="text-[8px] text-slate-700 leading-tight">
                  ((Profit + Dividend) / Deposit) × 100
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-700 leading-none">
                {deposit > 0
                  ? `${(((profit + dividend) / deposit) * 100).toFixed(2)}%`
                  : "0%"}
              </p>
            </div>

            {/* ROI on Remaining Capital - Blue Section */}
            <div className="flex items-center justify-between rounded bg-blue-500/20 px-1 py-0.5 border border-blue-500/20">
              <div>
                <p className="text-[10px] font-medium text-slate-800 leading-tight">
                  Return on Remaining Capital
                </p>
                <p className="text-[8px] text-slate-700 leading-tight">
                  ((Profit + Dividend) / (Deposit - Withdraw)) × 100
                </p>
              </div>
              <p className="text-sm font-bold text-blue-700 leading-none">
                {deposit - withdraw > 0
                  ? `${(((profit + dividend) / (deposit - withdraw)) * 100).toFixed(2)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT METRICS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <span>📊</span> Result Summary
        </h3>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${cardGap}`}
        >
          <Card
            title="Profit/Loss"
            subtitle="Sum of individual company net profit/losses"
            value={formatMoney(netProfitLoss)}
            accent={getFinancialAccent(netProfitLoss)}
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
            title="Current Total Assets"
            subtitle="Remaining Purchased Share Value + Available Balance"
            value={formatMoney(totalAssetsValue)}
          />
        </div>
      </div>

      {/* CASH FLOW SECTION */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
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

      {/* STOCK INVENTORIES & VALUATION */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <span>📦</span> Holdings & Valuation Summary
        </h3>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${cardGap}`}
        >
          <Card
            title="Remaining Share Qty"
            subtitle="Remaining shares quantity after sale"
            value={loading ? "Loading..." : totalRemainQty.toLocaleString()}
            accent="text-sky-400"
          />
          <Card
            title="Remaining Share Value"
            subtitle="Remaining shares value after sale"
            value={formatMoney(remainingShareValue)}
          />
          <Card
            title="As per LBSL Cost Amount"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCurrentAssetsValue)}
            bgColor="bg-slate-100"
            borderColor="border-slate-300"
            accent="text-slate-950"
            textColor="text-slate-950"
            subtitleColor="text-slate-600"
          />
          <Card
            title="Valuation Deviation"
            subtitle="LBSL Cost Amount - Remaining Share Value"
            value={formatMoney(currentDeviation)}
            bgColor="bg-violet-900"
            borderColor="border-violet-700"
            accent={getFinancialAccent(currentDeviation)}
          />
        </div>
      </div>

      {/* LIQUIDITY ANALYSIS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <span>💧</span> Liquidity Analysis
        </h3>
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${cardGap}`}>
          <Card
            title="Available Balance (For Further Purchases)"
            subtitle="Final Cash Investment + Total Sale - Total Buy Cost"
            value={formatMoney(availableBalance)}
          />
          <Card
            title="As per LBSL (Current Assets) / PP"
            subtitle="As per LBSL Report"
            value={formatMoney(lbslCostAmountValue)}
          />
          <Card
            title="Liquidity Deviation"
            subtitle="LBSL (Current Assets) / PP - Available Balance"
            value={formatMoney(costDeviation)}
            bgColor="bg-violet-950"
            borderColor="border-violet-800/80"
            accent={getFinancialAccent(costDeviation)}
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
