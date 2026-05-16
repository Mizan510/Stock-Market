import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const Reports = () => {
  const userId = "demo-user";

  const getBDDate = () => {
    const now = new Date();

    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );

    return bd.toISOString().split("T")[0];
  };

  const getFirstDayOfMonth = () => {
    const now = new Date();

    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );

    const year = bd.getFullYear();
    const month = String(bd.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
  };

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [investmentList, setInvestmentList] = useState([]);
  const [filteredInvestmentList, setFilteredInvestmentList] = useState([]);

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(true);

  const [filterLoading, setFilterLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const formatDateString = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [buyRes, saleRes, investmentRes] = await Promise.all([
        api.get(`/buy/${userId}`),
        api.get(`/sale/${userId}`),
        api.get(`/investment/${userId}`),
      ]);

      const buyData = buyRes.data?.data || buyRes.data || [];
      const saleData = saleRes.data?.data || saleRes.data || [];
      const investmentData =
        investmentRes.data?.data || investmentRes.data || [];

      const merged = [
        ...buyData.map((i) => ({ ...i, type: "buy" })),
        ...saleData.map((i) => ({ ...i, type: "sale" })),
      ];

      setList(merged);
      setInvestmentList(investmentData);

      const filtered = merged.filter((item) => {
        const itemDateStr = formatDateString(item.createdAt || item.date);
        return itemDateStr >= fromDate && itemDateStr <= toDate;
      });

      const investmentFiltered = investmentData.filter((item) => {
        const itemDateStr = formatDateString(item.date);
        return itemDateStr >= fromDate && itemDateStr <= toDate;
      });

      setFilteredList(filtered);
      setFilteredInvestmentList(investmentFiltered);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    setFilterLoading(true);

    try {
      const filtered = list.filter((item) => {
        const itemDateStr = formatDateString(item.createdAt || item.date);
        return itemDateStr >= fromDate && itemDateStr <= toDate;
      });

      const investmentFiltered = investmentList.filter((item) => {
        const itemDateStr = formatDateString(item.date);
        return itemDateStr >= fromDate && itemDateStr <= toDate;
      });

      setFilteredList(filtered);
      setFilteredInvestmentList(investmentFiltered);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleReset = async () => {
    setResetLoading(true);

    try {
      const newFromDate = getFirstDayOfMonth();
      const newToDate = getBDDate();

      setFromDate(newFromDate);
      setToDate(newToDate);

      const filtered = list.filter((item) => {
        const itemDateStr = formatDateString(item.createdAt || item.date);
        return itemDateStr >= newFromDate && itemDateStr <= newToDate;
      });

      const investmentFiltered = investmentList.filter((item) => {
        const itemDateStr = formatDateString(item.date);
        return itemDateStr >= newFromDate && itemDateStr <= newToDate;
      });

      setFilteredList(filtered);
      setFilteredInvestmentList(investmentFiltered);
    } finally {
      setResetLoading(false);
    }
  };

  const summary = useMemo(() => {
    let buyQty = 0;
    let buyValue = 0;
    let buyCommission = 0;

    let saleQty = 0;
    let saleValue = 0;
    let saleCommission = 0;

    filteredList.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const total = item.total || qty * price;
      const commission = total * 0.004;

      if (item.type === "buy") {
        buyQty += qty;
        buyValue += total;
        buyCommission += commission;
      }

      if (item.type === "sale") {
        saleQty += qty;
        saleValue += total;
        saleCommission += commission;
      }
    });

    return {
      buyQty,
      buyValue,
      buyCommission,
      saleQty,
      saleValue,
      saleCommission,
    };
  }, [filteredList]);

  const investmentSummary = useMemo(() => {
    let deposit = 0;
    let withdraw = 0;

    filteredInvestmentList.forEach((item) => {
      const amount = Number(item.amount || 0);

      if (item.type === "deposit") deposit += amount;
      if (item.type === "withdraw") withdraw += amount;
    });

    return {
      deposit,
      withdraw,
      balance: deposit - withdraw,
    };
  }, [filteredInvestmentList]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">📈 Stock Reports</h1>
          <p className="text-gray-400">Buy & Sale Performance Summary</p>
        </div>

        {/* FILTER */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6 space-y-3 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-3 bg-gray-800 rounded-lg outline-none"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-3 bg-gray-800 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleView}
              disabled={filterLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed p-3 rounded-lg font-semibold"
            >
              {filterLoading ? "Filtering..." : "View Report"}
            </button>

            <button
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-gray-700 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed p-3 rounded-lg font-semibold"
            >
              {resetLoading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-700 mb-8">
          <table className="w-full text-center">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4 border">Buy Qty</th>
                <th className="p-4 border">Buy Value</th>
                <th className="p-4 border">Buy Comm</th>
                <th className="p-4 border">Sale Qty</th>
                <th className="p-4 border">Sale Value</th>
                <th className="p-4 border">Sale Comm</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-lg">
                <td className="p-4 border text-cyan-300">{summary.buyQty}</td>
                <td className="p-4 border text-green-400">
                  ৳ {summary.buyValue.toFixed(2)}
                </td>
                <td className="p-4 border text-yellow-300">
                  ৳ {summary.buyCommission.toFixed(2)}
                </td>
                <td className="p-4 border text-cyan-300">{summary.saleQty}</td>
                <td className="p-4 border text-red-400">
                  ৳ {summary.saleValue.toFixed(2)}
                </td>
                <td className="p-4 border text-yellow-300">
                  ৳ {summary.saleCommission.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* INVESTMENT SUMMARY */}
        <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm uppercase text-gray-400">Deposit</p>
              <p className="text-2xl font-bold text-green-400">
                ৳ {investmentSummary.deposit.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm uppercase text-gray-400">Withdraw</p>
              <p className="text-2xl font-bold text-red-400">
                ৳ {investmentSummary.withdraw.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm uppercase text-gray-400">Balance</p>
              <p className="text-2xl font-bold text-yellow-300">
                ৳ {investmentSummary.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {filteredInvestmentList.length > 0 && (
          <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-700 mb-8">
            <div className="p-4 text-lg font-semibold text-white">
              Investment Transactions
            </div>
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-3 border">Date</th>
                  <th className="p-3 border">Type</th>
                  <th className="p-3 border">Amount</th>
                  <th className="p-3 border">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestmentList.map((item, i) => (
                  <tr key={i} className="border hover:bg-gray-800">
                    <td className="p-3">
                      {new Date(item.date).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className={`p-3 font-bold ${
                        item.type === "deposit"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </td>
                    <td className="p-3">
                      ৳ {Number(item.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-gray-300">{item.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DETAILS */}
        <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-700">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Company</th>
                <th className="p-3 border">Type</th>
                <th className="p-3 border">Qty</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Total</th>
                <th className="p-3 border">Commission</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="p-5 text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filteredList.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-5 text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
              {!loading &&
                filteredList.map((item, i) => {
                  const qty = Number(item.quantity || 0);
                  const price = Number(item.price || 0);
                  const total = item.total || qty * price;
                  const commission = total * 0.004;

                  return (
                    <tr key={i} className="border hover:bg-gray-800">
                      <td className="p-3">
                        {new Date(
                          item.createdAt || item.date,
                        ).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 text-cyan-300 font-semibold">
                        {item.stockName}
                      </td>
                      <td
                        className={`p-3 font-bold ${
                          item.type === "buy"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </td>
                      <td className="p-3">{qty}</td>
                      <td className="p-3">৳ {price}</td>
                      <td className="p-3 text-green-400">৳ {total}</td>
                      <td className="p-3 text-yellow-300">
                        ৳ {commission.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
