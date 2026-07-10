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
  const [showReport, setShowReport] = useState(true);
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
    todayVolume: "",
    avgVolume1M: "",
    ma20: "",
    rsi14: "",
  });

  // Helper function to convert company names to uppercase
  const toUpperCaseName = (name) => {
    if (!name) return name;
    return name.toUpperCase().trim();
  };

  // Helper function to round avg volume
  const roundAvgVolume = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    return Math.round(value);
  };

  const parseFloatOrNull = (value) => {
    if (value === null || value === undefined || String(value).trim() === "") {
      return null;
    }
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatToTwoDecimals = (value) => {
    const parsed = parseFloatOrNull(value);
    if (parsed === null) return null;
    return Number(parsed.toFixed(2));
  };

  // Safe number comparison with tolerance for floating-point precision
  const safeNumberCompare = (val1, val2) => {
    // If both are null/undefined/empty, they're equal
    if ((val1 === null || val1 === undefined || val1 === '') && 
        (val2 === null || val2 === undefined || val2 === '')) {
      return true;
    }
    
    // Parse both to numbers
    const num1 = parseFloatOrNull(val1);
    const num2 = parseFloatOrNull(val2);
    
    // If either is null after parsing, they're only equal if both are null
    if (num1 === null || num2 === null) {
      return num1 === num2;
    }
    
    // Compare with tolerance for floating-point precision
    // Use 0.005 tolerance for price values
    const tolerance = 0.005;
    return Math.abs(num1 - num2) < tolerance;
  };

  // Calculate pivot and support/resistance levels
  const calculateIndicators = (data) => {
    const h = parseFloatOrNull(data.todaysHigh);
    const l = parseFloatOrNull(data.todaysLow);
    const c = parseFloatOrNull(data.closingPrice);
    const volume = parseFloatOrNull(data.todayVolume);
    const avgVolume = parseFloatOrNull(data.avgVolume1M);
    const ma20 = parseFloatOrNull(data.ma20);
    const rsi14 = parseFloatOrNull(data.rsi14);

    let pivot = null;
    let r1 = null;
    let s1 = null;
    let volRatio = null;
    let pivotSignal = "Neutral";
    let customSignal = "Neutral";

    // Calculate Pivot - requires all three values
    if (h !== null && l !== null && c !== null) {
      pivot = parseFloat(((h + l + c) / 3).toFixed(2));

      // Calculate R1 and S1
      r1 = parseFloat((2 * pivot - l).toFixed(2));
      s1 = parseFloat((2 * pivot - h).toFixed(2));

      // Calculate Pivot Signal (Close vs Pivot)
      if (c > pivot) {
        pivotSignal = "Bullish";
      } else if (c < pivot) {
        pivotSignal = "Bearish";
      } else {
        pivotSignal = "Neutral";
      }
    }

    // Calculate Volume Ratio
    if (volume !== null && avgVolume !== null && avgVolume > 0) {
      volRatio = parseFloat((volume / avgVolume).toFixed(2));
    }

    // Enhanced Custom Signal Logic with MA20 and RSI14
    if (
      c !== null &&
      pivot !== null &&
      r1 !== null &&
      s1 !== null &&
      volRatio !== null &&
      ma20 !== null &&
      rsi14 !== null
    ) {
      const priceDiffPercent = Math.abs((c - pivot) / pivot);
      const isNearPivot = priceDiffPercent <= 0.005;

      // Check for Overbought (Strong Trend) - RSI >= 70, Vol >= 1.5, Close > MA20, Close > Pivot
      if (rsi14 >= 70 && volRatio >= 1.5 && c > ma20 && c > pivot) {
        customSignal = "Overbought (ST)";
      }
      // Check for Overbought (High Risk) - RSI >= 70 (general)
      else if (rsi14 >= 70) {
        customSignal = "Overbought (HR)";
      }
      // Check for Oversold (Watch Bounce) - RSI <= 30
      else if (rsi14 <= 30) {
        customSignal = "Oversold (WB)";
      }
      // Very Strong Buyer: Close > R1, Vol >= 2, Close > MA20, RSI 55-70
      else if (c > r1 && volRatio >= 2 && c > ma20 && rsi14 >= 55 && rsi14 < 70) {
        customSignal = "Very Strong Buyer";
      }
      // Strong Buyer (Near Pivot): Close > Pivot, Vol >= 1.5, Close > MA20, RSI 50-70, Near Pivot
      else if (c > pivot && volRatio >= 1.5 && c > ma20 && rsi14 >= 50 && rsi14 < 70 && isNearPivot) {
        customSignal = "Strong Buyer (NP)";
      }
      // Strong Buyer: Close > Pivot, Vol >= 1.5, Close > MA20, RSI 50-70
      else if (c > pivot && volRatio >= 1.5 && c > ma20 && rsi14 >= 50 && rsi14 < 70) {
        customSignal = "Strong Buyer";
      }
      // Weak Buyer: Close > Pivot, Vol >= 0.8, Close > MA20, RSI < 70
      else if (c > pivot && volRatio >= 0.8 && c > ma20 && rsi14 < 70) {
        customSignal = "Weak Buyer";
      }
      // Very Strong Seller: Close < S1, Vol >= 2, Close < MA20, RSI <= 45
      else if (c < s1 && volRatio >= 2 && c < ma20 && rsi14 <= 45) {
        customSignal = "Very Strong Seller";
      }
      // Strong Seller: Close < Pivot, Vol >= 1.5, Close < MA20, RSI <= 50
      else if (c < pivot && volRatio >= 1.5 && c < ma20 && rsi14 <= 50) {
        customSignal = "Strong Seller";
      }
      // Weak Seller: Close < Pivot
      else if (c < pivot) {
        customSignal = "Weak Seller";
      }
      // Default
      else {
        customSignal = "Neutral";
      }
    } else {
      // Fallback: If we don't have all required values, use simpler logic
      if (
        c !== null &&
        pivot !== null &&
        r1 !== null &&
        s1 !== null &&
        volRatio !== null
      ) {
        const priceDiffPercent = Math.abs((c - pivot) / pivot);
        const isNearPivot = priceDiffPercent <= 0.005;

        if (isNearPivot) {
          customSignal = "Neutral";
        } else if (c > r1 && volRatio >= 2) {
          customSignal = "Very Strong Buyer";
        } else if (c > pivot && volRatio >= 1.5) {
          customSignal = "Strong Buyer";
        } else if (c > pivot) {
          customSignal = "Weak Buyer";
        } else if (c < s1 && volRatio >= 2) {
          customSignal = "Very Strong Seller";
        } else if (c < pivot && volRatio >= 1.5) {
          customSignal = "Strong Seller";
        } else if (c < pivot) {
          customSignal = "Weak Seller";
        } else {
          customSignal = "Neutral";
        }
      }
    }

    return {
      pivot,
      r1,
      s1,
      volRatio,
      pivotSignal,
      customSignal,
    };
  };

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/zone");
        const zoneList = res.data || [];

        const uppercasedZoneList = zoneList.map((item) => {
          const dataWithIndicators = {
            ...item,
            company: toUpperCaseName(item.company),
            todaysHigh: item.todaysHigh || null,
            todaysLow: item.todaysLow || null,
            closingPrice: item.closingPrice || null,
            low: item.low || null,
            high: item.high || null,
            todayVolume: item.todayVolume || null,
            avgVolume1M: roundAvgVolume(item.avgVolume1M),
            ma20: item.ma20 !== undefined ? item.ma20 : null,
            rsi14: item.rsi14 !== undefined ? item.rsi14 : null,
          };
          return {
            ...dataWithIndicators,
            ...calculateIndicators(dataWithIndicators),
          };
        });

        setZoneData(uppercasedZoneList);

        const uniqueCompanies = [
          ...new Set(uppercasedZoneList.map((item) => item.company)),
        ].sort();
        setCompanies(uniqueCompanies);

        setShowReport(true);
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
        todaysHigh:
          existingCompany.todaysHigh !== null &&
          existingCompany.todaysHigh !== undefined
            ? String(existingCompany.todaysHigh)
            : "",
        todaysLow:
          existingCompany.todaysLow !== null &&
          existingCompany.todaysLow !== undefined
            ? String(existingCompany.todaysLow)
            : "",
        closingPrice:
          existingCompany.closingPrice !== null &&
          existingCompany.closingPrice !== undefined
            ? String(existingCompany.closingPrice)
            : "",
        low:
          existingCompany.low !== null && existingCompany.low !== undefined
            ? String(existingCompany.low)
            : "",
        high:
          existingCompany.high !== null && existingCompany.high !== undefined
            ? String(existingCompany.high)
            : "",
        todayVolume:
          existingCompany.todayVolume !== null &&
          existingCompany.todayVolume !== undefined
            ? String(existingCompany.todayVolume)
            : "",
        avgVolume1M:
          existingCompany.avgVolume1M !== null &&
          existingCompany.avgVolume1M !== undefined
            ? String(existingCompany.avgVolume1M)
            : "",
        ma20:
          existingCompany.ma20 !== null && existingCompany.ma20 !== undefined
            ? String(formatToTwoDecimals(existingCompany.ma20))
            : "",
        rsi14:
          existingCompany.rsi14 !== null && existingCompany.rsi14 !== undefined
            ? String(formatToTwoDecimals(existingCompany.rsi14))
            : "",
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
          showSuccessAlert(
            `Successfully loaded ${processedData.length} records from ${file.name}`,
          );
        }
      } catch (err) {
        console.error("Excel parsing error:", err);
        showErrorAlert(
          "Error parsing Excel file. Please check the file format.",
        );
        setExcelPreviewData(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const compareWithExistingData = (uploadedData) => {
    return uploadedData.map((uploaded) => {
      const uppercasedCompany = toUpperCaseName(uploaded.company);
      const existing = zoneData.find(
        (existing) =>
          existing.company?.toLowerCase() === uppercasedCompany?.toLowerCase(),
      );

      // Calculate indicators for uploaded data
      const indicators = calculateIndicators(uploaded);

      if (!existing) {
        return {
          ...uploaded,
          ...indicators,
          company: uppercasedCompany,
          existing: null,
          isNew: true,
          hasMismatch: true,
          mismatches: [],
        };
      }

      const mismatches = [];

      // Use safe comparison for each field
      if (!safeNumberCompare(uploaded.low, existing.low)) {
        mismatches.push({
          field: "1Y Low",
          old: existing.low,
          new: uploaded.low,
        });
      }
      if (!safeNumberCompare(uploaded.ma20, existing.ma20)) {
        mismatches.push({
          field: "MA20",
          old: existing.ma20,
          new: uploaded.ma20,
        });
      }
      if (!safeNumberCompare(uploaded.rsi14, existing.rsi14)) {
        mismatches.push({
          field: "RSI14",
          old: existing.rsi14,
          new: uploaded.rsi14,
        });
      }
      if (!safeNumberCompare(uploaded.high, existing.high)) {
        mismatches.push({
          field: "1Y High",
          old: existing.high,
          new: uploaded.high,
        });
      }
      if (!safeNumberCompare(uploaded.todaysHigh, existing.todaysHigh)) {
        mismatches.push({
          field: "Session High",
          old: existing.todaysHigh,
          new: uploaded.todaysHigh,
        });
      }
      if (!safeNumberCompare(uploaded.todaysLow, existing.todaysLow)) {
        mismatches.push({
          field: "Session Low",
          old: existing.todaysLow,
          new: uploaded.todaysLow,
        });
      }
      if (!safeNumberCompare(uploaded.closingPrice, existing.closingPrice)) {
        mismatches.push({
          field: "Session Close",
          old: existing.closingPrice,
          new: uploaded.closingPrice,
        });
      }
      if (!safeNumberCompare(uploaded.todayVolume, existing.todayVolume)) {
        mismatches.push({
          field: "Today Volume",
          old: existing.todayVolume,
          new: uploaded.todayVolume,
        });
      }
      if (!safeNumberCompare(uploaded.avgVolume1M, existing.avgVolume1M)) {
        mismatches.push({
          field: "Avg Volume (1M)",
          old: existing.avgVolume1M,
          new: uploaded.avgVolume1M,
        });
      }

      return {
        ...uploaded,
        ...indicators,
        company: uppercasedCompany,
        existing: existing,
        isNew: false,
        hasMismatch: mismatches.length > 0,
        mismatches: mismatches,
      };
    });
  };

  const processExcelData = (rawData) => {
    const parseNum = (val) => {
      if (val === undefined || val === null || String(val).trim() === "")
        return null;
      // Handle strings with commas (e.g., "11,400,211")
      let cleanedVal = String(val).replace(/,/g, "");
      const num = Number(cleanedVal);
      return isNaN(num) ? null : num;
    };

    return rawData
      .map((item) => {
        let compName = String(
          item["Trading Code"] ||
            item["Symbol"] ||
            item["Scrip"] ||
            item["Company Name"] ||
            item["Company"] ||
            item["CompanyName"] ||
            "",
        ).trim();

        compName = toUpperCaseName(compName);

        const rawHigh =
          item["Session High"] !== undefined
            ? item["Session High"]
            : item["SessionHigh"] !== undefined
              ? item["SessionHigh"]
              : item["High"] !== undefined
                ? item["High"]
                : item["TodaysHigh"] !== undefined
                  ? item["TodaysHigh"]
                  : null;

        const rawLow =
          item["Session Low"] !== undefined
            ? item["Session Low"]
            : item["SessionLow"] !== undefined
              ? item["SessionLow"]
              : item["Low"] !== undefined
                ? item["Low"]
                : item["TodaysLow"] !== undefined
                  ? item["TodaysLow"]
                  : null;

        const rawClose =
          item["Session Close"] !== undefined
            ? item["Session Close"]
            : item["SessionClose"] !== undefined
              ? item["SessionClose"]
              : item["LTP"] !== undefined
                ? item["LTP"]
                : item["Close"] !== undefined
                  ? item["Close"]
                  : item["ClosingPrice"] !== undefined
                    ? item["ClosingPrice"]
                    : null;

        const oneYLow =
          item["1Y Low"] !== undefined
            ? item["1Y Low"]
            : item["1YLow"] !== undefined
              ? item["1YLow"]
              : item["YearLow"] !== undefined
                ? item["YearLow"]
                : item["Low Price"] !== undefined
                  ? item["Low Price"]
                  : null;

        const oneYHigh =
          item["1Y High"] !== undefined
            ? item["1Y High"]
            : item["1YHigh"] !== undefined
              ? item["1YHigh"]
              : item["YearHigh"] !== undefined
                ? item["YearHigh"]
                : item["High Price"] !== undefined
                  ? item["High Price"]
                  : null;

        const todayVol =
          item["Today Volume"] !== undefined
            ? item["Today Volume"]
            : item["TodayVolume"] !== undefined
              ? item["TodayVolume"]
              : item["Volume"] !== undefined
                ? item["Volume"]
                : null;

        const avgVol =
          item["Avg Volume (1M)"] !== undefined
            ? item["Avg Volume (1M)"]
            : item["AvgVolume1M"] !== undefined
              ? item["AvgVolume1M"]
              : item["Avg Volume"] !== undefined
                ? item["Avg Volume"]
                : null;

        const h = parseNum(rawHigh);
        const l = parseNum(rawLow);
        const c = parseNum(rawClose);
        const yearLow = parseNum(oneYLow);
        const yearHigh = parseNum(oneYHigh);
        const volume = parseNum(todayVol);
        const avgVolume = roundAvgVolume(parseNum(avgVol));

        const rawMa20 = item["MA20"] ?? item["MA 20"] ?? item["MA_20"] ?? null;
        const rawRsi14 =
          item["RSI14"] ?? item["RSI 14"] ?? item["RSI_14"] ?? null;

        const data = {
          company: compName,
          todaysHigh: h,
          todaysLow: l,
          closingPrice: c,
          low: yearLow,
          high: yearHigh,
          todayVolume: volume,
          avgVolume1M: avgVolume,
          ma20:
            rawMa20 !== null ? formatToTwoDecimals(parseNum(rawMa20)) : null,
          rsi14:
            rawRsi14 !== null ? formatToTwoDecimals(parseNum(rawRsi14)) : null,
          _processed: true,
        };

        // Calculate all indicators
        const indicators = calculateIndicators(data);

        return {
          ...data,
          ...indicators,
        };
      })
      .filter((item) => item.company);
  };

  const handleMergeAndSave = async () => {
    if (!comparisonData || comparisonData.length === 0) {
      showAlert("No data to merge. Please upload an Excel file first.");
      return;
    }

    const mismatchCount = comparisonData.filter(
      (d) => d.hasMismatch && !d.isNew,
    ).length;
    const newCount = comparisonData.filter((d) => d.isNew).length;
    const totalChanges = mismatchCount + newCount;

    if (totalChanges === 0) {
      showAlert(
        "No changes detected. All uploaded data matches existing records.",
      );
      return;
    }

    const confirmed = await showConfirm(
      `📊 Merge Summary:\n\n` +
        `• Records with changes: ${mismatchCount}\n` +
        `• New records to add: ${newCount}\n` +
        `• Total updates: ${totalChanges}\n\n` +
        `Do you want to proceed with merging these updates?`,
      "Confirm Merge & Update",
    );

    if (!confirmed) return;

    try {
      setSubmitLoading(true);
      const updatedZoneMap = new Map();

      zoneData.forEach((item) => {
        updatedZoneMap.set(item.company.toLowerCase(), { ...item });
      });

      let successCount = 0;
      let errorCount = 0;
      let newCompaniesList = new Set(companies.map((c) => c.toLowerCase()));

      for (const item of comparisonData) {
        if (!item.company) {
          errorCount++;
          continue;
        }

        const companyKey = item.company.toLowerCase();
        const existingItem = updatedZoneMap.get(companyKey);

        // FIX: Round avg volume before saving
        const roundedAvgVolume = roundAvgVolume(item.avgVolume1M);

        // Calculate indicators for the payload
        const payloadData = {
          ...item,
          avgVolume1M: roundedAvgVolume,
        };
        const indicators = calculateIndicators(payloadData);

        const payload = {
          company: item.company,
          todaysHigh: item.todaysHigh,
          todaysLow: item.todaysLow,
          closingPrice: item.closingPrice,
          low: item.low,
          high: item.high,
          todayVolume: item.todayVolume,
          avgVolume1M: roundedAvgVolume,
          ma20:
            item.ma20 !== null && item.ma20 !== undefined
              ? formatToTwoDecimals(item.ma20)
              : null,
          rsi14:
            item.rsi14 !== null && item.rsi14 !== undefined
              ? formatToTwoDecimals(item.rsi14)
              : null,
          pivotPoint: indicators.pivot,
          r1: indicators.r1,
          s1: indicators.s1,
          volRatio: indicators.volRatio,
          originalSignal: indicators.pivotSignal,
          customSignal: indicators.customSignal,
        };

        try {
          if (existingItem && existingItem._id) {
            const res = await api.put(`/zone/${existingItem._id}`, payload);
            const savedRecord = res.data?.data ||
              res.data || { ...payload, _id: existingItem._id };
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
        showSuccessAlert(
          `✅ Successfully merged ${successCount} records! ${errorCount > 0 ? `${errorCount} records failed.` : ""}`,
        );

        setExcelPreviewData(null);
        setComparisonData([]);
        setShowComparison(false);
        setExcelFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showErrorAlert(
          "No valid records were saved. Please check your data format.",
        );
      }
    } catch (err) {
      console.error("Batch merge error:", err);
      showErrorAlert(
        err.response?.data?.message ||
          "An error occurred while merging records.",
      );
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
      const c =
        formData.closingPrice !== "" ? Number(formData.closingPrice) : null;
      const volume =
        formData.todayVolume !== "" ? Number(formData.todayVolume) : null;
      const avgVolume =
        formData.avgVolume1M !== ""
          ? roundAvgVolume(Number(formData.avgVolume1M))
          : null;

      const data = {
        todaysHigh: h,
        todaysLow: l,
        closingPrice: c,
        low: formData.low !== "" ? Number(formData.low) : null,
        high: formData.high !== "" ? Number(formData.high) : null,
        todayVolume: volume,
        avgVolume1M: avgVolume,
        ma20: formData.ma20 !== "" ? Number(formData.ma20) : null,
        rsi14: formData.rsi14 !== "" ? Number(formData.rsi14) : null,
      };

      const indicators = calculateIndicators(data);

      const uppercasedCompany = toUpperCaseName(formData.company.trim());

      const payload = {
        company: uppercasedCompany,
        ...data,
        ma20:
          formData.ma20 !== ""
            ? formatToTwoDecimals(Number(formData.ma20))
            : null,
        rsi14:
          formData.rsi14 !== ""
            ? formatToTwoDecimals(Number(formData.rsi14))
            : null,
        pivotPoint: indicators.pivot,
        r1: indicators.r1,
        s1: indicators.s1,
        volRatio: indicators.volRatio,
        originalSignal: indicators.pivotSignal,
        customSignal: indicators.customSignal,
      };

      let savedRecord;

      if (formData._id) {
        const res = await api.put(`/zone/${formData._id}`, payload);
        savedRecord = res.data?.data ||
          res.data || { ...payload, _id: formData._id };
        showSuccessAlert("Price parameters updated successfully!");

        setZoneData((prev) =>
          prev.map((item) => (item._id === formData._id ? savedRecord : item)),
        );

        setCompanies((prev) => {
          const newList = [...prev];
          if (!newList.includes(uppercasedCompany)) {
            newList.push(uppercasedCompany);
          }
          return newList.sort();
        });
      } else {
        const existingCompany = zoneData.find(
          (item) =>
            item.company.toLowerCase() === uppercasedCompany.toLowerCase(),
        );

        if (existingCompany) {
          const res = await api.put(`/zone/${existingCompany._id}`, payload);
          savedRecord = res.data?.data ||
            res.data || { ...payload, _id: existingCompany._id };
          showSuccessAlert("Matrix profile updated successfully!");

          setZoneData((prev) =>
            prev.map((item) =>
              item._id === existingCompany._id ? savedRecord : item,
            ),
          );
        } else {
          const res = await api.post("/zone", payload);
          savedRecord = res.data?.data || res.data;
          showSuccessAlert("Matrix profile generated successfully!");

          setZoneData((prev) => [savedRecord, ...prev]);

          if (
            !companies
              .map((c) => c.toLowerCase())
              .includes(uppercasedCompany.toLowerCase())
          ) {
            setCompanies((prev) => [...prev, uppercasedCompany].sort());
          }
        }
      }

      setShowReport(true);
      handleReset();
    } catch (err) {
      console.error(err);
      showErrorAlert(
        err.response?.data?.message || "Failed to save record variables",
      );
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
      todayVolume: "",
      avgVolume1M: "",
      ma20: "",
      rsi14: "",
      _id: undefined,
    });
    setIsNewCompany(false);
  };

  const handleEdit = (item) => {
    setIsNewCompany(false);
    setFormData({
      company: item.company,
      todaysHigh:
        item.todaysHigh !== null && item.todaysHigh !== undefined
          ? String(item.todaysHigh)
          : "",
      todaysLow:
        item.todaysLow !== null && item.todaysLow !== undefined
          ? String(item.todaysLow)
          : "",
      closingPrice:
        item.closingPrice !== null && item.closingPrice !== undefined
          ? String(item.closingPrice)
          : "",
      low: item.low !== null && item.low !== undefined ? String(item.low) : "",
      high:
        item.high !== null && item.high !== undefined ? String(item.high) : "",
      todayVolume:
        item.todayVolume !== null && item.todayVolume !== undefined
          ? String(item.todayVolume)
          : "",
      avgVolume1M:
        item.avgVolume1M !== null && item.avgVolume1M !== undefined
          ? String(item.avgVolume1M)
          : "",
      ma20:
        item.ma20 !== null && item.ma20 !== undefined
          ? String(formatToTwoDecimals(item.ma20))
          : "",
      rsi14:
        item.rsi14 !== null && item.rsi14 !== undefined
          ? String(formatToTwoDecimals(item.rsi14))
          : "",
      _id: item._id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirm(
      `Remove entry profiles mapped to ${item.company}?`,
      "Delete Record Profile",
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

      const ws = workbook.addWorksheet("Price Update Template");

      ws.columns = [
        { header: "Trading Code", key: "trading_code", width: 18 },
        { header: "1Y Low", key: "y1_low", width: 14 },
        { header: "1Y High", key: "y1_high", width: 14 },
        { header: "Session Low", key: "session_low", width: 16 },
        { header: "Session High", key: "session_high", width: 16 },
        { header: "Session Close", key: "session_close", width: 16 },
        { header: "Today Volume", key: "today_volume", width: 16 },
        { header: "Avg Volume (1M)", key: "avg_volume", width: 16 },
        { header: "MA 20", key: "ma20", width: 12 },
        { header: "RSI 14", key: "rsi14", width: 12 },
      ];

      ws.addRow({
        trading_code: "EXAMPLE",
        y1_low: 100.5,
        y1_high: 250.75,
        session_low: 120.3,
        session_high: 180.45,
        session_close: 150.6,
        today_volume: 2500000,
        avg_volume: 1500000,
        ma20: 120.5,
        rsi14: 45.6,
      });

      ws.addRow({
        trading_code: "SAMPLE",
        y1_low: 85.2,
        y1_high: 200.0,
        session_low: 90.5,
        session_high: 175.3,
        session_close: 145.8,
        today_volume: 3200000,
        avg_volume: 1800000,
        ma20: 110.2,
        rsi14: 52.1,
      });

      const headerRow = ws.getRow(1);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
          size: 12,
          name: "Calibri",
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 22;
          row.eachCell((cell, colNumber) => {
            cell.font = {
              name: "Calibri",
              size: 11,
              color: { argb: "FF333333" },
            };
            cell.alignment = {
              horizontal: colNumber === 1 ? "left" : "right",
              vertical: "middle",
            };
            cell.border = {
              top: { style: "thin", color: { argb: "FFD9D9D9" } },
              left: { style: "thin", color: { argb: "FFD9D9D9" } },
              bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
              right: { style: "thin", color: { argb: "FFD9D9D9" } },
            };

            if (
              colNumber > 1 &&
              (colNumber <= 6 || colNumber === 9 || colNumber === 10)
            ) {
              cell.numFmt = "0.00";
            } else if (colNumber > 6) {
              cell.numFmt = "#,##0";
            }
          });
        }
      });

      const wsInstructions = workbook.addWorksheet("Instructions");
      wsInstructions.columns = [{ header: "", key: "content", width: 80 }];

      const instructions = [
        { content: "Instructions for Price Update Excel Template" },
        { content: "" },
        { content: "Column Descriptions:" },
        { content: "Trading Code: Company trading symbol or name (Required)" },
        { content: "1Y Low: 52-week or 1-year lowest price" },
        { content: "1Y High: 52-week or 1-year highest price" },
        { content: "Session Low: Today's or current session lowest price" },
        { content: "Session High: Today's or current session highest price" },
        {
          content:
            "Session Close: Today's or current session closing/last price",
        },
        { content: "Today Volume: Current trading volume" },
        { content: "Avg Volume (1M): 1-month average trading volume" },
        { content: "" },
        { content: "Tips:" },
        { content: "You can add as many rows as needed" },
        { content: "Remove the sample rows before uploading your data" },
        { content: "All price values should be numeric (decimals allowed)" },
        { content: "Volume values should be numeric (integers)" },
      ];

      instructions.forEach((item) => {
        wsInstructions.addRow(item);
      });

      const titleRow = wsInstructions.getRow(1);
      titleRow.getCell(1).font = {
        bold: true,
        size: 16,
        color: { argb: "FF1F4E79" },
        name: "Calibri",
      };

      [3, 12].forEach((rowNum) => {
        const row = wsInstructions.getRow(rowNum);
        row.getCell(1).font = {
          bold: true,
          size: 13,
          color: { argb: "FF2E75B6" },
          name: "Calibri",
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "price_update_template.xlsx");

      showSuccessAlert("Template downloaded successfully!");
    } catch (error) {
      console.error("Error downloading template:", error);
      showErrorAlert("Failed to download template");
    }
  };

  const exportReportToExcel = async () => {
    if (sortedZoneData.length === 0) {
      showAlert("No data available to export. Please add some records first.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();

      const ws = workbook.addWorksheet("Price Analysis Report");

      ws.columns = [
        { header: "Company Name", key: "company", width: 20 },
        { header: "1Y Low", key: "low", width: 14 },
        { header: "1Y High", key: "high", width: 14 },
        { header: "Session Low", key: "session_low", width: 16 },
        { header: "Session High", key: "session_high", width: 16 },
        { header: "Session Close", key: "session_close", width: 16 },
        { header: "Today Volume", key: "today_volume", width: 16 },
        { header: "Avg Volume (1M)", key: "avg_volume", width: 16 },
        { header: "MA 20", key: "ma20", width: 12 },
        { header: "RSI 14", key: "rsi14", width: 12 },
        { header: "Pivot Point", key: "pivot", width: 16 },
        { header: "Resistance (R1)", key: "r1", width: 16 },
        { header: "Support (S1)", key: "s1", width: 16 },
        { header: "Volume Ratio", key: "vol_ratio", width: 16 },
        { header: "Pivot Signal", key: "pivot_signal", width: 18 },
        { header: "Custom Signal", key: "custom_signal", width: 20 },
      ];

      sortedZoneData.forEach((item) => {
        const cleanCompanyName = toUpperCaseName(item.company || "-");

        ws.addRow({
          company: cleanCompanyName,
          low: item.low ? Number(Number(item.low).toFixed(2)) : null,
          high: item.high ? Number(Number(item.high).toFixed(2)) : null,
          session_low: item.todaysLow
            ? Number(Number(item.todaysLow).toFixed(2))
            : null,
          session_high: item.todaysHigh
            ? Number(Number(item.todaysHigh).toFixed(2))
            : null,
          session_close: item.closingPrice
            ? Number(Number(item.closingPrice).toFixed(2))
            : null,
          today_volume: item.todayVolume ? Number(item.todayVolume) : null,
          avg_volume: item.avgVolume1M
            ? Number(roundAvgVolume(item.avgVolume1M))
            : null,
          ma20: item.ma20 ? Number(Number(item.ma20).toFixed(2)) : null,
          rsi14: item.rsi14 ? Number(Number(item.rsi14).toFixed(2)) : null,
          pivot: item.pivotPoint
            ? Number(Number(item.pivotPoint).toFixed(2))
            : null,
          r1: item.r1 ? Number(Number(item.r1).toFixed(2)) : null,
          s1: item.s1 ? Number(Number(item.s1).toFixed(2)) : null,
          vol_ratio: item.volRatio
            ? Number(Number(item.volRatio).toFixed(2))
            : null,
          pivot_signal: item.originalSignal || "Neutral",
          custom_signal: item.customSignal || "Neutral",
        });
      });

      const headerRow = ws.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
          size: 12,
          name: "Calibri",
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      // Apply styles to data rows with different colors for each column
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 24;

          const pivotSignal = row.getCell(15).value;
          const customSignal = row.getCell(16).value;

          row.eachCell((cell, colNumber) => {
            if (typeof cell.value === "string") {
              cell.value = cell.value.toUpperCase();
            }

            cell.font = {
              name: "Calibri",
              size: 11,
              color: { argb: "FF333333" },
            };
            cell.alignment = {
              horizontal: colNumber === 1 ? "left" : "right",
              vertical: "middle",
            };
            cell.border = {
              top: { style: "thin", color: { argb: "FFD9D9D9" } },
              left: { style: "thin", color: { argb: "FFD9D9D9" } },
              bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
              right: { style: "thin", color: { argb: "FFD9D9D9" } },
            };

            // Number formatting
            if (colNumber >= 2 && colNumber <= 6) {
              cell.numFmt = "0.00";
            } else if (colNumber >= 7 && colNumber <= 8) {
              cell.numFmt = "#,##0";
            } else if (colNumber >= 11 && colNumber <= 14) {
              cell.numFmt = "0.00";
            }

            // Column-specific background colors
            if (colNumber === 1) {
              // Company Name - Light blue background
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE6F0FA" },
              };
              cell.font = { ...cell.font, bold: true };
            } else if (colNumber >= 2 && colNumber <= 3) {
              // 1Y Low & 1Y High - Light blue
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD4E6F1" },
              };
            } else if (colNumber >= 4 && colNumber <= 6) {
              // Session columns - Light green
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD5F5E3" },
              };
            } else if (colNumber >= 7 && colNumber <= 8) {
              // Volume columns - Light orange
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFDEBD0" },
              };
            } else if (colNumber >= 11 && colNumber <= 13) {
              // Pivot, R1, S1 - Light purple
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8DAEF" },
              };
            } else if (colNumber === 14) {
              // Volume Ratio - Light cyan
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD4F1F9" },
              };
            } else if (colNumber === 15) {
              // Pivot Signal - Color coded
              cell.alignment = { horizontal: "center", vertical: "middle" };
              cell.font = { ...cell.font, bold: true, size: 11 };

              if (pivotSignal === "BULLISH" || pivotSignal === "Bullish") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFC6EFCE" },
                };
                cell.font.color = { argb: "FF006100" };
              } else if (
                pivotSignal === "BEARISH" ||
                pivotSignal === "Bearish"
              ) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFC7CE" },
                };
                cell.font.color = { argb: "FF9C0006" };
              } else {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFEB9C" },
                };
                cell.font.color = { argb: "FF9C6500" };
              }
            } else if (colNumber === 16) {
              // Custom Signal - Color coded
              cell.alignment = { horizontal: "center", vertical: "middle" };
              cell.font = { ...cell.font, bold: true, size: 11 };

              const signal = String(customSignal).toUpperCase();

              if (signal === "VERY STRONG BUYER") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF006100" },
                };
                cell.font.color = { argb: "FFFFFFFF" };
              } else if (signal === "STRONG BUYER" || signal === "STRONG BUYER (NP)") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF92D050" },
                };
                cell.font.color = { argb: "FF000000" };
              } else if (signal === "WEAK BUYER") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFC6EFCE" },
                };
                cell.font.color = { argb: "FF006100" };
              } else if (signal === "VERY STRONG SELLER") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF9C0006" },
                };
                cell.font.color = { argb: "FFFFFFFF" };
              } else if (signal === "STRONG SELLER") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFC7CE" },
                };
                cell.font.color = { argb: "FF9C0006" };
              } else if (signal === "WEAK SELLER") {
                // REMOVED COLOR - Neutral gray
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFD9D9D9" },
                };
                cell.font.color = { argb: "FF333333" };
              } else if (signal === "OVERBOUGHT (ST)") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF5B2D8E" },
                };
                cell.font.color = { argb: "FFFFFFFF" };
              } else if (signal === "OVERBOUGHT (HR)") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF9B59B6" },
                };
                cell.font.color = { argb: "FFFFFFFF" };
              } else if (signal === "OVERSOLD (WB)") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF3498DB" },
                };
                cell.font.color = { argb: "FFFFFFFF" };
              } else {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFEB9C" },
                };
                cell.font.color = { argb: "FF9C6500" };
              }
            }
          });
        }
      });

      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const filename = `price_analysis_report_${dateStr}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, filename);

      showSuccessAlert(`Report exported successfully!`);
    } catch (error) {
      console.error("Error exporting report:", error);
      showErrorAlert("Failed to export report");
    }
  };

  const getSignalStyle = (signal) => {
    if (!signal) return "bg-gray-800/60 text-gray-400";

    const signalUpper = signal.toUpperCase();

    if (signalUpper === "VERY STRONG BUYER") {
      return "bg-emerald-950/90 text-emerald-300 border border-emerald-600 font-bold";
    } else if (signalUpper === "STRONG BUYER" || signalUpper === "STRONG BUYER (NP)") {
      return "bg-emerald-900/80 text-emerald-300 border border-emerald-700";
    } else if (signalUpper === "WEAK BUYER") {
      return "bg-emerald-800/70 text-emerald-300 border border-emerald-800/50";
    } else if (signalUpper === "VERY STRONG SELLER") {
      return "bg-rose-950/90 text-rose-300 border border-rose-600 font-bold";
    } else if (signalUpper === "STRONG SELLER") {
      return "bg-rose-900/80 text-rose-300 border border-rose-700";
    } else if (signalUpper === "WEAK SELLER") {
      // REMOVED COLOR - Neutral gray
      return "bg-gray-800/60 text-gray-400";
    } else if (signalUpper === "OVERBOUGHT (ST)") {
      return "bg-purple-950/90 text-purple-300 border border-purple-600 font-bold";
    } else if (signalUpper === "OVERBOUGHT (HR)") {
      return "bg-purple-900/80 text-purple-300 border border-purple-700";
    } else if (signalUpper === "OVERSOLD (WB)") {
      return "bg-blue-950/80 text-blue-300 border border-blue-700";
    }

    return "bg-gray-800/60 text-gray-400";
  };

  const getPivotSignalStyle = (signal) => {
    if (!signal) return "bg-gray-800/60 text-gray-400";

    const signalUpper = signal.toUpperCase();

    if (signalUpper === "BULLISH") {
      return "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50";
    } else if (signalUpper === "BEARISH") {
      return "bg-rose-950/60 text-rose-400 border border-rose-800/50";
    }

    return "bg-gray-800/60 text-gray-400";
  };

  // Updated isValueChanged to use safe comparison
  const isValueChanged = (companyName, field, newValue) => {
    const comparison = comparisonData.find((c) => c.company === companyName);
    if (!comparison || !comparison.existing) return false;

    const existingValue = comparison.existing[field];
    return !safeNumberCompare(newValue, existingValue);
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
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                📥 Excel Import
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
                <span>📥</span> Template
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                📁 Upload Excel File (.xlsx, .xls)
              </label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={submitLoading || loading}
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {excelFileName && (
                  <span className="text-sm text-emerald-400 font-mono break-all">
                    ✅ {excelFileName}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500">
                  💡 Check Template before upload
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
                      <span className="text-yellow-400">
                        🟡{" "}
                        {
                          comparisonData.filter(
                            (d) => d.hasMismatch && !d.isNew,
                          ).length
                        }{" "}
                        Records with Changes
                      </span>
                      <span className="text-green-400">
                        🟢 {comparisonData.filter((d) => d.isNew).length} New
                        Records
                      </span>
                      <span className="text-gray-400">
                        ⚪{" "}
                        {
                          comparisonData.filter(
                            (d) => !d.hasMismatch && !d.isNew,
                          ).length
                        }{" "}
                        Unchanged
                      </span>
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
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Merging...
                        </>
                      ) : (
                        <>🔄 Merge & Update All</>
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

        {/* INPUT DATA SHEET PROFILE FORM */}
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
                  setFormData((prev) => ({
                    ...prev,
                    company: "",
                    _id: undefined,
                  }));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-all cursor-pointer"
              >
                {isNewCompany
                  ? "📋 Choose Existing Company"
                  : "➕ Add New Company"}
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
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* INPUT BOXES - Reordered to match header order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                1Y Low Price
              </label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                1Y High Price
              </label>
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
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Session Low
              </label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Session High
              </label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Session Close
              </label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Today Volume
              </label>
              <input
                type="number"
                name="todayVolume"
                placeholder="0"
                value={formData.todayVolume}
                onChange={handleChange}
                step="1"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Avg Volume (1M)
              </label>
              <input
                type="number"
                name="avgVolume1M"
                placeholder="0"
                value={formData.avgVolume1M}
                onChange={handleChange}
                step="1"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                MA 20
              </label>
              <input
                type="number"
                name="ma20"
                placeholder="0.00"
                value={formData.ma20}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-pink-500 mb-1.5">
                RSI 14
              </label>
              <input
                type="number"
                name="rsi14"
                placeholder="0.0"
                value={formData.rsi14}
                onChange={handleChange}
                step="0.1"
                className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons in one line */}
          <div className="flex flex-row gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitLoading || loading}
              className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all cursor-pointer text-center"
            >
              {submitLoading
                ? "Processing Variables..."
                : formData._id
                  ? "Update Data"
                  : "Submit"}
            </button>
            <button
              onClick={() => setShowReport(true)}
              disabled={submitLoading || loading}
              className="flex-1 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700 text-purple-300 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all cursor-pointer text-center"
            >
              View
            </button>
            <button
              onClick={() => {
                setShowReport(false);
                handleReset();
              }}
              disabled={submitLoading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table shows by default */}
        {showReport && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-200">
                  Report Summary
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
                  <span>📊</span> Report Export
                </button>
              </div>
            </div>

            {/* Table Container with max height for scrolling */}
            <div
              className="overflow-auto rounded-xl border border-gray-800"
              style={{ maxHeight: "600px" }}
            >
              <table className="w-full text-left border-collapse relative text-xs">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gray-950 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                    <th className="p-2.5 font-semibold sticky left-0 z-30 bg-gray-950 border-r border-gray-800 whitespace-nowrap min-w-30">
                      Company Name
                    </th>
                    <th className="p-2.5 font-semibold text-right text-gray-300 whitespace-nowrap">
                      1Y Low
                    </th>
                    <th className="p-2.5 font-semibold text-right text-gray-300 whitespace-nowrap">
                      1Y High
                    </th>
                    <th className="p-2.5 font-semibold text-right text-blue-400 whitespace-nowrap">
                      Session Low
                    </th>
                    <th className="p-2.5 font-semibold text-right text-blue-400 whitespace-nowrap">
                      Session High
                    </th>
                    <th className="p-2.5 font-semibold text-right text-blue-300 whitespace-nowrap">
                      Session Close
                    </th>
                    <th className="p-2.5 font-semibold text-right text-amber-400 whitespace-nowrap">
                      Today Volume
                    </th>
                    <th className="p-2.5 font-semibold text-right text-amber-400 whitespace-nowrap">
                      Avg Volume (1M)
                    </th>
                    <th className="p-2.5 font-semibold text-right text-pink-500 whitespace-nowrap">
                      MA 20
                    </th>
                    <th className="p-2.5 font-semibold text-right text-pink-500 whitespace-nowrap">
                      RSI 14
                    </th>
                    <th className="p-2.5 font-semibold text-right text-purple-400 whitespace-nowrap">
                      Pivot Point
                    </th>
                    <th className="p-2.5 font-semibold text-right text-orange-400 whitespace-nowrap">
                      Resistance (R1)
                    </th>
                    <th className="p-2.5 font-semibold text-right text-orange-400 whitespace-nowrap">
                      Support (S1)
                    </th>
                    <th className="p-2.5 font-semibold text-right text-cyan-400 whitespace-nowrap">
                      Volume Ratio
                    </th>
                    <th className="p-2.5 font-semibold text-center text-emerald-400 whitespace-nowrap">
                      Pivot Signal
                    </th>
                    <th className="p-2.5 font-semibold text-center text-cyan-400 whitespace-nowrap">
                      Custom Signal
                    </th>
                    <th className="p-2.5 font-semibold text-center min-w-25 whitespace-nowrap">
                      Action Control
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {showComparison && comparisonData.length > 0
                    ? comparisonData.map((item, index) => {
                        const hasChanges = item.hasMismatch;
                        const isNewRecord = item.isNew;

                        const getCellClass = (field, value) => {
                          if (isNewRecord) return "bg-yellow-950/30";
                          if (hasChanges && !safeNumberCompare(value, item.existing?.[field])) {
                            return "bg-amber-950/50 text-amber-300 font-bold ring-1 ring-amber-500/50";
                          }
                          return "";
                        };

                        return (
                          <tr
                            key={`compare-${index}`}
                            className={`hover:bg-gray-850/40 transition-colors ${hasChanges ? "bg-yellow-950/10" : ""}`}
                          >
                            <td
                              className="p-2.5 font-bold text-gray-100 whitespace-nowrap sticky left-0 z-10 bg-gray-900 border-r border-gray-800"
                              style={{
                                position: "sticky",
                                left: 0,
                                zIndex: 10,
                                backgroundColor: hasChanges
                                  ? "rgba(253, 230, 138, 0.05)"
                                  : "#111827",
                              }}
                            >
                              {isNewRecord && (
                                <span className="mr-1 text-green-500 text-[10px]">
                                  🆕
                                </span>
                              )}
                              {hasChanges && !isNewRecord && (
                                <span className="mr-1 text-amber-500 text-[10px]">
                                  ✏️
                                </span>
                              )}
                              {item.company}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("low", item.low)}`}
                            >
                              {item.low ? Number(item.low).toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("high", item.high)}`}
                            >
                              {item.high ? Number(item.high).toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("todaysLow", item.todaysLow)}`}
                            >
                              {item.todaysLow
                                ? Number(item.todaysLow).toFixed(2)
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("todaysHigh", item.todaysHigh)}`}
                            >
                              {item.todaysHigh
                                ? Number(item.todaysHigh).toFixed(2)
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("closingPrice", item.closingPrice)}`}
                            >
                              {item.closingPrice
                                ? Number(item.closingPrice).toFixed(2)
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("todayVolume", item.todayVolume)}`}
                            >
                              {item.todayVolume
                                ? Number(item.todayVolume).toLocaleString()
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("avgVolume1M", item.avgVolume1M)}`}
                            >
                              {item.avgVolume1M
                                ? Number(item.avgVolume1M).toLocaleString()
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("ma20", item.ma20)}`}
                            >
                              {item.ma20 !== undefined && item.ma20 !== null
                                ? Number(item.ma20).toFixed(2)
                                : "-"}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${getCellClass("rsi14", item.rsi14)}`}
                            >
                              {item.rsi14 !== undefined && item.rsi14 !== null
                                ? Number(item.rsi14).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-purple-400 font-bold bg-purple-950/10">
                              {item.pivotPoint
                                ? Number(item.pivotPoint).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-orange-400">
                              {item.r1 ? Number(item.r1).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-orange-400">
                              {item.s1 ? Number(item.s1).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-cyan-400">
                              {item.volRatio
                                ? Number(item.volRatio).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getPivotSignalStyle(item.originalSignal)}`}
                              >
                                {item.originalSignal || "Neutral"}
                              </span>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getSignalStyle(item.customSignal)}`}
                              >
                                {item.customSignal || "Neutral"}
                              </span>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              {!isNewRecord && item.existing && (
                                <button
                                  onClick={() => {
                                    if (item.existing)
                                      handleEdit(item.existing);
                                  }}
                                  className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-700/50 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                              {isNewRecord && (
                                <span className="text-[10px] text-green-500">
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    : sortedZoneData.map((item, index) => {
                        return (
                          <tr
                            key={item._id || index}
                            className="hover:bg-gray-850/40 transition-colors"
                          >
                            <td
                              className="p-2.5 font-bold text-gray-100 whitespace-nowrap sticky left-0 z-10 bg-gray-900 border-r border-gray-800"
                              style={{
                                position: "sticky",
                                left: 0,
                                zIndex: 10,
                                backgroundColor: "#111827",
                              }}
                            >
                              {item.company}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-400">
                              {item.low ? Number(item.low).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-400">
                              {item.high ? Number(item.high).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-blue-400/90">
                              {item.todaysLow
                                ? Number(item.todaysLow).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-blue-400/90">
                              {item.todaysHigh
                                ? Number(item.todaysHigh).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-200">
                              {item.closingPrice
                                ? Number(item.closingPrice).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-amber-400">
                              {item.todayVolume
                                ? Number(item.todayVolume).toLocaleString()
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-amber-400">
                              {item.avgVolume1M
                                ? Number(item.avgVolume1M).toLocaleString()
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-pink-500">
                              {item.ma20 !== undefined && item.ma20 !== null
                                ? Number(item.ma20).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-pink-600">
                              {item.rsi14 !== undefined && item.rsi14 !== null
                                ? Number(item.rsi14).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-purple-400 font-bold bg-purple-950/10">
                              {item.pivotPoint
                                ? Number(item.pivotPoint).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-orange-400">
                              {item.r1 ? Number(item.r1).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-orange-400">
                              {item.s1 ? Number(item.s1).toFixed(2) : "-"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-cyan-400">
                              {item.volRatio
                                ? Number(item.volRatio).toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getPivotSignalStyle(item.originalSignal)}`}
                              >
                                {item.originalSignal || "Neutral"}
                              </span>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getSignalStyle(item.customSignal)}`}
                              >
                                {item.customSignal || "Neutral"}
                              </span>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-700/50 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-700/50 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer"
                                >
                                  Del
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
              {sortedZoneData.length === 0 && comparisonData.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-medium">
                  No active forecast assets found. Upload an Excel file or add
                  records manually.
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
