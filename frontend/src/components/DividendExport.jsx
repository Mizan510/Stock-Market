import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DividendExport = async ({ filteredList, list, setExportLoading }) => {
  setExportLoading(true);

  try {
    const data = filteredList.length ? filteredList : list;

    const sorted = [...data].sort(
      (a, b) => new Date(a.recordDate) - new Date(b.recordDate),
    );

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

    const headerRow = sheet.addRow([
      "Declaration Date",
      "Record Date",
      "Company",
      "Shares",
      "Dividend %",
      "Face Value",
      "Per Share Dividend",
      "Gross Dividend",
      "Tax %",
      "Tax Amount",
      "Net Dividend",
      "Bank Payment Date",
      "Cost/Share",
      "Dividend per 100 tk",
    ]);

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

    const totals = {
      shares: 0,
      dividendPercent: 0,
      faceValue: 0,
      perShareDividend: 0,
      grossDividend: 0,
      taxPercent: 0,
      taxAmount: 0,
      netDividend: 0,
      costPerShare: 0,
      dividendPer100tk: 0,
    };

    sorted.forEach((item) => {
      const row = sheet.addRow([
        item.declarationDate
          ? new Date(item.declarationDate).toLocaleDateString("en-GB")
          : "",
        item.recordDate
          ? new Date(item.recordDate).toLocaleDateString("en-GB")
          : "",
        item.companyName || "",
        item.shares || "",
        item.dividendPercent || "",
        item.faceValue || "",
        item.perShareDividend || "",
        item.grossDividend || "",
        item.taxPercent || "",
        item.taxAmount || "",
        item.netDividend || "",
        item.bankPaymentDate
          ? new Date(item.bankPaymentDate).toLocaleDateString("en-GB")
          : "",
        item.costPerShare || "",
        item.dividendPer100tk || "",
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = centerStyle;
        cell.border = borderStyle;
        // Net Dividend is column 11
        if (colNumber === 11) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF70AD47" },
          };
        }
      });

      totals.dividendPercent += Number(item.dividendPercent || 0);
      totals.faceValue += Number(item.faceValue || 0);
      totals.perShareDividend += Number(item.perShareDividend || 0);
      totals.grossDividend += Number(item.grossDividend || 0);
      totals.taxPercent += Number(item.taxPercent || 0);
      totals.taxAmount += Number(item.taxAmount || 0);
      totals.netDividend += Number(item.netDividend || 0);
      totals.costPerShare += Number(item.costPerShare || 0);
      totals.dividendPer100tk += Number(item.dividendPer100tk || 0);
    });

    const totalRow = sheet.addRow([
      "",
      "TOTAL",
      "",
      totals.shares,
      totals.dividendPercent,
      totals.faceValue,
      totals.perShareDividend,
      totals.grossDividend,
      totals.taxPercent,
      totals.taxAmount,
      totals.netDividend,
      "",
      totals.costPerShare,
      totals.dividendPer100tk,
    ]);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = centerStyle;
      cell.border = borderStyle;
      // Net Dividend column (column 11) - green highlight
      if (colNumber === 11) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF70AD47" },
        };
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
      }
    });

    sheet.columns = [
      { width: 16 },
      { width: 14 },
      { width: 25 },
      { width: 20 },
      { width: 18 },
      { width: 12 },
      { width: 20 },
      { width: 14 },
      { width: 10 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 20 },
      { width: 18 },
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
