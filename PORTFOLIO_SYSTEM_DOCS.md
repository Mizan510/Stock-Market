# 📊 Portfolio Management System Documentation

## Overview

A complete investment portfolio tracking system that automatically calculates and displays all financial metrics in real-time. The system tracks cash flow, holdings, profit/loss, and provides a comprehensive dashboard view.

---

## 🎯 Core Features

### 1. **Cash Flow Tracking**

- **Deposit**: Total money added to account
- **Withdraw**: Total money removed from account
- **Dividend Income**: Total dividends received
- **Available Cash**: `Deposit - Withdraw - Buy Cost + Sale Proceeds + Dividend`

### 2. **Holdings Management**

- **Holdings Count**: Number of unique stocks in portfolio
- **Holdings Value**: Total market value of current shares
- **Remaining Share Quantity**: Per-stock tracking after all buy/sell transactions
- **Average Cost Price**: Per-stock cost basis for profit calculation

### 3. **Profit & Loss Analysis**

- **Realized Profit**: Profits from completed sales
- **Unrealized Profit**: Profits from current holdings (based on cost price)
- **Total Profit**: Realized + Unrealized profit
- **ROI**: Return on Investment percentage

### 4. **Portfolio Valuation**

- **Total Assets**: Cash Balance + Holdings Value
- **Portfolio Health**: Diversification status based on holdings count

---

## 📁 File Structure

```
frontend/src/
├── components/
│   └── SummaryPanel.jsx          # Dashboard display with 4 sections
├── pages/
│   └── Dashboard.jsx              # Main dashboard, fetches all data
├── utils/
│   └── portfolioCalculations.js   # Portfolio calculation engine
└── api.js                         # API client
```

---

## 🧮 Calculation Logic

### Formula: Cash Balance

```
Cash Balance = Deposit - Withdraw - Total Buy Cost + Total Sale Proceeds + Dividend
```

### Formula: Remaining Shares

```
For each stock:
  Remaining Qty = Sum(Buy Qty) - Sum(Sale Qty)
  Avg Cost Price = Total Buy Cost / Total Buy Qty
  Remaining Value = Remaining Qty × Avg Cost Price
```

### Formula: Realized Profit

```
Per Sale Transaction:
  Realized Profit = (Sale Price - Avg Buy Price) × Sale Qty - Sale Commission
```

### Formula: Unrealized Profit

```
Per Holding:
  Unrealized Profit = (Current Market Price - Avg Cost Price) × Remaining Qty

Note: Currently uses Avg Cost Price as "current" price.
      In production, should use real-time market data.
```

### Formula: Total Assets

```
Total Assets = Available Cash + Total Holdings Value
```

---

## 📊 Dashboard Sections

### Section 1: Cash Flow (💵)

Displays money movement in and out of the portfolio:

- Deposit (📥) - Green
- Withdraw (📤) - Red
- Dividend Income (💎) - Cyan
- Available Cash (💰) - Yellow

### Section 2: Holdings & Value (📊)

Shows current portfolio composition:

- Holdings Value (📈) - Purple
- Cash Balance (🏦) - Yellow
- Total Assets (👑) - Pink

### Section 3: Profit & Loss (📈)

Detailed profit analysis:

- Realized Profit (✅) - Green/Red based on sign
- Unrealized Profit (🔄) - Green/Red based on sign
- Total Profit/Loss (🎯/⚠️) - Green/Red based on sign

### Section 4: Key Metrics (⚙️)

Additional portfolio metrics:

- **ROI**: Return on Investment percentage
- **Holdings Count**: Number of unique stocks
- **Total Invested**: Amount in holdings
- **Portfolio Health**: Diversification status

---

## 🔌 API Integration

The system fetches from 4 endpoints in parallel:

```javascript
// Endpoints used
/investment/{userId}      // Deposit/Withdraw
/buy/{userId}            // Buy transactions
/sale/{userId}           // Sale transactions
/dividend/{userId}       // Dividend income
```

### Response Format Expected

```javascript
// All endpoints should return:
{
  data: [
    { /* transaction objects */ }
  ]
}
// OR
{
  data: {
    data: [
      { /* transaction objects */ }
    ]
  }
}
```

---

## 🛠️ Data Models

### Investment Model

```javascript
{
  userId: String,
  type: "deposit" | "withdraw",
  amount: Number,
  note: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Buy Model

```javascript
{
  userId: String,
  stockName: String,
  buyQuantity: Number,
  perShareValue: Number,
  buyingTotalShareValue: Number,
  commission: Number,
  totalValueWithCommission: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Sale Model

```javascript
{
  userId: String,
  stockName: String,
  saleQuantity: Number,
  perShareValue: Number,
  sallingTotalShareValue: Number,
  commission: Number,
  totalValueWithCommission: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Dividend Model

```javascript
{
  userId: String,
  companyName: String,
  shares: Number,
  perShareDividend: Number,
  netDividend: Number,
  // ... other dividend fields
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Usage

### In Dashboard Component

```jsx
import { calculatePortfolioMetrics } from "../utils/portfolioCalculations";

// Fetch data from API
const metrics = calculatePortfolioMetrics(
  buyData,
  saleData,
  dividendData,
  investmentData,
);

// Pass to SummaryPanel
<SummaryPanel
  deposit={metrics.totalDeposit}
  withdraw={metrics.totalWithdraw}
  dividend={metrics.totalDividend}
  balance={metrics.cashBalance}
  profit={metrics.totalProfit}
  remainingShareValue={metrics.totalRemainingShareValue}
  totalAssets={metrics.totalAssets}
  realizedProfit={metrics.realizedProfit}
  unrealizedProfit={metrics.unrealizedProfit}
  holdingCount={metrics.holdingCount}
/>;
```

---

## 📈 Business Rules

1. ✅ **No Negative Holdings**: System validates that no stock quantity goes negative
2. ✅ **Instant Updates**: Every buy/sell transaction updates portfolio instantly
3. ✅ **Dividend Increases Cash**: Dividends always add to available cash
4. ✅ **Profit Distinction**: Separates realized profit (sales) from unrealized profit (holdings)
5. ✅ **Automatic Recalculation**: All totals auto-calculate from transaction data
6. ✅ **Consistent Valuation**: Uses average cost price for holdings valuation

---

## 🔍 Portfolio Validation

The system includes a validation function to check portfolio consistency:

```javascript
import { validatePortfolio } from "../utils/portfolioCalculations";

const validation = validatePortfolio(holdingsMap);
if (!validation.valid) {
  console.warn("Portfolio issues:", validation.issues);
}
```

Issues detected:

- ⚠️ Negative quantity for any stock
- ⚠️ Zero quantity but positive cost basis
- ⚠️ Data inconsistencies

---

## 💡 Future Enhancements

1. **Real-Time Market Prices**: Integrate live market data API
2. **Advanced Profit Calculation**: Implement FIFO, LIFO, or specific lot identification
3. **Tax Tracking**: Calculate capital gains tax
4. **Historical Analysis**: Store metrics snapshots for trend analysis
5. **Alerts & Notifications**: Notify on holdings changes, profit milestones
6. **Export Reports**: Generate detailed PDF/Excel reports
7. **Portfolio Rebalancing**: Suggest rebalancing opportunities
8. **Sector Analysis**: Group and analyze by sector

---

## ❌ Error Handling

The system gracefully handles API failures:

```javascript
const [investRes, buyRes, saleRes, dividendRes] = await Promise.all([
  api.get(`/investment/${userId}`).catch(() => ({ data: [] })),
  api.get(`/buy/${userId}`).catch(() => ({ data: [] })),
  api.get(`/sale/${userId}`).catch(() => ({ data: [] })),
  api.get(`/dividend/${userId}`).catch(() => ({ data: [] })),
]);
```

Each failed request defaults to empty array, allowing system to continue with available data.

---

## 📱 UI/UX Features

- ✨ **Color-Coded Metrics**: Profit in green, loss in red
- 🎨 **Responsive Grid**: Works on desktop, tablet, and mobile
- ⏳ **Loading State**: Shows "Loading..." during data fetch
- 🔄 **Hover Effects**: Cards have hover transitions
- 📊 **Icon Indicators**: Visual icons for quick scanning
- 📱 **Mobile Optimized**: Grid adapts to smaller screens

---

## 🧪 Testing Scenarios

### Scenario 1: Simple Buy & Hold

- Deposit: 10,000
- Buy: 100 shares @ 50 (Total: 5,000)
- Result: Cash = 5,000, Holdings = 5,000, Total Assets = 10,000, Profit = 0

### Scenario 2: Buy, Sell with Profit

- Deposit: 10,000
- Buy: 100 shares @ 50 (Total: 5,000)
- Sell: 50 shares @ 60 (Total: 3,000)
- Result: Cash = 8,000, Holdings = 2,500, Realized Profit = 500

### Scenario 3: Multiple Stocks

- Deposit: 20,000
- Buy AAPL: 50 @ $100 = $5,000
- Buy MSFT: 75 @ $100 = $7,500
- Result: Holdings Count = 2, Holdings Value = $12,500

---

## 📞 Support & Questions

For issues or questions about the portfolio system:

1. Check the validation output
2. Verify API response format
3. Check browser console for errors
4. Ensure all required fields are in transaction data

---

**Last Updated:** 2026-06-05
**Version:** 1.0
**Status:** Production Ready
