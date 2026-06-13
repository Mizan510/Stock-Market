import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import DividendExport from "../components/DividendExport";
import { useConfirm } from "../components/ConfirmProvider";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const Dividend = () => {
  const userId = getCurrentUserId();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // ডাইনামিক অর্থবছর (জুলাই ১ থেকে জুন ৩০) নির্ধারণের লজিক
  const getFiscalYearDates = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    const currentYear = bd.getFullYear();
    const currentMonth = bd.getMonth() + 1;

    let fromYear, toYear;

    if (currentMonth >= 7) {
      fromYear = currentYear;
      toYear = currentYear + 1;
    } else {
      fromYear = currentYear - 1;
      toYear = currentYear;
    }

    const fromDate = `${fromYear}-07-01`;
    const toDate = `${toYear}-06-30`;

    return { fromDate, toDate };
  };

  // ডেটাবেজ থেকে আসা ডেটকে ইনপুট ফিল্ডের উপযোগী (YYYY-MM-DD) করার সেফ ফাংশন
  const formatBackendDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.getFullYear() + 
      "-" + String(d.getMonth() + 1).padStart(2, "0") + 
      "-" + String(d.getDate()).padStart(2, "0");
  };

  const defaultForm = {
    declarationDate: "",
    recordDate: "",
    companyName: "",
    shares: "",
    dividendPercent: "",
    faceValue: "10",
    perShareDividend: "",
    grossDividend: "",
    taxPercent: "10",
    taxAmount: "",
    netDividend: "",
    netDividendSendInBank: "",
    bankPaymentDate: "",
    costPerShare: "",
    dividendPer100tk: "",
    nonShariahIncome: "",
    totalIncome: "",
    purificationRate: "",
    purificationAmount: "",
    netDividendAfterPurification: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  // অর্থবছরের ডিফল্ট ফিল্টার সেটআপ
  const { fromDate: initialFromDate, toDate: initialToDate } = getFiscalYearDates();
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/dividend/${userId}`);
      setList(res.data);
      applyFilter(res.data, fromDate, toDate);
    } catch (err) {
      console.log(err);
    }
  };

  // ফিল্টার করার ফাংশন (Declaration Date অথবা Record Date দিয়ে ফিল্টার হবে)
  const applyFilter = (allData, start, end) => {
    const filtered = allData.filter((item) => {
      const dateToUse = item.declarationDate || item.recordDate;
      if (!dateToUse) return false;

      const d = formatBackendDate(dateToUse);
      return d >= start && d <= end;
    });
    setFilteredList(filtered);
  };

  const inputClass = (name) => {
    return `w-full p-2 rounded ${form[name] ? "bg-cyan-600 text-slate-100" : "bg-gray-800"}`;
  };

  const formatNumber = (value) => {
    if (value === "" || value == null || Number.isNaN(value)) return "";
    return value.toFixed(2);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ক্যালকুলেশন হ্যান্ডলার
  useEffect(() => {
    const dividendPercent = Number(form.dividendPercent || 0);
    const faceValue = Number(form.faceValue || 0);
    const shares = Number(form.shares || 0);
    const taxPercent = Number(form.taxPercent || 0);
    const costPerShare = Number(form.costPerShare || 0);
    const nonShariahIncome = Number(form.nonShariahIncome || 0);
    const totalIncome = Number(form.totalIncome || 0);

    const perShareDividend =
      form.dividendPercent !== "" && faceValue > 0
        ? (dividendPercent * faceValue) / 100
        : "";

    const grossDividend =
      perShareDividend !== "" && form.shares !== ""
        ? shares * perShareDividend
        : "";

    const taxAmount =
      grossDividend !== "" ? (grossDividend * taxPercent) / 100 : "";

    const netDividend = grossDividend !== "" ? grossDividend - taxAmount : "";

    const dividendPer100tk =
      perShareDividend !== "" && costPerShare > 0
        ? (perShareDividend / costPerShare) * 100
        : "";

    const purificationRate =
      totalIncome > 0 ? (nonShariahIncome / totalIncome) * 100 : "";

    const purificationAmount =
      grossDividend !== "" && purificationRate !== ""
        ? (grossDividend * purificationRate) / 100
        : "";

    const netDividendAfterPurification =
      netDividend !== "" && purificationAmount !== ""
        ? netDividend - purificationAmount
        : "";

    const updatedForm = {
      ...form,
      perShareDividend: perShareDividend !== "" ? formatNumber(perShareDividend) : "",
      grossDividend: grossDividend !== "" ? formatNumber(grossDividend) : "",
      taxAmount: taxAmount !== "" ? formatNumber(taxAmount) : "",
      netDividend: netDividend !== "" ? formatNumber(netDividend) : "",
      netDividendSendInBank: netDividend !== "" ? formatNumber(netDividend) : "",
      dividendPer100tk: dividendPer100tk !== "" ? formatNumber(dividendPer100tk) : "",
      purificationRate: purificationRate !== "" ? formatNumber(purificationRate) : "",
      purificationAmount: purificationAmount !== "" ? formatNumber(purificationAmount) : "",
      netDividendAfterPurification: netDividendAfterPurification !== "" ? formatNumber(netDividendAfterPurification) : "",
    };

    if (
      updatedForm.perShareDividend !== form.perShareDividend ||
      updatedForm.grossDividend !== form.grossDividend ||
      updatedForm.taxAmount !== form.taxAmount ||
      updatedForm.netDividend !== form.netDividend ||
      updatedForm.dividendPer100tk !== form.dividendPer100tk ||
      updatedForm.purificationRate !== form.purificationRate ||
      updatedForm.purificationAmount !== form.purificationAmount ||
      updatedForm.netDividendAfterPurification !== form.netDividendAfterPurification
    ) {
      setForm(updatedForm);
    }
  }, [
    form.dividendPercent,
    form.faceValue,
    form.shares,
    form.taxPercent,
    form.costPerShare,
    form.nonShariahIncome,
    form.totalIncome,
  ]);

  // সেভ বা আপডেট লজিক
  const handleSave = async () => {
    if (
      !form.companyName ||
      !form.shares ||
      !form.dividendPercent ||
      !form.costPerShare
    ) {
      showAlert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);
      let updatedList = [];

      if (editingId) {
        const res = await api.put(`/dividend/update/${editingId}`, { ...form });
        const saved = { ...res.data.data, ...form };

        updatedList = list.map((item) => (item._id === editingId ? saved : item));
        setEditingId(null);
        showSuccessAlert("Updated successfully");
      } else {
        const res = await api.post("/dividend/add", { userId, ...form });
        const saved = { ...res.data.data, ...form };
        
        updatedList = [saved, ...list];
        showSuccessAlert("Saved successfully");
      }

      setList(updatedList);
      
      const savedDate = form.declarationDate || form.recordDate;
      let currentFrom = fromDate;
      let currentTo = toDate;
      
      if (savedDate && (savedDate < fromDate || savedDate > toDate)) {
        if (savedDate < fromDate) currentFrom = savedDate;
        if (savedDate > toDate) currentTo = savedDate;
        setFromDate(currentFrom);
        setToDate(currentTo);
      }

      applyFilter(updatedList, currentFrom, currentTo);
      setForm(defaultForm);
      setShowReport(true);
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setForm(defaultForm);
    applyFilter(list, fromDate, toDate);
    setShowReport(false);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      declarationDate: formatBackendDate(item.declarationDate),
      recordDate: formatBackendDate(item.recordDate),
      companyName: item.companyName || "",
      shares: item.shares || "",
      dividendPercent: item.dividendPercent || "",
      faceValue: item.faceValue || "10",
      perShareDividend: item.perShareDividend || "",
      grossDividend: item.grossDividend || "",
      taxPercent: item.taxPercent || "10",
      taxAmount: item.taxAmount || "",
      netDividend: item.netDividend || "",
      netDividendSendInBank: item.netDividendSendInBank || "",
      bankPaymentDate: formatBackendDate(item.bankPaymentDate),
      costPerShare: item.costPerShare || "",
      dividendPer100tk: item.dividendPer100tk || "",
      purificationRate: item.purificationRate || "",
      purificationAmount: item.purificationAmount || "",
      netDividendAfterPurification: item.netDividendAfterPurification || "",
      nonShariahIncome: item.nonShariahIncome || "",
      totalIncome: item.totalIncome || "",
    });
    setShowReport(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = await confirm("Delete this dividend record?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/dividend/delete/${id}`);
      const updated = list.filter((item) => item._id !== id);
      setList(updated);
      applyFilter(updated, fromDate, toDate);
      showSuccessAlert("Deleted successfully");
    } catch (err) {
      showErrorAlert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleView = () => {
    setViewLoading(true);
    setTimeout(() => {
      applyFilter(list, fromDate, toDate);
      setShowReport(true);
      setViewLoading(false);
    }, 300);
  };

  const handleReset = () => {
    setResetLoading(true);
    setTimeout(() => {
      const { fromDate: fiscalFromDate, toDate: fiscalToDate } = getFiscalYearDates();
      setFromDate(fiscalFromDate);
      setToDate(fiscalToDate);
      applyFilter(list, fiscalFromDate, fiscalToDate);
      setShowReport(false);
      setResetLoading(false);
    }, 300);
  };

  const handleExport = async () => {
    if (exportLoading) return;
    try {
      await DividendExport({
        filteredList,
        list,
        setExportLoading,
      });
    } catch (err) {
      showErrorAlert(err?.message || "Export failed");
      setExportLoading(false);
    }
  };

  // কলামের টোটাল SUM বের করার হেল্পার ফাংশন
  const computeColumnSum = (key) => {
    const total = filteredList.reduce((acc, item) => acc + Number(item[key] || 0), 0);
    return total === 0 ? "0.00" : total.toFixed(2);
  };

  // Purification কলামের ডাইনামিক ব্যাকগ্রাউন্ড স্টাইল নির্ধারণী
  const getPurificationBgClass = (value) => {
    const num = Number(value) || 0;
    if (num > 0) return "bg-green-800 text-white font-bold";
    if (num < 0) return "bg-red-900 text-white font-bold";
    return "bg-gray-700 text-gray-200 font-bold";
  };

  const totalNetAfterPurification = filteredList.reduce(
    (acc, item) => acc + Number(item.netDividendAfterPurification || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Dividend</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-gray-900 p-4 rounded mb-4">
          <div>
            <label htmlFor="declarationDate" className="block text-sm text-gray-300 mb-1">
              1. Declaration Date
            </label>
            <input
              id="declarationDate"
              name="declarationDate"
              type="date"
              value={form.declarationDate}
              onChange={handleChange}
              className={inputClass("declarationDate")}
            />
          </div>

          <div>
            <label htmlFor="recordDate" className="block text-sm text-gray-300 mb-1">
              2. Record Date
            </label>
            <input
              id="recordDate"
              name="recordDate"
              type="date"
              value={form.recordDate}
              onChange={handleChange}
              className={inputClass("recordDate")}
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm text-gray-300 mb-1">
              3. Company Name *
            </label>
            <input
              id="companyName"
              name="companyName"
              placeholder="Company Name"
              value={form.companyName}
              onChange={handleChange}
              className={inputClass("companyName")}
            />
          </div>

          <div>
            <label htmlFor="shares" className="block text-sm text-gray-300 mb-1">
              4. Number of Shares *
            </label>
            <input
              id="shares"
              name="shares"
              placeholder="Number of Shares"
              value={form.shares}
              onChange={handleChange}
              className={inputClass("shares")}
            />
          </div>

          <div>
            <label htmlFor="dividendPercent" className="block text-sm text-gray-300 mb-1">
              5. Company Dividend % *
            </label>
            <input
              id="dividendPercent"
              name="dividendPercent"
              placeholder="Company Dividend %"
              value={form.dividendPercent}
              onChange={handleChange}
              className={inputClass("dividendPercent")}
            />
          </div>

          <div>
            <label htmlFor="faceValue" className="block text-sm text-gray-300 mb-1">
              6. Face Value
            </label>
            <input
              id="faceValue"
              name="faceValue"
              placeholder="Face Value"
              value={form.faceValue}
              onChange={handleChange}
              className={inputClass("faceValue")}
            />
          </div>

          <div>
            <label htmlFor="perShareDividend" className="block text-sm text-gray-300 mb-1">
              7. Per Share Cash Dividend
            </label>
            <input
              id="perShareDividend"
              name="perShareDividend"
              placeholder="Per Share Cash Dividend"
              value={form.perShareDividend}
              readOnly
              className={inputClass("perShareDividend")}
            />
          </div>

          <div>
            <label htmlFor="grossDividend" className="block text-sm text-gray-300 mb-1">
              8. Gross Dividend
            </label>
            <input
              id="grossDividend"
              name="grossDividend"
              placeholder="Gross Dividend"
              value={form.grossDividend}
              readOnly
              className={inputClass("grossDividend")}
            />
          </div>

          <div>
            <label htmlFor="taxPercent" className="block text-sm text-gray-300 mb-1">
              9. Tax %
            </label>
            <input
              id="taxPercent"
              name="taxPercent"
              placeholder="Tax %"
              value={form.taxPercent}
              onChange={handleChange}
              className={inputClass("taxPercent")}
            />
          </div>

          <div>
            <label htmlFor="taxAmount" className="block text-sm text-gray-300 mb-1">
              10. Tax Amount
            </label>
            <input
              id="taxAmount"
              name="taxAmount"
              placeholder="Tax Amount"
              value={form.taxAmount}
              readOnly
              className={inputClass("taxAmount")}
            />
          </div>

          <div>
            <label htmlFor="netDividendSendInBank" className="block text-sm text-gray-300 mb-1">
              11. Net Dividend send in bank
            </label>
            <input
              id="netDividendSendInBank"
              name="netDividendSendInBank"
              placeholder="Net Dividend send in bank"
              value={form.netDividendSendInBank}
              readOnly
              className={inputClass("netDividendSendInBank")}
            />
          </div>

          <div>
            <label htmlFor="bankPaymentDate" className="block text-sm text-gray-300 mb-1">
              12. Bank Payment Date
            </label>
            <input
              id="bankPaymentDate"
              name="bankPaymentDate"
              type="date"
              value={form.bankPaymentDate}
              onChange={handleChange}
              className={inputClass("bankPaymentDate")}
            />
          </div>

          <div>
            <label htmlFor="costPerShare" className="block text-sm text-gray-300 mb-1">
              13. Per Share COST (Commission) *
            </label>
            <input
              id="costPerShare"
              name="costPerShare"
              placeholder="Per Share COST (Commission)"
              value={form.costPerShare}
              onChange={handleChange}
              className={inputClass("costPerShare")}
            />
          </div>

          <div>
            <label htmlFor="dividendPer100tk" className="block text-sm text-gray-300 mb-1">
              14. Dividend per 100 tk
            </label>
            <input
              id="dividendPer100tk"
              name="dividendPer100tk"
              placeholder="Dividend per 100 tk"
              value={form.dividendPer100tk}
              readOnly
              className={inputClass("dividendPer100tk")}
            />
          </div>

          <div>
            <label htmlFor="nonShariahIncome" className="block text-sm text-gray-300 mb-1">
              15. Non Shariah Income
            </label>
            <input
              id="nonShariahIncome"
              name="nonShariahIncome"
              placeholder="Non Shariah Income"
              value={form.nonShariahIncome}
              onChange={handleChange}
              className={inputClass("nonShariahIncome")}
            />
          </div>

          <div>
            <label htmlFor="totalIncome" className="block text-sm text-gray-300 mb-1">
              16. Total Income
            </label>
            <input
              id="totalIncome"
              name="totalIncome"
              placeholder="Total Income"
              value={form.totalIncome}
              onChange={handleChange}
              className={inputClass("totalIncome")}
            />
          </div>

          <div>
            <label htmlFor="purificationRate" className="block text-sm text-gray-300 mb-1">
              17. Purification Rate
            </label>
            <input
              id="purificationRate"
              name="purificationRate"
              placeholder="Purification Rate"
              value={form.purificationRate}
              readOnly
              className={inputClass("purificationRate")}
            />
          </div>

          <div>
            <label htmlFor="purificationAmount" className="block text-sm text-gray-300 mb-1">
              18. Purification Amount
            </label>
            <input
              id="purificationAmount"
              name="purificationAmount"
              placeholder="Purification Amount"
              value={form.purificationAmount}
              readOnly
              className={inputClass("purificationAmount")}
            />
          </div>

          <div>
            <label htmlFor="netDividendAfterPurification" className="block text-sm text-gray-300 mb-1">
              19. Net Dividend after Purification
            </label>
            <input
              id="netDividendAfterPurification"
              name="netDividendAfterPurification"
              placeholder="Net Dividend after Purification"
              value={form.netDividendAfterPurification}
              readOnly
              className={inputClass("netDividendAfterPurification")}
            />
          </div>
        </div>

        {/* FORM BUTTONS */}
        <div className="flex flex-col gap-2 md:flex-row mb-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full md:w-auto flex-1 bg-green-600 p-2 rounded disabled:opacity-60"
          >
            {loading ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full md:w-auto flex-1 bg-slate-600 p-2 rounded"
          >
            Refresh
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleRefresh}
              className="w-full md:w-auto flex-1 bg-red-600 p-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>

        {/* FILTER SECTION */}
        <div className="bg-gray-900 p-4 rounded space-y-2 mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Filter by Date 
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleView}
              disabled={viewLoading}
              className="bg-blue-600 p-2 rounded w-full disabled:opacity-60 hover:bg-blue-700"
            >
              {viewLoading ? "Loading..." : "View"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="bg-green-600 p-2 rounded w-full disabled:opacity-60 hover:bg-green-700"
            >
              {exportLoading ? "Exporting..." : "Export"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-gray-600 p-2 rounded w-full disabled:opacity-60 hover:bg-gray-700"
            >
              {resetLoading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>

        {/* REPORT TABLE */}
        {showReport && (
  <div className="bg-gray-900 p-4 rounded border border-gray-800">
    <h2 className="text-xl font-semibold mb-3">Dividend Report</h2>
    {filteredList.length === 0 ? (
      <p className="text-gray-400">No dividend records found for the selected date range.</p>
    ) : (
      <div className="overflow-auto custom-scrollbar" style={{ maxHeight: '450px' }}>
        {/* 📝 টেক্সট সাইজ বাড়িয়ে text-sm করা হয়েছে */}
        <table className="min-w-full text-sm text-left border-collapse relative">
          <thead className="bg-gray-800 text-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgba(55,65,81,1)] font-mono">
            <tr>
              {/* ↕️ py-2 দিয়ে হেডারের স্পেসিং ব্যালেন্স করা হয়েছে */}
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Declaration Date</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Record Date</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Company Name</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Shares</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Dividend %</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Face Value</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Per Share Dividend</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Gross Dividend</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Tax %</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Tax Amount</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Net Dividend send in bank</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Bank Payment Date</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Cost/Share</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Dividend per 100 tk</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Non Shariah Income</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Total Income</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Purification Rate</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Purification Amount</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Net Dividend after Purification</th>
              <th className="py-2 px-3 border border-gray-700 bg-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => (
              <tr key={item._id} className="odd:bg-gray-950 even:bg-gray-900 hover:bg-gray-800/40 transition-colors">
                {/* ↕️ py-1.5 এবং px-3 দিয়ে রো-এর হাইট পারফেক্টলি বাড়ানো হয়েছে */}
                <td className="py-1.5 px-3 border border-gray-700 whitespace-nowrap">
                  {item.declarationDate ? new Date(item.declarationDate).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="py-1.5 px-3 border border-gray-700 whitespace-nowrap">
                  {item.recordDate ? new Date(item.recordDate).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="py-1.5 px-3 border border-gray-700 font-medium">{item.companyName || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.shares || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.dividendPercent || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.faceValue || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.perShareDividend || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.grossDividend || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.taxPercent || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.taxAmount || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.netDividendSendInBank || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 whitespace-nowrap">
                  {item.bankPaymentDate ? new Date(item.bankPaymentDate).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.costPerShare || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.dividendPer100tk || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.nonShariahIncome || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.totalIncome || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.purificationRate || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.purificationAmount || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700 font-mono text-right">{item.netDividendAfterPurification || "-"}</td>
                <td className="py-1.5 px-3 border border-gray-700">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* 📌 SUM ROW (টেক্সট সাইজ text-sm এর সাথে ম্যাচ করে প্যাডিং অ্যাডজাস্টেড) */}
            <tr className="bg-gray-800 font-bold border-t-2 border-gray-600 text-yellow-500 sticky bottom-0 z-10 shadow-[0_-1px_0_rgba(75,85,99,1)] font-mono">
              <td className="py-2 px-3 border border-gray-700 bg-gray-800"></td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800"></td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-center font-extrabold text-yellow-400">SUM</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-white text-right">{computeColumnSum("shares")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("dividendPercent")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("faceValue")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("perShareDividend")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("grossDividend")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("taxPercent")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("taxAmount")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-green-700 text-white font-extrabold text-right">{computeColumnSum("netDividendSendInBank")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800"></td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("costPerShare")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("dividendPer100tk")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("nonShariahIncome")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("totalIncome")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("purificationRate")}</td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800 text-right">{computeColumnSum("purificationAmount")}</td>
              <td className={`py-2 px-3 border border-gray-700 text-right ${getPurificationBgClass(totalNetAfterPurification)}`}>
                {totalNetAfterPurification === 0 ? "0.00" : totalNetAfterPurification.toFixed(2)}
              </td>
              <td className="py-2 px-3 border border-gray-700 bg-gray-800"></td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default Dividend;
