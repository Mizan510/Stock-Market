import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const [formData, setFormData] = useState({
    company: "",
    todaysHigh: "",
    todaysLow: "",
    closingPrice: "",
    low: "",
    high: "",
  });

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/zone");
        const zoneList = res.data || [];
        setZoneData(zoneList);
        
        const uniqueCompanies = [
          ...new Set(zoneList.map((item) => item.company)),
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

      // Calculate floor pivot point if raw high, low, and close points exist
      let computedPivot = null;
      if (h && l && c) {
        computedPivot = (h + l + c) / 3;
      }

      const payload = {
        company: formData.company.trim(),
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
      } else {
        const res = await api.post("/zone", payload);
        savedRecord = res.data?.data || res.data;
        showSuccessAlert("Matrix profile generated successfully!");
        
        setZoneData((prev) => [savedRecord, ...prev]);
        
        if (!companies.includes(payload.company)) {
          setCompanies((prev) => [...prev, payload.company].sort());
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-6">
      <div className="w-full max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
              📊 Trading Forecast Matrix
            </h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
              Manage technical analytics data, high/low histories, and tracking pivots.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm tracking-wide transition-all"
          >
            Back
          </button>
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
                  setFormData((prev) => ({ ...prev, company: "", _id: undefined }));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-all"
              >
                {isNewCompany ? "📋 Choose Existing Entry" : "➕ Setup Brand New Target"}
              </button>
            </div>

            {isNewCompany ? (
              <input
                type="text"
                name="company"
                placeholder="Enter company ticker symbol/name..."
                value={formData.company}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            ) : (
              <select
                name="company"
                value={formData.company}
                onChange={handleCompanySelect}
                disabled={loading}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Select Existing Target Asset --</option>
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
              className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all"
            >
              {submitLoading ? "Processing Variables..." : formData._id ? "Update Target Metrics" : "Generate Forecast Entry"}
            </button>
            <button
              onClick={() => setShowReport(true)}
              disabled={submitLoading || loading}
              className="flex-1 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700 text-purple-300 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all"
            >
              View Full Forecast Matrix
            </button>
            <button
              onClick={() => { setShowReport(false); handleReset(); }}
              disabled={submitLoading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium text-sm transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* COMPACTED EXECUTION MATRIX SUMMARY TABLE */}
        {showReport && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold tracking-tight text-gray-200">Execution Strategy Matrix</h2>
              <span className="text-xs font-mono text-gray-500">Live Computational View</span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                    <th className="p-3 font-semibold min-w-140px">Company Name</th>
                    <th className="p-3 font-semibold text-right text-gray-300">1Y Low</th>
                    <th className="p-3 font-semibold text-right text-gray-300">1Y High</th>
                    <th className="p-3 font-semibold text-right text-blue-400">Session Low</th>
                    <th className="p-3 font-semibold text-right text-blue-400">Session High</th>
                    <th className="p-3 font-semibold text-right text-blue-300">Session Close</th>
                    <th className="p-3 font-semibold text-right text-purple-400">Pivot Point</th>
                    <th className="p-3 font-semibold text-center text-amber-400">Forecast Matrix</th>
                    <th className="p-3 font-semibold text-center min-w-130px">Action Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-xs">
                  {zoneData.map((item, index) => {
                    // Quick inline trend evaluation calculation checks
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
                          {item.todaysLow ? Number(item.todaysLow).toFixed(2) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-blue-400/90">
                          {item.todaysHigh ? Number(item.todaysHigh).toFixed(2) : "-"}
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
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-700/50 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-700/50 px-2 py-1 rounded text-[11px] font-semibold transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {zoneData.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-medium">
                  No active forecast assets found.
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