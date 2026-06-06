/**
 * Portfolio Management & Calculation Utilities
 * Handles all financial calculations for investment tracking
 */

/**
 * Calculate complete portfolio metrics from transaction data
 * @param {Array} buyData - Buy transactions
 * @param {Array} saleData - Sale transactions
 * @param {Array} dividendData - Dividend income
 * @param {Array} investmentData - Deposit/Withdraw transactions
 * @returns {Object} Complete portfolio metrics
 */
export const calculatePortfolioMetrics = (
  buyData = [],
  saleData = [],
  dividendData = [],
  investmentData = [],
) => {
  // ====================================
  // 1. CASH FLOW CALCULATIONS
  // ====================================

  // Total Deposits
  const totalDeposit = investmentData.reduce((sum, item) => {
    return item.type === "deposit" ? sum + Number(item.amount || 0) : sum;
  }, 0);

  // Total Withdrawals
  const totalWithdraw = investmentData.reduce((sum, item) => {
    return item.type === "withdraw" ? sum + Number(item.amount || 0) : sum;
  }, 0);

  // Total Dividends Received
  const totalDividend = dividendData.reduce((sum, item) => {
    return sum + Number(item.netDividend || 0);
  }, 0);

  // Total Buy Cost (with commission)
  const totalBuyCost = buyData.reduce((sum, item) => {
    return sum + Number(item.totalValueWithCommission || 0);
  }, 0);

  const totalBuyQty = buyData.reduce((sum, item) => {
    return sum + Number(item.buyQuantity || 0);
  }, 0);

  // Total Sale Proceeds (after commission)
  const totalSaleProceeds = saleData.reduce((sum, item) => {
    return sum + Number(item.totalValueWithCommission || 0);
  }, 0);

  const totalSaleQty = saleData.reduce((sum, item) => {
    return sum + Number(item.saleQuantity || 0);
  }, 0);

  // ====================================
  // 2. CASH BALANCE CALCULATION
  // ====================================

  const cashBalance =
    totalDeposit -
    totalWithdraw -
    totalBuyCost +
    totalSaleProceeds +
    totalDividend;

  // ====================================
  // 3. HOLDINGS & REMAINING SHARES
  // ====================================

  // Build holdings map: { stockName: { quantity, buyValue, avgPrice } }
  const holdingsMap = {};

  // Process Buy transactions
  buyData.forEach((item) => {
    const symbol = item.stockName || "Unknown";
    const qty = Number(item.buyQuantity || 0);
    const buyValue = Number(item.buyingTotalShareValue || 0);
    const totalWithComm = Number(item.totalValueWithCommission || 0);

    if (!holdingsMap[symbol]) {
      holdingsMap[symbol] = {
        quantity: 0,
        totalCostWithCommission: 0,
        totalShareValue: 0,
        buyTransactions: 0,
      };
    }

    holdingsMap[symbol].quantity += qty;
    holdingsMap[symbol].totalCostWithCommission += totalWithComm;
    holdingsMap[symbol].totalShareValue += buyValue;
    holdingsMap[symbol].buyTransactions += 1;
  });

  // Process Sale transactions
  saleData.forEach((item) => {
    const symbol = item.stockName || "Unknown";
    const qty = Number(item.saleQuantity || 0);

    if (!holdingsMap[symbol]) {
      holdingsMap[symbol] = {
        quantity: 0,
        totalCostWithCommission: 0,
        totalShareValue: 0,
        buyTransactions: 0,
      };
    }

    holdingsMap[symbol].quantity -= qty;
  });

  // Calculate avg price per holding
  Object.keys(holdingsMap).forEach((symbol) => {
    const holding = holdingsMap[symbol];
    if (holding.quantity > 0) {
      holding.avgPrice = holding.totalCostWithCommission / holding.quantity;
    } else {
      holding.avgPrice = 0;
    }
  });

  // ====================================
  // 4. PROFIT/LOSS CALCULATIONS
  // ====================================

  let realizedProfit = 0;
  let unrealizedProfit = 0;

  // Calculate realized profit from sales
  saleData.forEach((sale) => {
    const symbol = sale.stockName || "Unknown";
    const saleQty = Number(sale.saleQuantity || 0);
    const saleProceedsPerShare = Number(sale.perShareValue || 0);
    const saleTotal = Number(sale.sallingTotalShareValue || 0);
    const saleCommission = Number(sale.commission || 0);

    // Find average buy price for this stock
    let avgBuyPrice = 0;
    if (holdingsMap[symbol]) {
      // Need to calculate the cost basis for the sold shares
      // This requires fetching buy transactions in order and calculating FIFO
      const buyTx = buyData.filter((b) => b.stockName === symbol);
      let remainingQty = saleQty;
      let costBasis = 0;

      for (const buy of buyTx) {
        if (remainingQty <= 0) break;
        const buyQty = Number(buy.buyQuantity || 0);
        const buyCost = Number(buy.totalValueWithCommission || 0);
        const qtyUsed = Math.min(remainingQty, buyQty);
        costBasis += (buyCost / buyQty) * qtyUsed;
        remainingQty -= qtyUsed;
      }

      avgBuyPrice = costBasis / saleQty;
    }

    const profitPerShare = saleProceedsPerShare - avgBuyPrice;
    realizedProfit += profitPerShare * saleQty - saleCommission;
  });

  // Calculate unrealized profit (holdings at current price)
  // Note: Using last buy price as "current market price"
  // In production, this should fetch real-time market data
  Object.keys(holdingsMap).forEach((symbol) => {
    const holding = holdingsMap[symbol];
    if (holding.quantity > 0 && holding.avgPrice > 0) {
      // Use avg buy price as reference (replace with real market price in production)
      const currentPrice = holding.avgPrice; // This should be real market price
      unrealizedProfit += (currentPrice - holding.avgPrice) * holding.quantity;
    }
  });

  // ====================================
  // 5. PORTFOLIO SUMMARY
  // ====================================

  // Calculate total remaining share value at cost
  const totalRemainingShareValue = Object.values(holdingsMap)
    .filter((h) => h.quantity > 0)
    .reduce((sum, h) => sum + (h.avgPrice * h.quantity || 0), 0);

  // Total Assets = Cash Balance + Remaining Share Value
  const totalAssets = cashBalance + totalRemainingShareValue;

  // Total Profit = Realized Profit + Unrealized Profit
  const totalProfit = realizedProfit + unrealizedProfit;

  const totalRemainQty = Object.values(holdingsMap).reduce(
    (sum, h) => sum + Math.max(Number(h.quantity || 0), 0),
    0,
  );

  return {
    // Cash Flow
    totalDeposit,
    totalWithdraw,
    totalDividend,
    totalBuyCost,
    totalSaleProceeds,

    // Cash & Assets
    cashBalance,
    totalRemainingShareValue,
    totalAssets,

    // Profit & Loss
    realizedProfit,
    unrealizedProfit,
    totalProfit,

    // Extended Summary
    totalBuyQty,
    totalSaleQty,
    totalSaleValueWithCommission: totalSaleProceeds,
    totalRemainQty,

    // Holdings
    holdings: holdingsMap,
    holdingCount: Object.keys(holdingsMap).filter(
      (k) => holdingsMap[k].quantity > 0,
    ).length,

    // Summary
    summary: {
      "Money In": totalDeposit + totalDividend + totalSaleProceeds,
      "Money Out": totalWithdraw + totalBuyCost,
      "Net Cash": cashBalance,
      "Holdings Value": totalRemainingShareValue,
      "Total Portfolio": totalAssets,
      "Total Profit/Loss": totalProfit,
    },
  };
};

/**
 * Get formatted holdings with additional metrics
 */
export const getFormattedHoldings = (holdingsMap) => {
  return Object.entries(holdingsMap)
    .filter(([_, holding]) => holding.quantity > 0)
    .map(([symbol, holding]) => ({
      symbol,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalValue: holding.avgPrice * holding.quantity,
      unrealizedProfit: 0, // Can be calculated with real market prices
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return `৳ ${Number(amount || 0).toFixed(2)}`;
};

/**
 * Format number with 2 decimal places
 */
export const formatNumber = (num) => {
  return Number(num || 0).toFixed(2);
};

/**
 * Validate portfolio consistency
 * Ensures no negative holdings exist
 */
export const validatePortfolio = (holdingsMap) => {
  const issues = [];

  Object.entries(holdingsMap).forEach(([symbol, holding]) => {
    if (holding.quantity < 0) {
      issues.push(`⚠️ ${symbol}: Negative quantity (${holding.quantity})`);
    }
    if (holding.quantity === 0 && holding.totalCostWithCommission > 0) {
      issues.push(`⚠️ ${symbol}: No quantity but has cost basis`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};
