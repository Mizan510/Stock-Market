import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ReportFilter from "../components/ReportFilter";
import { useConfirm } from "../components/ConfirmProvider";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const Reports = () => {
  const userId = getCurrentUserId();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Active state tracking which company row is expanded for inline editing
  const [expandedEditCompany, setExpandedEditCompany] = useState(null);

  // Track inputs for the specific sub-transaction being edited inline
  const [editingRowId, setEditingRowId] = useState(null);
  const [editStockName, setEditStockName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      }),
    );
    return bd.toISOString().split("T")[0];
  };

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(getBDDate());

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("All");

  const formatDateString = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    fetchReports();
  }, []);

  const companies = useMemo(() => {
    const s = new Set();
    list.forEach((i) => {
      if (i.stockName) s.add(i.stockName);
    });
    return Array.from(s).sort();
  }, [list]);

  useEffect(() => {
    const filtered = list.filter((item) => {
      const itemDateStr = formatDateString(item.createdAt || item.date);
      const inRange = itemDateStr >= fromDate && itemDateStr <= toDate;
      const matchCompany =
        selectedCompany === "All" || item.stockName === selectedCompany;
      return inRange && matchCompany;
    });
    setFilteredList(filtered);
  }, [list, fromDate, toDate, selectedCompany]);

  const getEarliestDate = (items) => {
    let earliest = null;
    items.forEach((item) => {
      const dateStr = formatDateString(item.createdAt || item.date);
      if (!earliest || dateStr < earliest) {
        earliest = dateStr;
      }
    });
    return earliest || getBDDate();
  };

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
      const earliestDate = getEarliestDate(merged);
      setFromDate(earliestDate);

      const filtered = merged.filter((item) => {
        const itemDateStr = formatDateString(item.createdAt || item.date);
        return itemDateStr >= earliestDate && itemDateStr <= toDate;
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
        const inRange = itemDateStr >= fromDate && itemDateStr <= toDate;
        const matchCompany =
          selectedCompany === "All" || item.stockName === selectedCompany;
        return inRange && matchCompany;
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
      const newFromDate = list.length ? getEarliestDate(list) : getBDDate();
      const newToDate = getBDDate();

      setFromDate(newFromDate);
      setToDate(newToDate);
      setSelectedCompany("All");

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

  const getRecordQuantity = (item) => {
    if (item.type === "buy") {
      return Number(item.buyQuantity ?? item.quantity ?? 0);
    }
    if (item.type === "sale") {
      return Number(item.saleQuantity ?? item.quantity ?? 0);
    }
    return Number(item.buyQuantity ?? item.saleQuantity ?? item.quantity ?? 0);
  };

  const startInlineEdit = (item) => {
    setEditingRowId(item._id);
    setEditStockName(item.stockName);
    setEditQuantity(getRecordQuantity(item));
    setEditPrice(item.perShareValue ?? item.price ?? 0);
  };

  const handleInlineSave = async (item) => {
    const quantity = Number(editQuantity);
    const price = Number(editPrice);

    if (!editStockName.trim() || !quantity || !price) {
      return showAlert("Please provide valid stock, quantity, and price.");
    }

    const updatePayload = { stockName: editStockName.trim() };

    if (item.type === "buy") {
      const buyQuantity = quantity;
      const perShareValue = price;
      const buyingTotalShareValue = buyQuantity * perShareValue;
      const commission = Number((buyingTotalShareValue * 0.004).toFixed(2));
      const totalValueWithCommission = buyingTotalShareValue + commission;

      Object.assign(updatePayload, {
        buyQuantity,
        perShareValue,
        buyingTotalShareValue,
        commission,
        totalValueWithCommission,
        quantity: buyQuantity,
        price: perShareValue,
        total: totalValueWithCommission,
      });
    } else {
      const saleQuantity = quantity;
      const perShareValue = price;
      const sallingTotalShareValue = saleQuantity * perShareValue;
      const commission = Number((sallingTotalShareValue * 0.004).toFixed(2));
      const totalValueWithCommission = sallingTotalShareValue - commission;

      Object.assign(updatePayload, {
        saleQuantity,
        perShareValue,
        sallingTotalShareValue,
        commission,
        totalValueWithCommission,
      });
    }

    setActionLoading(item._id);
    try {
      await api.put(`/${item.type}/update/${item._id}`, updatePayload);
      await fetchReports();
      setEditingRowId(null);
      setExpandedEditCompany(null);
      showSuccessAlert("Record updated successfully!");
    } catch (err) {
      console.log("Update error:", err);
      showErrorAlert("Unable to update record. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const companyReports = useMemo(() => {
    const groups = {};

    filteredList.forEach((item) => {
      const stockName = item.stockName || "Unknown";
      if (!groups[stockName]) {
        groups[stockName] = {
          stockName,
          buyQty: 0,
          buyTotalValue: 0,
          buyCommission: 0,
          buyNet: 0,
          saleQty: 0,
          saleTotalValue: 0,
          saleCommission: 0,
          saleNet: 0,
          rawItems: [],
        };
      }

      groups[stockName].rawItems.push(item);

      const qty = getRecordQuantity(item);
      const price = Number(item.perShareValue ?? item.price ?? 0);
      const totalValue = Number(
        item.buyingTotalShareValue ??
          item.sallingTotalShareValue ??
          item.total ??
          qty * price,
      );
      const commission = Number(
        item.commission !== undefined ? item.commission : totalValue * 0.004,
      );

      if (item.type === "buy") {
        groups[stockName].buyQty += qty;
        groups[stockName].buyTotalValue += totalValue;
        groups[stockName].buyCommission += commission;
        groups[stockName].buyNet += totalValue + commission;
      } else {
        groups[stockName].saleQty += qty;
        groups[stockName].saleTotalValue += totalValue;
        groups[stockName].saleCommission += commission;
        groups[stockName].saleNet += totalValue - commission;
      }
    });

    return Object.values(groups).map((company) => {
      const remainQty = company.buyQty - company.saleQty;
      const buyEffective = company.buyQty ? company.buyNet / company.buyQty : 0;
      const sellEffective = company.saleQty
        ? company.saleNet / company.saleQty
        : 0;
      const remainQtyValue = remainQty * buyEffective;
      const perShareProfitLoss = company.saleQty
        ? sellEffective - buyEffective
        : 0;
      const netProfitLoss = company.saleQty
        ? company.saleNet - buyEffective * company.saleQty
        : 0;

      return {
        ...company,
        remainQty,
        buyEffective,
        sellEffective,
        remainQtyValue,
        perShareProfitLoss,
        netProfitLoss,
      };
    });
  }, [filteredList]);

  const handleExport = async () => {
    if (companyReports.length === 0) {
      showAlert(
        "No data to export. Please apply filters and view the report first.",
      );
      return;
    }

    setReportLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Company Report");

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
        "Company Name",
        "Buy (Total Qtn)",
        "Buy (Total Value with commission)",
        "Sale (Total Qtn)",
        "Sale (Total Value with commission)",
        "Remain Qtn",
        "Buy Per Share+ Commission",
        "Sell Per Share+ Commission",
        "Remain Qtn Value",
        "PER SHARE Profit/Loss",
        "Net Profit/Loss",
      ]);

      sheet.getRow(1).height = 80;
      sheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
      });

      let totals = {
        buyQty: 0,
        buyValue: 0,
        saleQty: 0,
        saleValue: 0,
        remainQty: 0,
        remainValue: 0,
        netProfitLoss: 0,
      };

      companyReports.forEach((item) => {
        totals.buyQty += item.buyQty;
        totals.buyValue += item.buyNet;
        totals.saleQty += item.saleQty;
        totals.saleValue += item.saleNet;
        totals.remainQty += item.remainQty;
        totals.remainValue += item.remainQtyValue;
        totals.netProfitLoss += item.netProfitLoss;

        const row = sheet.addRow([
          item.stockName,
          item.buyQty || "-",
          item.buyNet || "-",
          item.saleQty || "-",
          item.saleNet || "-",
          item.remainQty || "-",
          item.buyEffective || "-",
          item.sellEffective || "-",
          item.remainQtyValue || "-",
          item.perShareProfitLoss || "-",
          item.netProfitLoss || "-",
        ]);

        row.eachCell((cell, colNumber) => {
          Object.assign(cell, rowStyle);
          if (typeof cell.value === "number") {
            cell.numFmt = numberFormat;
          }
          if (colNumber === 1) {
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };
          }
          if (colNumber === 7) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD4EDDA" },
            };
          } else if (colNumber === 8) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8D7D3" },
            };
          } else if (colNumber === 11) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCE4D6" },
            };
          }
        });
      });

      const totalRow = sheet.addRow([
        "TOTAL",
        totals.buyQty || "-",
        totals.buyValue || "-",
        totals.saleQty || "-",
        totals.saleValue || "-",
        totals.remainQty || "-",
        "",
        "",
        totals.remainValue || "-",
        "",
        totals.netProfitLoss || "-",
      ]);

      totalRow.eachCell((cell, colNumber) => {
        Object.assign(cell, rowStyle);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = totalFill;

        if (colNumber === 1) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
          };
        }

        if (typeof cell.value === "number") {
          cell.numFmt = numberFormat;
        }

        if (colNumber === 7) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF70AD47" },
          };
        } else if (colNumber === 8) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFC5504C" },
          };
        } else if (colNumber === 11) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFED7D31" },
          };
        }
      });

      sheet.columns = [
        { width: 18 },
        { width: 10 },
        { width: 18 },
        { width: 10 },
        { width: 18 },
        { width: 12 },
        { width: 16 },
        { width: 16 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `stock_company_report_${fromDate}_${toDate}.xlsx`);
    } catch (err) {
      console.log("Export failed:", err);
      showErrorAlert("Unable to generate the report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const companySummary = useMemo(() => {
    return companyReports.reduce(
      (acc, item) => {
        acc.buyQty += item.buyQty;
        acc.buyValue += item.buyNet;
        acc.saleQty += item.saleQty;
        acc.saleValue += item.saleNet;
        acc.remainQty += item.remainQty;
        acc.remainValue += item.remainQtyValue;
        acc.netProfitLoss += item.netProfitLoss;
        return acc;
      },
      {
        buyQty: 0,
        buyValue: 0,
        saleQty: 0,
        saleValue: 0,
        remainQty: 0,
        remainValue: 0,
        netProfitLoss: 0,
      },
    );
  }, [companyReports]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold mb-2">📈 Company Wise Report</h1>
            <p className="text-gray-400">Buy & Sale Performance Summary</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="self-end rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            Back
          </button>
        </div>

        {/* FILTER */}
        <ReportFilter
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          companies={companies}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
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
                    <th className="p-4 border">Company Name</th>
                    <th className="p-4 border">Buy (Total Qtn)</th>
                    <th className="p-4 border">
                      Buy (Total Value with commission)
                    </th>
                    <th className="p-4 border">Sale (Total Qtn)</th>
                    <th className="p-4 border">
                      Sale (Total Value with commission)
                    </th>
                    <th className="p-4 border">Remain Qtn</th>
                    <th className="p-4 border">Buy Per Share+ Commission</th>
                    <th className="p-4 border">Sell Per Share+ Commission</th>
                    <th className="p-4 border">Remain Qtn Value</th>
                    <th className="p-4 border">PER SHARE Profit/Loss</th>
                    <th className="p-4 border">Net Profit/Loss</th>
                    <th className="p-4 border">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {companyReports.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="font-semibold border hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 border text-cyan-300 text-left">
                          {item.stockName}
                        </td>
                        <td className="p-4 border text-green-300">
                          {item.buyQty || "-"}
                        </td>
                        <td className="p-4 border text-green-300">
                          ৳ {item.buyNet.toFixed(2)}
                        </td>
                        <td className="p-4 border text-red-300">
                          {item.saleQty || "-"}
                        </td>
                        <td className="p-4 border text-red-300">
                          ৳ {item.saleNet.toFixed(2)}
                        </td>
                        <td className="p-4 border text-yellow-300">
                          {item.remainQty}
                        </td>
                        <td className="p-4 border text-blue-300">
                          ৳ {item.buyEffective.toFixed(2)}
                        </td>
                        <td className="p-4 border text-blue-300">
                          {item.saleQty
                            ? `৳ ${item.sellEffective.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="p-4 border text-emerald-300">
                          ৳ {item.remainQtyValue.toFixed(2)}
                        </td>
                        <td className="p-4 border text-pink-300">
                          {item.saleQty
                            ? `৳ ${item.perShareProfitLoss.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="p-4 border text-pink-300">
                          {item.saleQty
                            ? `৳ ${item.netProfitLoss.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="p-4 border">
                          <button
                            onClick={() => {
                              setExpandedEditCompany(
                                expandedEditCompany === index ? null : index,
                              );
                              setEditingRowId(null);
                            }}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>

                      {/* INLINE TABLE EXPANSE FOR TRANSACTION BREAKDOWN AND FORM EDITING */}
                      {expandedEditCompany === index && (
                        <tr className="bg-gray-950 border-x">
                          <td colSpan="12" className="p-4">
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-inner max-w-4xl mx-auto">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-left">
                                Individual Transactions for {item.stockName}
                              </h3>
                              <table className="w-full text-left text-xs border border-gray-800">
                                <thead className="bg-gray-800 text-gray-300 font-semibold">
                                  <tr>
                                    <th className="p-2 border border-gray-800">
                                      Type
                                    </th>
                                    <th className="p-2 border border-gray-800">
                                      Stock Name
                                    </th>
                                    <th className="p-2 border border-gray-800">
                                      Quantity
                                    </th>
                                    <th className="p-2 border border-gray-800">
                                      Price (৳)
                                    </th>
                                    <th className="p-2 border border-gray-800 text-center">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.rawItems.map((raw) => (
                                    <tr
                                      key={raw._id}
                                      className="border-b border-gray-800 hover:bg-gray-850"
                                    >
                                      {editingRowId === raw._id ? (
                                        <>
                                          {/* Form Edit Option Fields Right on Table */}
                                          <td className="p-2 border border-gray-800 font-bold capitalize text-amber-400">
                                            {raw.type}
                                          </td>
                                          <td className="p-2 border border-gray-800">
                                            <input
                                              type="text"
                                              value={editStockName}
                                              onChange={(e) =>
                                                setEditStockName(e.target.value)
                                              }
                                              className="bg-gray-800 text-white rounded border border-gray-700 px-2 py-1 w-full focus:outline-none focus:border-blue-500"
                                            />
                                          </td>
                                          <td className="p-2 border border-gray-800">
                                            <input
                                              type="number"
                                              value={editQuantity}
                                              onChange={(e) =>
                                                setEditQuantity(e.target.value)
                                              }
                                              className="bg-gray-800 text-white rounded border border-gray-700 px-2 py-1 w-24 focus:outline-none focus:border-blue-500"
                                            />
                                          </td>
                                          <td className="p-2 border border-gray-800">
                                            <input
                                              type="number"
                                              step="any"
                                              value={editPrice}
                                              onChange={(e) =>
                                                setEditPrice(e.target.value)
                                              }
                                              className="bg-gray-800 text-white rounded border border-gray-700 px-2 py-1 w-24 focus:outline-none focus:border-blue-500"
                                            />
                                          </td>
                                          <td className="p-2 border border-gray-800 text-center">
                                            <div className="flex justify-center gap-2">
                                              <button
                                                disabled={
                                                  actionLoading === raw._id
                                                }
                                                onClick={() =>
                                                  handleInlineSave(raw)
                                                }
                                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500 font-semibold"
                                              >
                                                {actionLoading === raw._id
                                                  ? "Saving..."
                                                  : "Save"}
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setEditingRowId(null)
                                                }
                                                className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 font-semibold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td
                                            className={`p-2 border border-gray-800 font-bold capitalize ${raw.type === "buy" ? "text-green-400" : "text-red-400"}`}
                                          >
                                            {raw.type}
                                          </td>
                                          <td className="p-2 border border-gray-800 font-medium text-gray-200">
                                            {raw.stockName}
                                          </td>
                                          <td className="p-2 border border-gray-800 text-gray-300">
                                            {getRecordQuantity(raw)}
                                          </td>
                                          <td className="p-2 border border-gray-800 font-mono text-gray-300">
                                            ৳
                                            {raw.perShareValue ??
                                              raw.price ??
                                              0}
                                          </td>
                                          <td className="p-2 border border-gray-800 text-center">
                                            <button
                                              onClick={() =>
                                                startInlineEdit(raw)
                                              }
                                              className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 font-medium transition-colors"
                                            >
                                              Edit
                                            </button>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {companyReports.length > 0 && (
                    <tr className="bg-purple-950 font-bold text-white">
                      <td className="p-4 border text-left">TOTAL</td>
                      <td className="p-4 border text-green-300">
                        {companySummary.buyQty}
                      </td>
                      <td className="p-4 border text-green-300">
                        ৳ {companySummary.buyValue.toFixed(2)}
                      </td>
                      <td className="p-4 border text-red-300">
                        {companySummary.saleQty}
                      </td>
                      <td className="p-4 border text-red-300">
                        ৳ {companySummary.saleValue.toFixed(2)}
                      </td>
                      <td className="p-4 border text-yellow-300">
                        {companySummary.remainQty}
                      </td>
                      <td className="p-4 border">&nbsp;</td>
                      <td className="p-4 border">&nbsp;</td>
                      <td className="p-4 border text-emerald-300">
                        ৳ {companySummary.remainValue.toFixed(2)}
                      </td>
                      <td className="p-4 border">&nbsp;</td>
                      <td className="p-4 border text-pink-300">
                        ৳ {companySummary.netProfitLoss.toFixed(2)}
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
