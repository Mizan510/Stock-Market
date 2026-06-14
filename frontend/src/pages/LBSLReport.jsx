import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCurrentUserId } from "../utils/auth";
import {
  showAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../utils/sweetAlert";

const LBSLReport = () => {
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const [costAmount, setCostAmount] = useState("");
  const [currentAssetsPP, setCurrentAssetsPP] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [savedReport, setSavedReport] = useState(null);
  const [showSavedReport, setShowSavedReport] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    fetchSavedReport();
  }, [navigate, userId]);

  const fetchSavedReport = async () => {
    try {
      if (!userId) {
        console.warn("No userId available for fetching LBSL report");
        return;
      }

      const response = await api.get(`/lbsl/${userId}`);
      const data = response.data?.data;

      if (data) {
        setSavedReport(data);
        setCostAmount(data.costAmount.toString());
        setCurrentAssetsPP(data.currentAssetsPP.toString());
        setSavedAt(
          new Date(data.savedAt || data.updatedAt).toLocaleString("en-GB", {
            timeZone: "Asia/Dhaka",
          }),
        );
      }
    } catch (err) {
      console.error("Failed to load saved LBSL report:", err);
      if (err.response?.status === 500) {
        showErrorAlert("Server error loading report. Please refresh the page.");
      }
    }
  };

  const handleSave = async () => {
    if (costAmount === "" || currentAssetsPP === "") {
      showAlert("Please fill in both fields before saving.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId,
        costAmount: Number(costAmount) || 0,
        currentAssetsPP: Number(currentAssetsPP) || 0,
      };

      const response = savedReport?._id
        ? await api.put(`/lbsl/update/${savedReport._id}`, payload)
        : await api.post("/lbsl/add", payload);

      const data = response.data?.data;

      if (data) {
        setSavedReport(data);
        setSavedAt(
          new Date(data.savedAt || data.updatedAt).toLocaleString("en-GB", {
            timeZone: "Asia/Dhaka",
          }),
        );
        setCostAmount("");
        setCurrentAssetsPP("");
        setShowSavedReport(true);
        showSuccessAlert("LBSL report saved successfully.");
      }
    } catch (err) {
      console.log(err);
      showErrorAlert(err.response?.data?.message || "Error saving report");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCostAmount("");
    setCurrentAssetsPP("");
    setShowSavedReport(false);
  };

  const handleViewReport = () => {
    if (!savedReport) return;
    setShowSavedReport(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleEdit = () => {
    if (!savedReport) return;
    setCostAmount(savedReport.costAmount.toString());
    setCurrentAssetsPP(savedReport.currentAssetsPP.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!savedReport?._id) return;

    try {
      await api.delete(`/lbsl/delete/${savedReport._id}`);
      setSavedReport(null);
      setSavedAt(null);
      setShowSavedReport(false);
      setCostAmount("");
      setCurrentAssetsPP("");
      showSuccessAlert("Saved LBSL report deleted successfully.");
    } catch (err) {
      console.log(err);
      showErrorAlert(err.response?.data?.message || "Error deleting report");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">LBSL Report</h1>
            <p className="text-gray-400 mt-2">
              Enter LBSL figures for (Current Assets) / PP and Cost Amount (TK.)
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-end rounded-2xl border border-slate-700 bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
          >
            Back
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-300">
            <span className="block mb-2 font-medium">(Current Assets) / PP</span>
            <input
              type="number"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Enter current assets per PP"
            />
          </label>

          <label className="block text-sm text-gray-300">
            <span className="block mb-2 font-medium">
              Cost Amount (TK.)
            </span>
            <input
              type="number"
              value={currentAssetsPP}
              onChange={(e) => setCurrentAssetsPP(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Enter cost amount"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {loading ? "Saving..." : "Save Report"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-gray-200 transition hover:border-slate-500"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleViewReport}
            disabled={!savedReport}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            View Saved Data
          </button>
          {savedAt && (
            <p className="text-sm text-gray-400">Last saved: {savedAt}</p>
          )}
        </div>

        {showSavedReport && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg shadow-slate-950/20">
            <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Saved LBSL Report
                </p>
                {savedAt && (
                  <p className="text-xs text-gray-400">Last saved: {savedAt}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={!savedReport}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!savedReport}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-red-500 disabled:cursor-not-allowed disabled:border-slate-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Field
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                <tr>
                  <td className="px-4 py-4 text-gray-300">(Current Assets) / PP</td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {savedReport?.costAmount !== undefined
                      ? `৳ ${savedReport.costAmount.toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-gray-300">
                    Cost Amount (TK.)
                  </td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {savedReport?.currentAssetsPP !== undefined
                      ? `৳ ${savedReport.currentAssetsPP.toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LBSLReport;
