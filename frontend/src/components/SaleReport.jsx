import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ReportFilter from "./ReportFilter";

const SaleReport = ({ saleList, handleEdit, handleDelete }) => {
  const getBDDate = () => {
    const options = {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    return new Intl.DateTimeFormat("en-GB", options)
      .format(new Date())
      .replace(/ /g, "-");
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

  const formatDateString = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    return parsed.toISOString().split("T")[0];
  };

  const getSaleQuantity = (item) =>
    Number(item.saleQuantity ?? item.quantity ?? 0) || 0;

  const formatDateDisplay = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    const day = String(parsed.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[parsed.getMonth()];
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [showReport, setShowReport] = useState(false);
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(formatDateString(new Date()));
  const [filteredSaleList, setFilteredSaleList] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("All");

  const companies = React.useMemo(() => {
    const s = new Set();
    (saleList || []).forEach((i) => {
      if (i.stockName) s.add(i.stockName);
    });
    return Array.from(s).sort();
  }, [saleList]);

  useEffect(() => {
    const filtered = (saleList || []).filter((item) => {
      const itemDate = formatDateString(item.createdAt || item.date);
      const inRange = itemDate >= fromDate && itemDate <= toDate;
      const matchCompany =
        selectedCompany === "All" || item.stockName === selectedCompany;
      return inRange && matchCompany;
    });

    setFilteredSaleList(filtered);
  }, [saleList, fromDate, toDate, selectedCompany]);

  const handleViewReport = async () => {
    setViewLoading(true);

    try {
      setShowReport(true);
    } finally {
      setViewLoading(false);
    }
  };

  const handleResetReport = () => {
    setResetLoading(true);

    setTimeout(() => {
      setFromDate(getFirstDayOfMonth());
      setToDate(formatDateString(new Date()));
      setSelectedCompany("All");
      setShowReport(false);
      setResetLoading(false);
    }, 100);
  };

  const handleExportReport = async () => {
    const data = showReport ? filteredSaleList : saleList;

    if (!data || data.length === 0) {
      alert("No sale data to export. View report first.");
      return;
    }

    setExportLoading(true);

    try {
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date),
      );

      let totalQty = 0;
      let totalSaleValue = 0;
      let totalCommission = 0;
      let totalWithCommission = 0;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sale Report");

      const centerStyle = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const headerRow = sheet.addRow([
        "Date",
        "Company Name",
        "Sale Quantity",
        "Per Share Value",
        "Total Value",
        "Commission",
        "Total Value with Commission",
      ]);
      headerRow.height = 70;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.alignment = centerStyle;
        cell.border = borderStyle;
      });

      sorted.forEach((item) => {
        const qty = getSaleQuantity(item);
        const perShare = Number(item.perShareValue ?? item.price ?? 0) || 0;
        const saleValue =
          Number(item.sallingTotalShareValue ?? item.total ?? 0) || 0;
        const comm = Number(item.commission ?? 0) || 0;
        const tot =
          Number(item.totalValueWithCommission ?? item.total ?? 0) || 0;

        totalQty += qty;
        totalSaleValue += saleValue;
        totalCommission += comm;
        totalWithCommission += tot;

        const row = sheet.addRow([
          formatDateDisplay(item.createdAt || item.date),
          item.stockName || "",
          qty,
          perShare,
          saleValue,
          comm,
          tot,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.alignment = centerStyle;
          cell.border = borderStyle;
          // Format numeric columns to 2 decimal places
          if ([4, 5, 6, 7].includes(colNumber)) {
            cell.numFmt = "#,##0.00";
          }
        });
        row.height = 30;
      });

      const totalRow = sheet.addRow([
        "TOTAL",
        "-",
        totalQty,
        "-",
        totalSaleValue,
        totalCommission,
        totalWithCommission,
      ]);
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.alignment = centerStyle;
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
        // Format numeric columns to 2 decimal places
        if ([5, 6, 7].includes(colNumber)) {
          cell.numFmt = "#,##0.00";
        }
      });

      sheet.columns = [
        { width: 12 },
        { width: 18 },
        { width: 9 },
        { width: 10 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `sale_report_${fromDate}_${toDate}.xlsx`);
    } catch (err) {
      console.log(err);
      alert("Unable to export sale report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Sale Report</h2>
          <p className="text-gray-400 text-sm">
            View, export, or reset sale reports from here.
          </p>
        </div>
      </div>

      <ReportFilter
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        handleView={handleViewReport}
        handleExport={handleExportReport}
        handleReset={handleResetReport}
        filterLoading={viewLoading}
        reportLoading={exportLoading}
        resetLoading={resetLoading}
      />

      {showReport ? (
        <div className="overflow-x-auto bg-gray-950 rounded-2xl border border-gray-800 p-3">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-200">
              <tr>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Company Name</th>
                <th className="p-3 border">Sale Quantity</th>
                <th className="p-3 border">Per Share Value</th>
                <th className="p-3 border">Total Value</th>
                <th className="p-3 border">Commission</th>
                <th className="p-3 border">Total Value with Commission</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSaleList.map((item, index) => (
                <tr
                  key={item._id || index}
                  className="border-b border-gray-800 hover:bg-gray-900"
                >
                  <td className="p-3">
                    {formatDateDisplay(item.createdAt || item.date)}
                  </td>
                  <td className="p-3">{item.stockName}</td>
                  <td className="p-3">
                    {item.saleQuantity ?? item.quantity ?? "-"}
                  </td>
                  <td className="p-3">
                    {item.perShareValue || item.price
                      ? Number(item.perShareValue || item.price).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-3">
                    {item.sallingTotalShareValue || item.total
                      ? Number(
                          item.sallingTotalShareValue || item.total,
                        ).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-3">
                    {item.commission ? Number(item.commission).toFixed(2) : "-"}
                  </td>
                  <td className="p-3">
                    {item.totalValueWithCommission || item.total
                      ? Number(
                          item.totalValueWithCommission || item.total,
                        ).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit && handleEdit(item)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete && handleDelete(item)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-800 font-bold">
                <td className="p-3">TOTAL</td>
                <td className="p-3">-</td>
                <td className="p-3">
                  {filteredSaleList.reduce(
                    (s, it) => s + getSaleQuantity(it),
                    0,
                  )}
                </td>
                <td className="p-3">-</td>
                <td className="p-3">
                  {filteredSaleList
                    .reduce(
                      (s, it) =>
                        s + Number(it.sallingTotalShareValue ?? it.total ?? 0),
                      0,
                    )
                    .toFixed(2)}
                </td>
                <td className="p-3">
                  {filteredSaleList
                    .reduce((s, it) => s + Number(it.commission ?? 0), 0)
                    .toFixed(2)}
                </td>
                <td className="p-3">
                  {filteredSaleList
                    .reduce(
                      (s, it) =>
                        s +
                        Number(it.totalValueWithCommission ?? it.total ?? 0),
                      0,
                    )
                    .toFixed(2)}
                </td>
                <td className="p-3">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-6">
          Click View to show sale report data.
        </div>
      )}
    </div>
  );
};

export default SaleReport;
