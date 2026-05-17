import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ReportFilter from "../components/ReportFilter";

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

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(true);

  const [filterLoading, setFilterLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

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
      const [buyRes, saleRes] = await Promise.all([
        api.get(`/buy/${userId}`),
        api.get(`/sale/${userId}`),
      ]);

      const buyData = buyRes.data?.data || buyRes.data || [];
      const saleData = saleRes.data?.data || saleRes.data || [];

      const merged = [
        ...buyData.map((i) => ({ ...i, type: "buy" })),
        ...saleData.map((i) => ({ ...i, type: "sale" })),
      ];

      setList(merged);

      const filtered = merged.filter((item) => {
        const itemDateStr = formatDateString(item.createdAt || item.date);
        return itemDateStr >= fromDate && itemDateStr <= toDate;
      });

      setFilteredList(filtered);
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

      setFilteredList(filtered);
      setShowReport(true);
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

      setFilteredList(filtered);
      setShowReport(false);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.type} record for ${item.stockName}?`)) {
      return;
    }

    setActionLoading(item._id);
    try {
      await api.delete(`/${item.type}/delete/${item._id}`);
      await fetchReports();
    } catch (err) {
      console.log("Delete error:", err);
      alert("Unable to delete record. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (item) => {
    const stockName = window.prompt("Stock name", item.stockName);
    if (stockName === null) return;

    const quantityInput = window.prompt("Quantity", item.quantity);
    if (quantityInput === null) return;

    const priceInput = window.prompt("Price", item.price);
    if (priceInput === null) return;

    const quantity = Number(quantityInput);
    const price = Number(priceInput);

    if (!stockName.trim() || !quantity || !price) {
      return alert("Please provide valid stock, quantity, and price.");
    }

    setActionLoading(item._id);
    try {
      await api.put(`/${item.type}/update/${item._id}`, {
        stockName: stockName.trim(),
        quantity,
        price,
      });
      await fetchReports();
    } catch (err) {
      console.log("Update error:", err);
      alert("Unable to update record. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    if (filteredList.length === 0) {
      alert("No data to export. Please apply filters and view the report first.");
      return;
    }

    setReportLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Trade Report");

      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        alignment: { vertical: "middle", horizontal: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const buyHeaderFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F855A" },
      };

      const saleHeaderFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC53030" },
      };

      const dateHeaderFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };

      const nameHeaderFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" },
      };

      const buyCellFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" },
      };

      const saleCellFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEE2E2" },
      };

      const totalFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2937" },
      };

      const numberFormat = "#,##0.00";

      const rowStyle = {
        alignment: { vertical: "middle", horizontal: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      sheet.addRow([
        "Date",
        "Stock Name",
        "Buy Qtn",
        "Per Share Value",
        "Buying Total Value",
        "Commission",
        "Total Value with commission",
        "Sale Qtn",
        "Per Share Value",
        "Selling Total Value",
        "Commission",
        "Total Value with commission",
      ]);

      sheet.getRow(1).eachCell((cell, colNumber) => {
        Object.assign(cell, headerStyle);

        if (colNumber === 1) {
          cell.fill = dateHeaderFill;
        }

        if (colNumber === 2) {
          cell.fill = nameHeaderFill;
        }

        if (colNumber >= 3 && colNumber <= 7) {
          cell.fill = buyHeaderFill;
        }

        if (colNumber >= 8 && colNumber <= 12) {
          cell.fill = saleHeaderFill;
        }
      });

      const totals = {
        buyQty: 0,
        buyTotalValue: 0,
        buyCommission: 0,
        buyNet: 0,
        saleQty: 0,
        saleTotalValue: 0,
        saleCommission: 0,
        saleNet: 0,
      };

      [...filteredList]
        .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
        .forEach((item) => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          const total = item.total || qty * price;
          const commission = total * 0.004;

          let buyQty = "-",
            buyPrice = "-",
            buyTotalValue = "-",
            buyCommission = "-",
            buyNet = "-";
          let saleQty = "-",
            salePrice = "-",
            saleTotalValue = "-",
            saleCommission = "-",
            saleNet = "-";

          if (item.type === "buy") {
            buyQty = qty;
            buyPrice = price;
            buyTotalValue = total;
            buyCommission = commission;
            buyNet = total + commission;

            totals.buyQty += qty;
            totals.buyTotalValue += total;
            totals.buyCommission += commission;
            totals.buyNet += buyNet;
          } else {
            saleQty = qty;
            salePrice = price;
            saleTotalValue = total;
            saleCommission = commission;
            saleNet = total - commission;

            totals.saleQty += qty;
            totals.saleTotalValue += total;
            totals.saleCommission += commission;
            totals.saleNet += saleNet;
          }

          const row = sheet.addRow([
            new Date(item.createdAt || item.date).toLocaleDateString("en-GB"),
            item.stockName || "-",
            buyQty,
            buyPrice,
            buyTotalValue,
            buyCommission,
            buyNet,
            saleQty,
            salePrice,
            saleTotalValue,
            saleCommission,
            saleNet,
          ]);

          row.eachCell((cell, colNumber) => {
            Object.assign(cell, rowStyle);

            if (colNumber >= 3 && colNumber <= 7) {
              cell.fill = buyCellFill;
            }

            if (colNumber >= 8 && colNumber <= 12) {
              cell.fill = saleCellFill;
            }

            if (typeof cell.value === "number") {
              cell.numFmt = numberFormat;
            }
          });
        });

      const totalRow = sheet.addRow([
        "TOTAL",
        "",
        totals.buyQty || "-",
        "",
        totals.buyTotalValue || "-",
        totals.buyCommission || "-",
        totals.buyNet || "-",
        totals.saleQty || "-",
        "",
        totals.saleTotalValue || "-",
        totals.saleCommission || "-",
        totals.saleNet || "-",
      ]);

      totalRow.eachCell((cell, colNumber) => {
        Object.assign(cell, rowStyle);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = totalFill;

        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        }

        if (typeof cell.value === "number") {
          cell.numFmt = numberFormat;
        }
      });

      sheet.columns = [
        { width: 12 },
        { width: 18 },
        { width: 8 },
        { width: 12 },
        { width: 16 },
        { width: 12 },
        { width: 16 },
        { width: 8 },
        { width: 12 },
        { width: 16 },
        { width: 12 },
        { width: 16 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `stock_report_${fromDate}_${toDate}.xlsx`);
    } catch (err) {
      console.log("Export failed:", err);
      alert("Unable to generate the report. Please try again.");
    } finally {
      setReportLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">📈 Stock Reports</h1>
          <p className="text-gray-400">Buy & Sale Performance Summary</p>
        </div>

        {/* FILTER */}
        <ReportFilter
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          handleView={handleView}
          handleExport={handleExport}
          handleReset={handleReset}
          filterLoading={filterLoading}
          reportLoading={reportLoading}
          resetLoading={resetLoading}
        />

        {/* SUMMARY */}
        {showReport ? (
          <>
            <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-700 mb-8">
              <table className="w-full text-center text-sm">
    <thead className="bg-gray-800">
      <tr>
        <th className="p-4 border">Date</th>
        <th className="p-4 border">Stock Name</th>

        <th className="p-4 border">Buy Qtn</th>
        <th className="p-4 border">Per Share Value</th>
        <th className="p-4 border">Buying Total Value</th>
        <th className="p-4 border">Commission</th>
        <th className="p-4 border">
          Total Value with commission
        </th>

        <th className="p-4 border">Sale Qtn</th>
        <th className="p-4 border">Per Share Value</th>
        <th className="p-4 border">Selling Total Value</th>
        <th className="p-4 border">Commission</th>
        <th className="p-4 border">
          Total Value with commission
        </th>

        <th className="p-4 border">Action</th>
      </tr>
    </thead>

    <tbody>
      {filteredList.map((item, i) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const total = item.total || qty * price;
        const commission = total * 0.004;

        return (
          <tr
            key={i}
            className="font-semibold border hover:bg-gray-800"
          >
            {/* DATE */}
            <td className="p-4 border">
              {new Date(
                item.createdAt || item.date,
              ).toLocaleDateString("en-GB")}
            </td>

            {/* STOCK NAME */}
            <td className="p-4 border text-cyan-300">
              {item.stockName}
            </td>

            {/* BUY DATA */}
            <td className="p-4 border text-green-400">
              {item.type === "buy" ? qty : "-"}
            </td>

            <td className="p-4 border text-blue-300">
              {item.type === "buy"
                ? `৳ ${price.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-green-400">
              {item.type === "buy"
                ? `৳ ${total.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-yellow-300">
              {item.type === "buy"
                ? `৳ ${commission.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-emerald-300">
              {item.type === "buy"
                ? `৳ ${(total + commission).toFixed(2)}`
                : "-"}
            </td>

            {/* SALE DATA */}
            <td className="p-4 border text-red-400">
              {item.type === "sale" ? qty : "-"}
            </td>

            <td className="p-4 border text-blue-300">
              {item.type === "sale"
                ? `৳ ${price.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-red-400">
              {item.type === "sale"
                ? `৳ ${total.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-yellow-300">
              {item.type === "sale"
                ? `৳ ${commission.toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border text-pink-300">
              {item.type === "sale"
                ? `৳ ${(total - commission).toFixed(2)}`
                : "-"}
            </td>

            <td className="p-4 border">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(item)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        );
      })}

      {filteredList.length > 0 && (
        <tr className="bg-gray-800 font-bold text-gray-100">
          <td className="p-4 border">TOTAL</td>
          <td className="p-4 border">&nbsp;</td>
          <td className="p-4 border text-green-300">
            {summary.buyQty}
          </td>
          <td className="p-4 border">&nbsp;</td>
          <td className="p-4 border text-green-300">
            ৳ {summary.buyValue.toFixed(2)}
          </td>
          <td className="p-4 border text-yellow-300">
            ৳ {summary.buyCommission.toFixed(2)}
          </td>
          <td className="p-4 border text-emerald-300">
            ৳ {(summary.buyValue + summary.buyCommission).toFixed(2)}
          </td>
          <td className="p-4 border text-red-300">
            {summary.saleQty}
          </td>
          <td className="p-4 border">&nbsp;</td>
          <td className="p-4 border text-red-300">
            ৳ {summary.saleValue.toFixed(2)}
          </td>
          <td className="p-4 border text-yellow-300">
            ৳ {summary.saleCommission.toFixed(2)}
          </td>
          <td className="p-4 border text-pink-300">
            ৳ {(summary.saleValue - summary.saleCommission).toFixed(2)}
          </td>
          <td className="p-4 border">&nbsp;</td>
        </tr>
      )}
    </tbody>
  </table>
</div>


          </>
        ) : (
          <div className="text-center text-gray-400 py-16">
            Click View to show report data.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
