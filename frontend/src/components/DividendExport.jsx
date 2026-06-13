import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DividendExport = async ({ filteredList, list, setExportLoading }) => {
  setExportLoading(true);

  try {
    const data = filteredList.length ? filteredList : list;

    const sorted = [...data].sort((a, b) => {
      const getPrimaryDate = (item) => item.declarationDate || item.recordDate;
      const dateA = getPrimaryDate(a) ? new Date(getPrimaryDate(a)) : new Date(0);
      const dateB = getPrimaryDate(b) ? new Date(getPrimaryDate(b)) : new Date(0);
      return dateA - dateB;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Dividend Report");

    const centerStyle = {
      vertical: "middle",
      horizontal: "center",
    };

    const borderStyle = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const getNetAfterPurificationStyle = (value) => {
      const numericValue = Number(value) || 0;
      if (numericValue > 0) {
        return {
          font: { bold: true, color: { argb: "FFFFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F7A35" },
          },
        };
      }

      if (numericValue < 0) {
        return {
          font: { bold: true, color: { argb: "FFFFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF9C0006" },
          },
        };
      }

      return {
        font: { bold: true, color: { argb: "FF000000" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEECE1" },
        },
      };
    };

    const headerRow = sheet.addRow([
      "Declaration Date",
      "Record Date",
      "Company Name",
      "Shares",
      "Dividend %",
      "Face Value",
      "Per Share Dividend",
      "Gross Dividend",
      "Tax %",
      "Tax Amount",
      "Net Dividend send in bank",
      "Bank Payment Date",
      "Cost/Share",
      "Dividend per 100 tk",
      "Non Shariah Income",
      "Total Income",
      "Purification Rate",
      "Purification Amount",
      "Net Dividend after Purification",
    ]);

    headerRow.height = 35;

    headerRow.eachCell((cell, colNumber) => {
      let fillColor = "FF1F4E79";
      if (colNumber === 11) {
        fillColor = "FF70AD47";
      } else if (colNumber === 19) {
        fillColor = getNetAfterPurificationStyle(1).fill.fgColor.argb;
      }

      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      cell.alignment = { ...centerStyle, wrapText: true };
      cell.border = borderStyle;
    });

    // ব্যাকগ্রাউন্ড স্টাইলিং কালার ঠিক রাখার জন্য totals অবজেক্টটি রাখা হয়েছে
    const totals = {
      netDividendAfterPurification: 0,
    };

    sorted.forEach((item) => {
      const parseNumber = (value) =>
        value === "" || value == null ? 0 : Number(value);

      const parseDate = (dateValue) => {
        if (!dateValue) return "";
        try {
          let date;
          if (typeof dateValue === "string") {
            date = dateValue.includes("T")
              ? new Date(dateValue)
              : new Date(dateValue + "T00:00:00Z");
          } else {
            date = new Date(dateValue);
          }

          if (isNaN(date.getTime())) {
            return dateValue || "";
          }

          return date.toLocaleDateString("en-GB");
        } catch (e) {
          return dateValue || "";
        }
      };

      const grossDividend = parseNumber(item.grossDividend);
      const taxAmount = parseNumber(item.taxAmount);
      const netDividend = parseNumber(item.netDividend);
      const nonShariahIncome = parseNumber(item.nonShariahIncome);
      const totalIncome = parseNumber(item.totalIncome);

      const rowNetDividendSendInBank =
        item.netDividendSendInBank !== undefined &&
        item.netDividendSendInBank !== null
          ? parseNumber(item.netDividendSendInBank)
          : grossDividend - taxAmount;

      const rowPurificationRate =
        item.purificationRate !== undefined && item.purificationRate !== null
          ? parseNumber(item.purificationRate)
          : totalIncome > 0
            ? (nonShariahIncome / totalIncome) * 100
            : 0;

      const rowPurificationAmount =
        item.purificationAmount !== undefined &&
        item.purificationAmount !== null
          ? parseNumber(item.purificationAmount)
          : grossDividend * (rowPurificationRate / 100);

      const rowNetDividendAfterPurification =
        item.netDividendAfterPurification !== undefined &&
        item.netDividendAfterPurification !== null
          ? parseNumber(item.netDividendAfterPurification)
          : netDividend - rowPurificationAmount;

      const row = sheet.addRow([
        parseDate(item.declarationDate),
        parseDate(item.recordDate),
        item.companyName || "",
        item.shares || "",
        item.dividendPercent || "",
        item.faceValue || "",
        item.perShareDividend || "",
        item.grossDividend || "",
        item.taxPercent || "",
        item.taxAmount || "",
        rowNetDividendSendInBank || "",
        parseDate(item.bankPaymentDate),
        item.costPerShare || "",
        item.dividendPer100tk || "",
        item.nonShariahIncome || "",
        item.totalIncome || "",
        rowPurificationRate || "",
        rowPurificationAmount || "",
        rowNetDividendAfterPurification || "",
      ]);

      row.height = 30;

      row.eachCell((cell, colNumber) => {
        cell.alignment = { ...centerStyle, wrapText: true };
        cell.border = borderStyle;
        if (colNumber === 11) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF70AD47" },
          };
        } else if (colNumber === 19) {
          const style = getNetAfterPurificationStyle(
            rowNetDividendAfterPurification,
          );
          cell.font = style.font;
          cell.fill = style.fill;
        }
      });

      totals.netDividendAfterPurification += rowNetDividendAfterPurification;
    });

    // Excel SUM formula ডাইনামিক রেঞ্জ নির্ধারণের জন্য
    const startRow = 2; // হেডার রো ১, তাই ড্যাটা শুরু রো ২ থেকে
    const endRow = sorted.length + 1;

    const totalRow = sheet.addRow([
      "", // Declaration Date
      "", // Record Date
      "SUM", // Company Name কলামে লেবেল পরিবর্তন করা হলো
      { formula: `SUM(D${startRow}:D${endRow})` }, // Shares (Col D)
      { formula: `SUM(E${startRow}:E${endRow})` }, // Dividend % (Col E)
      { formula: `SUM(F${startRow}:F${endRow})` }, // Face Value (Col F)
      { formula: `SUM(G${startRow}:G${endRow})` }, // Per Share Dividend (Col G)
      { formula: `SUM(H${startRow}:H${endRow})` }, // Gross Dividend (Col H)
      { formula: `SUM(I${startRow}:I${endRow})` }, // Tax % (Col I)
      { formula: `SUM(J${startRow}:J${endRow})` }, // Tax Amount (Col J)
      { formula: `SUM(K${startRow}:K${endRow})` }, // Net Dividend send in bank (Col K)
      "", // Bank Payment Date
      { formula: `SUM(M${startRow}:M${endRow})` }, // Cost/Share (Col M)
      { formula: `SUM(N${startRow}:N${endRow})` }, // Dividend per 100 tk (Col N)
      { formula: `SUM(O${startRow}:O${endRow})` }, // Non Shariah Income (Col O)
      { formula: `SUM(P${startRow}:P${endRow})` }, // Total Income (Col P)
      { formula: `SUM(Q${startRow}:Q${endRow})` }, // Purification Rate (Col Q)
      { formula: `SUM(R${startRow}:R${endRow})` }, // Purification Amount (Col R)
      { formula: `SUM(S${startRow}:S${endRow})` }, // Net Dividend after Purification (Col S)
    ]);

    totalRow.height = 25;

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = { ...centerStyle, wrapText: true };
      cell.border = borderStyle;
      
      if (colNumber === 11) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF70AD47" },
        };
      } else if (colNumber === 19) {
        const style = getNetAfterPurificationStyle(
          totals.netDividendAfterPurification,
        );
        cell.font = style.font;
        cell.fill = style.fill;
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
      }
    });

    sheet.columns = [
      { width: 15 }, // Declaration Date
      { width: 13 }, // Record Date
      { width: 22 }, // Company Name
      { width: 11 }, // Shares
      { width: 12 }, // Dividend %
      { width: 11 }, // Face Value
      { width: 15 }, // Per Share Dividend
      { width: 14 }, // Gross Dividend
      { width: 9 },  // Tax %
      { width: 13 }, // Tax Amount
      { width: 18 }, // Net Dividend send in bank
      { width: 15 }, // Bank Payment Date
      { width: 13 }, // Cost/Share
      { width: 16 }, // Dividend per 100 tk
      { width: 16 }, // Non Shariah Income
      { width: 14 }, // Total Income
      { width: 14 }, // Purification Rate
      { width: 15 }, // Purification Amount
      { width: 22 }, // Net Dividend after Purification
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "dividend_report.xlsx");
  } finally {
    setExportLoading(false);
  }
};

export default DividendExport;
