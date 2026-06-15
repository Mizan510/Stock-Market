import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
  showConfirm,
} from "../utils/sweetAlert";

const UpdatePrice = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [zoneData, setZoneData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [comparisonData, setComparisonData] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company: "",
    todaysHigh: "",
    todaysLow: "",
    closingPrice: "",
    low: "",
    high: "",
  });

  // Helper function to convert company names to uppercase
  const toUpperCaseName = (name) => {
    if (!name) return name;
    return name.toUpperCase().trim();
  };

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/zone");
        const zoneList = res.data || [];
        
        const uppercasedZoneList = zoneList.map(item => ({
          ...item,
          company: toUpperCaseName(item.company)
        }));
        
        setZoneData(uppercasedZoneList);
        
        const uniqueCompanies = [
          ...new Set(uppercasedZoneList.map((item) => item.company)),
        ].sort();
        setCompanies(uniqueCompanies);
      } catch (err) {
        console.error(err);
        showErrorAlert("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Alphabetical sorting computation logic (A to Z)
  const sortedZoneData = useMemo(() => {
    return [...zoneData].sort((a, b) => {
      const companyA = (a.company || "").trim();
      const companyB = (b.company || "").trim();
      return companyA.localeCompare(companyB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [zoneData]);

  const handleCompanySelect = (e) => {
    const selected = e.target.value;
    if (!selected) {
      handleReset();
      return;
    }

    const existingCompany = zoneData.find((item) => item.company === selected);

    if (existingCompany) {
      setFormData({
        company: existingCompany.company || "",
        todaysHigh: existingCompany.todaysHigh ? String(existingCompany.todaysHigh) : "",
        todaysLow: existingCompany.todaysLow ? String(existingCompany.todaysLow) : "",
        closingPrice: existingCompany.closingPrice ? String(existingCompany.closingPrice) : "",
        low: existingCompany.low ? String(existingCompany.low) : "",
        high: existingCompany.high ? String(existingCompany.high) : "",
        _id: existingCompany._id,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          showAlert("The uploaded data file contains no valid records.");
          return;
        }

        const processedData = processExcelData(rawData);
        setExcelPreviewData(processedData);
        
        const compared = compareWithExistingData(processedData);
        setComparisonData(compared);
        setShowComparison(true);
        
        if (processedData.length > 0) {
          setShowReport(true);
          showSuccessAlert(`Successfully loaded ${processedData.length} records from ${file.name}`);
        }
      } catch (err) {
        console.error("Excel parsing error:", err);
        showErrorAlert("Error parsing Excel file. Please check the file format.");
        setExcelPreviewData(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const compareWithExistingData = (uploadedData) => {
    return uploadedData.map(uploaded => {
      const uppercasedCompany = toUpperCaseName(uploaded.company);
      const existing = zoneData.find(
        existing => existing.company?.toLowerCase() === uppercasedCompany?.toLowerCase()
      );
      
      if (!existing) {
        return {
          ...uploaded,
          company: uppercasedCompany,
          existing: null,
          isNew: true,
          hasMismatch: true,
          mismatches: []
        };
      }
      
      const mismatches = [];
      
      if (Number(uploaded.low) !== Number(existing.low)) {
        mismatches.push({ field: '1Y Low', old: existing.low, new: uploaded.low });
      }
      if (Number(uploaded.high) !== Number(existing.high)) {
        mismatches.push({ field: '1Y High', old: existing.high, new: uploaded.high });
      }
      if (Number(uploaded.todaysHigh) !== Number(existing.todaysHigh)) {
        mismatches.push({ field: 'Session High', old: existing.todaysHigh, new: uploaded.todaysHigh });
      }
      if (Number(uploaded.todaysLow) !== Number(existing.todaysLow)) {
        mismatches.push({ field: 'Session Low', old: existing.todaysLow, new: uploaded.todaysLow });
      }
      if (Number(uploaded.closingPrice) !== Number(existing.closingPrice)) {
        mismatches.push({ field: 'Session Close', old: existing.closingPrice, new: uploaded.closingPrice });
      }
      
      return {
        ...uploaded,
        company: uppercasedCompany,
        existing: existing,
        isNew: false,
        hasMismatch: mismatches.length > 0,
        mismatches: mismatches
      };
    });
  };

  const processExcelData = (rawData) => {
    const parseNum = (val) => {
      if (val === undefined || val === null || String(val).trim() === "") return null;
      const num = Number(String(val).replace(/,/g, ''));
      return isNaN(num) ? null : num;
    };

    return rawData.map((item) => {
      let compName = String(
        item["Trading Code"] || item["Symbol"] || item["Scrip"] || 
        item["Company Name"] || item["Company"] || item["CompanyName"] || ""
      ).trim();
      
      compName = toUpperCaseName(compName);

      const rawHigh = item["Session High"] !== undefined ? item["Session High"] : 
                     item["SessionHigh"] !== undefined ? item["SessionHigh"] : 
                     item["High"] !== undefined ? item["High"] : 
                     item["TodaysHigh"] !== undefined ? item["TodaysHigh"] : null;
                     
      const rawLow = item["Session Low"] !== undefined ? item["Session Low"] : 
                    item["SessionLow"] !== undefined ? item["SessionLow"] : 
                    item["Low"] !== undefined ? item["Low"] : 
                    item["TodaysLow"] !== undefined ? item["TodaysLow"] : null;
                    
      const rawClose = item["Session Close"] !== undefined ? item["Session Close"] : 
                      item["SessionClose"] !== undefined ? item["SessionClose"] : 
                      item["LTP"] !== undefined ? item["LTP"] : 
                      item["Close"] !== undefined ? item["Close"] : 
                      item["ClosingPrice"] !== undefined ? item["ClosingPrice"] : null;
                      
      const oneYLow = item["1Y Low"] !== undefined ? item["1Y Low"] : 
                     item["1YLow"] !== undefined ? item["1YLow"] : 
                     item["YearLow"] !== undefined ? item["YearLow"] : 
                     item["Low Price"] !== undefined ? item["Low Price"] : null;
                     
      const oneYHigh = item["1Y High"] !== undefined ? item["1Y High"] : 
                      item["1YHigh"] !== undefined ? item["1YHigh"] : 
                      item["YearHigh"] !== undefined ? item["YearHigh"] : 
                      item["High Price"] !== undefined ? item["High Price"] : null;

      const h = parseNum(rawHigh);
      const l = parseNum(rawLow);
      const c = parseNum(rawClose);
      const yearLow = parseNum(oneYLow);
      const yearHigh = parseNum(oneYHigh);

      let computedPivot = null;
      if (h !== null && l !== null && c !== null) {
        computedPivot = (h + l + c) / 3;
      }

      return {
        company: compName,
        todaysHigh: h,
        todaysLow: l,
        closingPrice: c,
        low: yearLow,
        high: yearHigh,
        pivotPoint: computedPivot,
        _processed: true
      };
    }).filter(item => item.company);
  };

  const handleMergeAndSave = async () => {
    if (!comparisonData || comparisonData.length === 0) {
      showAlert("No data to merge. Please upload an Excel file first.");
      return;
    }

    const mismatchCount = comparisonData.filter(d => d.hasMismatch && !d.isNew).length;
    const newCount = comparisonData.filter(d => d.isNew).length;
    const totalChanges = mismatchCount + newCount;
    
    if (totalChanges === 0) {
      showAlert("No changes detected. All uploaded data matches existing records.");
      return;
    }

    const confirmed = await showConfirm(
      `📊 Merge Summary:\n\n` +
      `• Records with changes: ${mismatchCount}\n` +
      `• New records to add: ${newCount}\n` +
      `• Total updates: ${totalChanges}\n\n` +
      `Do you want to proceed with merging these updates?`,
      "Confirm Merge & Update"
    );

    if (!confirmed) return;

    try {
      setSubmitLoading(true);
      const updatedZoneMap = new Map();
      
      zoneData.forEach(item => {
        updatedZoneMap.set(item.company.toLowerCase(), { ...item });
      });
      
      let successCount = 0;
      let errorCount = 0;
      let newCompaniesList = new Set(companies.map(c => c.toLowerCase()));

      for (const item of comparisonData) {
        if (!item.company) {
          errorCount++;
          continue;
        }

        const companyKey = item.company.toLowerCase();
        const existingItem = updatedZoneMap.get(companyKey);

        const payload = {
          company: item.company,
          todaysHigh: item.todaysHigh,
          todaysLow: item.todaysLow,
          closingPrice: item.closingPrice,
          low: item.low,
          high: item.high,
          pivotPoint: item.pivotPoint
        };

        try {
          if (existingItem && existingItem._id) {
            const res = await api.put(`/zone/${existingItem._id}`, payload);
            const savedRecord = res.data?.data || res.data || { ...payload, _id: existingItem._id };
            updatedZoneMap.set(companyKey, savedRecord);
            successCount++;
          } else {
            const res = await api.post("/zone", payload);
            const savedRecord = res.data?.data || res.data;
            updatedZoneMap.set(companyKey, savedRecord);
            newCompaniesList.add(companyKey);
            successCount++;
          }
        } catch (err) {
          console.error(`Error processing ${item.company}:`, err);
          errorCount++;
        }
      }

      const updatedZoneData = Array.from(updatedZoneMap.values());
      setZoneData(updatedZoneData);
      
      const updatedCompanies = Array.from(newCompaniesList).sort();
      setCompanies(updatedCompanies);
      
      if (successCount > 0) {
        showSuccessAlert(`✅ Successfully merged ${successCount} records! ${errorCount > 0 ? `${errorCount} records failed.` : ''}`);
        
        setExcelPreviewData(null);
        setComparisonData([]);
        setShowComparison(false);
        setExcelFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showErrorAlert("No valid records were saved. Please check your data format.");
      }
    } catch (err) {
      console.error("Batch merge error:", err);
      showErrorAlert(err.response?.data?.message || "An error occurred while merging records.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClearPreview = () => {
    setExcelPreviewData(null);
    setComparisonData([]);
    setShowComparison(false);
    setExcelFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.company.trim()) {
      showAlert("Please enter or select a company name");
      return;
    }

    try {
      setSubmitLoading(true);

      const h = formData.todaysHigh !== "" ? Number(formData.todaysHigh) : null;
      const l = formData.todaysLow !== "" ? Number(formData.todaysLow) : null;
      const c = formData.closingPrice !== "" ? Number(formData.closingPrice) : null;

      let computedPivot = null;
      if (h && l && c) {
        computedPivot = (h + l + c) / 3;
      }

      const uppercasedCompany = toUpperCaseName(formData.company.trim());

      const payload = {
        company: uppercasedCompany,
        todaysHigh: h,
        todaysLow: l,
        closingPrice: c,
        low: formData.low !== "" ? Number(formData.low) : null,
        high: formData.high !== "" ? Number(formData.high) : null,
        pivotPoint: computedPivot
      };

      let savedRecord;

      if (formData._id) {
        const res = await api.put(`/zone/${formData._id}`, payload);
        savedRecord = res.data?.data || res.data || { ...payload, _id: formData._id };
        showSuccessAlert("Price parameters updated successfully!");
        
        setZoneData((prev) =>
          prev.map((item) => (item._id === formData._id ? savedRecord : item))
        );
        
        setCompanies(prev => {
          const newList = [...prev];
          if (!newList.includes(uppercasedCompany)) {
            newList.push(uppercasedCompany);
          }
          return newList.sort();
        });
      } else {
        const existingCompany = zoneData.find(
          (item) => item.company.toLowerCase() === uppercasedCompany.toLowerCase()
        );
        
        if (existingCompany) {
          const res = await api.put(`/zone/${existingCompany._id}`, payload);
          savedRecord = res.data?.data || res.data || { ...payload, _id: existingCompany._id };
          showSuccessAlert("Matrix profile updated successfully!");
          
          setZoneData((prev) =>
            prev.map((item) => (item._id === existingCompany._id ? savedRecord : item))
          );
        } else {
          const res = await api.post("/zone", payload);
          savedRecord = res.data?.data || res.data;
          showSuccessAlert("Matrix profile generated successfully!");
          
          setZoneData((prev) => [savedRecord, ...prev]);
          
          if (!companies.map(c => c.toLowerCase()).includes(uppercasedCompany.toLowerCase())) {
            setCompanies((prev) => [...prev, uppercasedCompany].sort());
          }
        }
      }

      setShowReport(true); 
      handleReset();
    } catch (err) {
      console.error(err);
      showErrorAlert(err.response?.data?.message || "Failed to save record variables");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      company: "",
      todaysHigh: "",
      todaysLow: "",
      closingPrice: "",
      low: "",
      high: "",
      _id: undefined,
    });
    setIsNewCompany(false);
  };

  const handleEdit = (item) => {
    setIsNewCompany(false);
    setFormData({
      company: item.company,
      todaysHigh: item.todaysHigh ? String(item.todaysHigh) : "",
      todaysLow: item.todaysLow ? String(item.todaysLow) : "",
      closingPrice: item.closingPrice ? String(item.closingPrice) : "",
      low: item.low ? String(item.low) : "",
      high: item.high ? String(item.high) : "",
      _id: item._id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirm(
      `Remove entry profiles mapped to ${item.company}?`,
      "Delete Record Profile"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/zone/${item._id}`);
      setZoneData((prev) => prev.filter((z) => z._id !== item._id));
      setCompanies((prev) => prev.filter((c) => c !== item.company));
      showSuccessAlert("Record deleted safely.");
    } catch (err) {
      console.error(err);
      showErrorAlert("Failed to clear metrics profile out of backend cluster");
    }
  };

  const downloadExcelTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      const ws = workbook.addWorksheet('Price Update Template');
      
      ws.columns = [
        { header: 'Trading Code', key: 'trading_code', width: 18 },
        { header: '1Y Low', key: 'y1_low', width: 14 },
        { header: '1Y High', key: 'y1_high', width: 14 },
        { header: 'Session Low', key: 'session_low', width: 16 },
        { header: 'Session High', key: 'session_high', width: 16 },
        { header: 'Session Close', key: 'session_close', width: 16 }
      ];
      
      ws.addRow({
        trading_code: 'EXAMPLE',
        y1_low: 100.50,
        y1_high: 250.75,
        session_low: 120.30,
        session_high: 180.45,
        session_close: 150.60
      });
      
      ws.addRow({
        trading_code: 'SAMPLE',
        y1_low: 85.20,
        y1_high: 200.00,
        session_low: 90.50,
        session_high: 175.30,
        session_close: 145.80
      });
      
      const headerRow = ws.getRow(1);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E79' }
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 12,
          name: 'Calibri'
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 22;
          row.eachCell((cell, colNumber) => {
            cell.font = {
              name: 'Calibri',
              size: 11,
              color: { argb: 'FF333333' }
            };
            cell.alignment = {
              horizontal: colNumber === 1 ? 'left' : 'right',
              vertical: 'middle'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
            
            if (colNumber > 1) {
              cell.numFmt = '0.00';
            }
          });
        }
      });
      
      const wsInstructions = workbook.addWorksheet('Instructions');
      wsInstructions.columns = [
        { header: '', key: 'content', width: 80 }
      ];
      
      const instructions = [
        { content: 'Instructions for Price Update Excel Template' },
        { content: '' },
        { content: 'Column Descriptions:' },
        { content: 'Trading Code: Company trading symbol or name (Required)' },
        { content: '1Y Low: 52-week or 1-year lowest price' },
        { content: '1Y High: 52-week or 1-year highest price' },
        { content: 'Session Low: Today\'s or current session lowest price' },
        { content: 'Session High: Today\'s or current session highest price' },
        { content: 'Session Close: Today\'s or current session closing/last price' },
        { content: '' },
        { content: 'Tips:' },
        { content: 'You can add as many rows as needed' },
        { content: 'Remove the sample rows before uploading your data' },
        { content: 'All price values should be numeric (decimals allowed)' }
      ];
      
      instructions.forEach(item => {
        wsInstructions.addRow(item);
      });
      
      const titleRow = wsInstructions.getRow(1);
      titleRow.getCell(1).font = {
        bold: true,
        size: 16,
        color: { argb: 'FF1F4E79' },
        name: 'Calibri'
      };
      
      [3, 11].forEach(rowNum => {
        const row = wsInstructions.getRow(rowNum);
        row.getCell(1).font = {
          bold: true,
          size: 13,
          color: { argb: 'FF2E75B6' },
          name: 'Calibri'
        };
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'price_update_template.xlsx');
      
      showSuccessAlert('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      showErrorAlert('Failed to download template');
    }
  };

  const exportReportToExcel = async () => {
    if (sortedZoneData.length === 0) {
      showAlert("No data available to export. Please add some records first.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      
      const ws = workbook.addWorksheet('Price Analysis Report');
      
      ws.columns = [
        { header: 'Company Name', key: 'company', width: 20 },
        { header: '1Y Low', key: 'low', width: 14 },
        { header: '1Y High', key: 'high', width: 14 },
        { header: 'Session High', key: 'session_high', width: 16 },
        { header: 'Session Low', key: 'session_low', width: 16 },
        { header: 'Session Close', key: 'session_close', width: 16 },
        { header: 'Pivot Point', key: 'pivot', width: 16 },
        { header: 'Sentiment', key: 'sentiment', width: 14 }
      ];
      
      sortedZoneData.forEach((item) => {
        let sentiment = "NEUTRAL";
        if (item.closingPrice && item.pivotPoint) {
          if (item.closingPrice > item.pivotPoint) {
            sentiment = "BULLISH";
          } else if (item.closingPrice < item.pivotPoint) {
            sentiment = "BEARISH";
          }
        }
        
        const cleanCompanyName = toUpperCaseName(item.company || "-");
        
        ws.addRow({
          company: cleanCompanyName,
          low: item.low ? Number(Number(item.low).toFixed(2)) : null,
          high: item.high ? Number(Number(item.high).toFixed(2)) : null,
          session_high: item.todaysHigh ? Number(Number(item.todaysHigh).toFixed(2)) : null,
          session_low: item.todaysLow ? Number(Number(item.todaysLow).toFixed(2)) : null,
          session_close: item.closingPrice ? Number(Number(item.closingPrice).toFixed(2)) : null,
          pivot: item.pivotPoint ? Number(Number(item.pivotPoint).toFixed(2)) : null,
          sentiment: sentiment
        });
      });
      
      const headerRow = ws.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E79' }
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 12,
          name: 'Calibri'
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 24;
          
          const sentiment = row.getCell(8).value;
          
          row.eachCell((cell, colNumber) => {
            if (typeof cell.value === 'string') {
              cell.value = cell.value.toUpperCase();
            }
            
            cell.font = {
              name: 'Calibri',
              size: 11,
              color: { argb: 'FF333333' }
            };
            cell.alignment = {
              horizontal: colNumber === 1 ? 'left' : 'right',
              vertical: 'middle'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
            
            if (colNumber >= 2 && colNumber <= 7) {
              cell.numFmt = '0.00';
            }
            
            if (sentiment === 'BULLISH') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0FFF0' }
              };
            } else if (sentiment === 'BEARISH') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF0F0' }
              };
            }
            
            if (colNumber === 8) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.font = { ...cell.font, bold: true, size: 11 };
              
              if (sentiment === 'BULLISH') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFC6EFCE' }
                };
                cell.font.color = { argb: 'FF006100' };
              } else if (sentiment === 'BEARISH') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFC7CE' }
                };
                cell.font.color = { argb: 'FF9C0006' };
              } else if (sentiment === 'NEUTRAL') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFEB9C' }
                };
                cell.font.color = { argb: 'FF9C6500' };
              }
            }
          });
        }
      });
      
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `price_analysis_report_${dateStr}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
      
      showSuccessAlert(`Report exported successfully!`);
    } catch (error) {
      console.error('Error exporting report:', error);
      showErrorAlert('Failed to export report');
    }
  };

  const getSentiment = (item) => {
    if (!item.closingPrice || !item.pivotPoint) return { text: "NEUTRAL", style: "bg-gray-800/60 text-gray-400" };
    
    if (item.closingPrice > item.pivotPoint) {
      return { text: "BULLISH", style: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" };
    } else if (item.closingPrice < item.pivotPoint) {
      return { text: "BEARISH", style: "bg-rose-950/60 text-rose-400 border border-rose-800/50" };
    }
    
    return { text: "NEUTRAL", style: "bg-gray-800/60 text-gray-400" };
  };

  const isValueChanged = (companyName, field, newValue) => {
    const comparison = comparisonData.find(c => c.company === companyName);
    if (!comparison || !comparison.existing) return false;
    
    const existingValue = comparison.existing[field];
    return Number(newValue) !== Number(existingValue);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-6">
      <div className="w-full max-w-7xl mx-auto">
        
        <div className="flex flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
              🔄 Update Actual Price
            </h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm hidden sm:block">
              Update share price information for selected companies.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all cursor-pointer"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                📥 Batch Excel Import
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Import multiple records at once via Excel file upload
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadExcelTemplate}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <span>📥</span> Download Excel Template
              </button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                📁 Upload Excel File (.xlsx, .xls)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={submitLoading || loading}
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {excelFileName && (
                  <span className="text-xs text-emerald-400 font-mono">
                    ✅ {excelFileName}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500">
                  💡 Supported columns: Trading Code, Symbol, Company Name, Session High/Low/Close, 1Y Low/High
                </p>
              </div>
            </div>
          </div>

          {comparisonData && comparisonData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="bg-blue-950/30 rounded-lg p-4 border border-blue-800/50 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-sm font-semibold text-blue-400">
                      📊 Data Comparison Summary
                    </span>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-yellow-400">🟡 {comparisonData.filter(d => d.hasMismatch && !d.isNew).length} Records with Changes</span>
                      <span className="text-green-400">🟢 {comparisonData.filter(d => d.isNew).length} New Records</span>
                      <span className="text-gray-400">⚪ {comparisonData.filter(d => !d.hasMismatch && !d.isNew).length} Unchanged</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMergeAndSave}
                      disabled={submitLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Merging...
                        </>
                      ) : (
                        <>
                          🔄 Merge & Update All
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleClearPreview}
                      disabled={submitLoading}
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 p-4 sm:p-6 rounded-xl space-y-4 shadow-xl mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs sm:text-sm font-semibold tracking-wide text-gray-300">
                Company Name *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsNewCompany(!isNewCompany);
                  setFormData((prev) => ({ ...prev, company: "", _id: undefined }));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-all cursor-pointer"
              >
                {isNewCompany ? "📋 Choose Existing Company" : "➕ Add New Company"}
              </button>
            </div>

            {isNewCompany ? (
              <input
                type="text"
                name="company"
                placeholder="Enter New company name..."
                value={formData.company}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none uppercase"
              />
            ) : (
              <select
                name="company"
                value={formData.company}
                onChange={handleCompanySelect}
                disabled={loading}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none cursor-pointer uppercase"
              >
                <option value="">-- Select Company --</option>
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Session High</label>
              <input
                type="number"
                name="todaysHigh"
                placeholder="0.00"
                value={formData.todaysHigh}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Session Low</label>
              <input
                type="number"
                name="todaysLow"
                placeholder="0.00"
                value={formData.todaysLow}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Session Close</label>
              <input
                type="number"
                name="closingPrice"
                placeholder="0.00"
                value={formData.closingPrice}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">1Y Low Price</label>
              <input
                type="number"
                name="low"
                placeholder="0.00"
                value={formData.low}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">1Y High Price</label>
              <input
                type="number"
                name="high"
                placeholder="0.00"
                value={formData.high}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitLoading || loading}
              className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all cursor-pointer"
            >
              {submitLoading ? "Processing Variables..." : formData._id ? "Update Data" : "Submit Data"}
            </button>
            <button
              onClick={() => setShowReport(true)}
              disabled={submitLoading || loading}
              className="flex-1 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700 text-purple-300 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all cursor-pointer"
            >
              View Summary Report
            </button>
            <button
              onClick={() => { setShowReport(false); handleReset(); }}
              disabled={submitLoading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {showReport && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-200">
                  Execution Strategy Matrix
                </h2>
                {showComparison && comparisonData.length > 0 && (
                  <span className="text-xs text-amber-400 ml-2">
                    🟡 Highlighted cells indicate changes from existing data
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportReportToExcel}
                  disabled={sortedZoneData.length === 0}
                  className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <span>📊</span> Export Report to Excel
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                    <th className="p-3 font-semibold min-w-140px">Company Name</th>
                    <th className="p-3 font-semibold text-right text-gray-300">1Y Low</th>
                    <th className="p-3 font-semibold text-right text-gray-300">1Y High</th>
                    <th className="p-3 font-semibold text-right text-blue-400">Session High</th>
                    <th className="p-3 font-semibold text-right text-blue-400">Session Low</th>
                    <th className="p-3 font-semibold text-right text-blue-300">Session Close</th>
                    <th className="p-3 font-semibold text-right text-purple-400">Pivot Point</th>
                    <th className="p-3 font-semibold text-center text-amber-400">Forecast Matrix</th>
                    <th className="p-3 font-semibold text-center min-w-130px">Action Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-xs">
                  {showComparison && comparisonData.length > 0 ? (
                    comparisonData.map((item, index) => {
                      const sentiment = getSentiment(item);
                      const hasChanges = item.hasMismatch;
                      const isNewRecord = item.isNew;
                      
                      const getCellClass = (field, value) => {
                        if (isNewRecord) return "bg-yellow-950/30";
                        if (hasChanges && isValueChanged(item.company, field, value)) {
                          return "bg-amber-950/50 text-amber-300 font-bold ring-1 ring-amber-500/50";
                        }
                        return "";
                      };
                      
                      return (
                        <tr key={`compare-${index}`} className={`hover:bg-gray-850/40 transition-colors ${hasChanges ? 'bg-yellow-950/10' : ''}`}>
                          <td className="p-3 font-bold text-gray-100 whitespace-nowrap">
                            {isNewRecord && <span className="mr-2 text-green-500 text-xs">🆕</span>}
                            {hasChanges && !isNewRecord && <span className="mr-2 text-amber-500 text-xs">✏️</span>}
                            {item.company}
                          </td>
                          <td className={`p-3 text-right font-mono ${getCellClass('low', item.low)}`}>
                            {item.low ? Number(item.low).toFixed(2) : "-"}
                           </td>
                          <td className={`p-3 text-right font-mono ${getCellClass('high', item.high)}`}>
                            {item.high ? Number(item.high).toFixed(2) : "-"}
                           </td>
                          <td className={`p-3 text-right font-mono ${getCellClass('todaysHigh', item.todaysHigh)}`}>
                            {item.todaysHigh ? Number(item.todaysHigh).toFixed(2) : "-"}
                           </td>
                          <td className={`p-3 text-right font-mono ${getCellClass('todaysLow', item.todaysLow)}`}>
                            {item.todaysLow ? Number(item.todaysLow).toFixed(2) : "-"}
                           </td>
                          <td className={`p-3 text-right font-mono ${getCellClass('closingPrice', item.closingPrice)}`}>
                            {item.closingPrice ? Number(item.closingPrice).toFixed(2) : "-"}
                           </td>
                          <td className="p-3 text-right font-mono text-purple-400 font-bold bg-purple-950/10">
                            {item.pivotPoint ? Number(item.pivotPoint).toFixed(2) : "-"}
                           </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${sentiment.style}`}>
                              {sentiment.text}
                            </span>
                           </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {!isNewRecord && item.existing && (
                              <button
                                onClick={() => {
                                  if (item.existing) handleEdit(item.existing);
                                }}
                                className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-700/50 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                              >
                                View Existing
                              </button>
                            )}
                            {isNewRecord && (
                              <span className="text-xs text-green-500">New Record</span>
                            )}
                           </td>
                        </tr>
                      );
                    })
                  ) : (
                    sortedZoneData.map((item, index) => {
                      let sentiment = "NEUTRAL";
                      let sentimentStyle = "bg-gray-800/60 text-gray-400";
                      if (item.closingPrice && item.pivotPoint) {
                        if (item.closingPrice > item.pivotPoint) {
                          sentiment = "BULLISH";
                          sentimentStyle = "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50";
                        } else if (item.closingPrice < item.pivotPoint) {
                          sentiment = "BEARISH";
                          sentimentStyle = "bg-rose-950/60 text-rose-400 border border-rose-800/50";
                        }
                      }

                      return (
                        <tr key={item._id || index} className="hover:bg-gray-850/40 transition-colors">
                          <td className="p-3 font-bold text-gray-100 whitespace-nowrap">{item.company}</td>
                          <td className="p-3 text-right font-mono text-gray-400">
                            {item.low ? Number(item.low).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-400">
                            {item.high ? Number(item.high).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-blue-400/90">
                            {item.todaysHigh ? Number(item.todaysHigh).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-blue-400/90">
                            {item.todaysLow ? Number(item.todaysLow).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-200">
                            {item.closingPrice ? Number(item.closingPrice).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-purple-400 font-bold bg-purple-950/10">
                            {item.pivotPoint ? Number(item.pivotPoint).toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${sentimentStyle}`}>
                              {sentiment}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleEdit(item)}
                                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-700/50 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-700/50 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {sortedZoneData.length === 0 && comparisonData.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-medium">
                  No active forecast assets found. Upload an Excel file or add records manually.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatePrice;