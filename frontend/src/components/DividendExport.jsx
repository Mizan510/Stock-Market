import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DividendExport = async ({ filteredList, list, setExportLoading }) => {
  setExportLoading(true);

  try {
    const data = filteredList.length ? filteredList : list;

    // সর্টিং লজিক থেকে documentationDate বাদ দিয়ে declarationDate বা recordDate ব্যবহার করা হয়েছে
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

    // Header Row থেকে "Documentation Date" কলামটি বাদ দেওয়া হয়েছে
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

    headerRow.eachCell((cell, colNumber) => {
      let fillColor = "FF1F4E79";
      // কলাম সরানোর কারণে ইনডেক্স পরিবর্তন হয়েছে (১২ নম্বর কলাম এখন ১১, ২০ নম্বর কলাম এখন ১৯)
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

    const totals = {
      shares: 0,
      dividendPercent: 0,
      faceValue: 0,
      perShareDividend: 0,
      grossDividend: 0,
      taxPercent: 0,
      taxAmount: 0,
      netDividend: 0,
      netDividendSendInBank: 0,
      costPerShare: 0,
      dividendPer100tk: 0,
      purificationRate: 0,
      purificationAmount: 0,
      nonShariahIncome: 0,
      totalIncome: 0,
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

      // ডাটা রো থেকে documentationDate বাদ দেওয়া হয়েছে
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

      row.eachCell((cell, colNumber) => {
        cell.alignment = { ...centerStyle, wrapText: true };
        cell.border = borderStyle;
        // ১১ নম্বর কলাম (Net Dividend send in bank) গ্রিন হাইলাইট
        if (colNumber === 11) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF70AD47" },
          };
        } else if (colNumber === 19) { // ১৯ নম্বর কলাম (Net Dividend after Purification)
          const style = getNetAfterPurificationStyle(
            rowNetDividendAfterPurification,
          );
          cell.font = style.font;
          cell.fill = style.fill;
        }
      });

      totals.shares += Number(item.shares || 0);
      totals.dividendPercent += Number(item.dividendPercent || 0);
      totals.faceValue += Number(item.faceValue || 0);
      totals.perShareDividend += Number(item.perShareDividend || 0);
      totals.grossDividend += Number(item.grossDividend || 0);
      totals.taxPercent += Number(item.taxPercent || 0);
      totals.taxAmount += Number(item.taxAmount || 0);
      totals.netDividendSendInBank += rowNetDividendSendInBank;
      totals.costPerShare += Number(item.costPerShare || 0);
      totals.dividendPer100tk += Number(item.dividendPer100tk || 0);
      totals.purificationRate += rowPurificationRate;
      totals.purificationAmount += rowPurificationAmount;
      totals.nonShariahIncome += Number(item.nonShariahIncome || 0);
      totals.totalIncome += Number(item.totalIncome || 0);
      totals.netDividendAfterPurification += rowNetDividendAfterPurification;
    });

    // Total Row থেকে প্রথম ফাকা সেলটি একটি কমানো হয়েছে
    const totalRow = sheet.addRow([
      "",
      "",
      "TOTAL",
      totals.shares,
      totals.dividendPercent,
      totals.faceValue,
      totals.perShareDividend,
      totals.grossDividend,
      totals.taxPercent,
      totals.taxAmount,
      totals.netDividendSendInBank,
      "",
      totals.costPerShare,
      totals.dividendPer100tk,
      totals.nonShariahIncome,
      totals.totalIncome,
      totals.purificationRate,
      totals.purificationAmount,
      totals.netDividendAfterPurification,
    ]);

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

    // ১টি কলাম কমে যাওয়ার কারণে কলামের উইডথ সেটিংস ১৯টি কলামের জন্য রি-অ্যারেঞ্জ করা হয়েছে
    sheet.columns = [
      { width: 14 }, // Declaration Date
      { width: 12 }, // Record Date
      { width: 20 }, // Company Name
      { width: 10 }, // Shares
      { width: 10 }, // Dividend %
      { width: 10 }, // Face Value
      { width: 10 }, // Per Share Dividend
      { width: 12 }, // Gross Dividend
      { width: 8 },  // Tax %
      { width: 12 }, // Tax Amount
      { width: 12 }, // Net Dividend send in bank
      { width: 14 }, // Bank Payment Date
      { width: 12 }, // Cost/Share
      { width: 14 }, // Dividend per 100 tk
      { width: 14 }, // Non Shariah Income
      { width: 14 }, // Total Income
      { width: 12 }, // Purification Rate
      { width: 12 }, // Purification Amount
      { width: 16 }, // Net Dividend after Purification
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
