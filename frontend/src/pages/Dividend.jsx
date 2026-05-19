import React, { useEffect, useState } from "react";
import api from "../api";
import DividendExport from "../components/DividendExport";

const Dividend = () => {
  const userId = "demo-user";

  const getBDDate = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return bd.toISOString().split("T")[0];
  };

  const getFinancialYearDates = () => {
    const now = new Date();
    const bd = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    const year = bd.getFullYear();
    const month = bd.getMonth();

    let fromYear = year;
    let toYear = year;

    if (month < 6) {
      fromYear = year - 1;
    } else {
      toYear = year + 1;
    }

    const fromDate = `${fromYear}-07-01`;
    const toDate = `${toYear}-06-30`;

    return { fromDate, toDate };
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
    bankPaymentDate: "",
    costPerShare: "",
    dividendPer100tk: "",
  };

  const [form, setForm] = useState(defaultForm);

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const { fromDate: initialFromDate, toDate: initialToDate } = getFinancialYearDates();
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/dividend/${userId}`);
      setList(res.data);
      setFilteredList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const formulaFields = new Set([
    "perShareDividend",
    "grossDividend",
    "taxAmount",
    "netDividend",
    "dividendPer100tk",
  ]);

  const inputClass = (name) => {
    return `w-full p-2 rounded ${form[name] ? "bg-cyan-600 text-slate-100" : "bg-gray-800"}`;
  };

  const formatNumber = (value) => {
    if (value === "" || value == null || Number.isNaN(value)) return "";
    return value.toFixed(2);
  };

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const dividendPercent = Number(form.dividendPercent || 0);
    const faceValue = Number(form.faceValue || 0);
    const shares = Number(form.shares || 0);
    const taxPercent = Number(form.taxPercent || 0);
    const costPerShare = Number(form.costPerShare || 0);

    const perShareDividend =
      form.dividendPercent !== "" && faceValue > 0
        ? dividendPercent / faceValue
        : "";
    const grossDividend =
      perShareDividend !== "" && form.shares !== ""
        ? shares * perShareDividend
        : "";
    const taxAmount =
      grossDividend !== "" ? (grossDividend * taxPercent) / 100 : "";
    const netDividend =
      grossDividend !== "" && taxAmount !== "" ? grossDividend - taxAmount : "";
    const dividendPer100tk =
      perShareDividend !== "" && costPerShare > 0
        ? (perShareDividend / costPerShare) * 100
        : "";

    const updatedForm = {
      ...form,
      perShareDividend:
        perShareDividend !== "" ? formatNumber(perShareDividend) : "",
      grossDividend: grossDividend !== "" ? formatNumber(grossDividend) : "",
      taxAmount: taxAmount !== "" ? formatNumber(taxAmount) : "",
      netDividend: netDividend !== "" ? formatNumber(netDividend) : "",
      dividendPer100tk:
        dividendPer100tk !== "" ? formatNumber(dividendPer100tk) : "",
    };

    if (
      updatedForm.perShareDividend !== form.perShareDividend ||
      updatedForm.grossDividend !== form.grossDividend ||
      updatedForm.taxAmount !== form.taxAmount ||
      updatedForm.netDividend !== form.netDividend ||
      updatedForm.dividendPer100tk !== form.dividendPer100tk
    ) {
      setForm(updatedForm);
    }
  }, [
    form.dividendPercent,
    form.faceValue,
    form.shares,
    form.taxPercent,
    form.costPerShare,
  ]);

  // ================= SAVE =================
  const handleSave = async () => {
    if (
      !form.companyName ||
      !form.shares ||
      !form.dividendPercent ||
      !form.costPerShare
    ) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const res = await api.put(`/dividend/update/${editingId}`, {
          ...form,
        });

        setList((prev) =>
          prev.map((item) => (item._id === editingId ? res.data.data : item)),
        );

        setFilteredList((prev) =>
          prev.map((item) => (item._id === editingId ? res.data.data : item)),
        );

        setEditingId(null);
        setShowReport(true);
      } else {
        const res = await api.post("/dividend/add", {
          userId,
          ...form,
        });

        setList((prev) => [res.data.data, ...prev]);
        setFilteredList((prev) => [res.data.data, ...prev]);
        setShowReport(true);
      }

      setForm(defaultForm);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setForm(defaultForm);
    setFilteredList(list);
    setShowReport(false);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      declarationDate: item.declarationDate
        ? new Date(item.declarationDate).toISOString().split("T")[0]
        : "",
      recordDate: item.recordDate
        ? new Date(item.recordDate).toISOString().split("T")[0]
        : "",
      companyName: item.companyName || "",
      shares: item.shares || "",
      dividendPercent: item.dividendPercent || "",
      faceValue: item.faceValue || "10",
      perShareDividend: item.perShareDividend || "",
      grossDividend: item.grossDividend || "",
      taxPercent: item.taxPercent || "10",
      taxAmount: item.taxAmount || "",
      netDividend: item.netDividend || "",
      bankPaymentDate: item.bankPaymentDate
        ? new Date(item.bankPaymentDate).toISOString().split("T")[0]
        : "",
      costPerShare: item.costPerShare || "",
      dividendPer100tk: item.dividendPer100tk || "",
    });
    setShowReport(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dividend record?")) return;

    try {
      await api.delete(`/dividend/delete/${id}`);
      setList((prev) => prev.filter((item) => item._id !== id));
      setFilteredList((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // ================= VIEW =================
  const handleView = () => {
    setViewLoading(true);

    setTimeout(() => {
      const filtered = list.filter((item) => {
        const d = new Date(item.recordDate).toISOString().split("T")[0];
        return d >= fromDate && d <= toDate;
      });

      setFilteredList(filtered);
      setShowReport(true);
      setViewLoading(false);
    }, 300);
  };

  // ================= RESET =================
  const handleReset = () => {
    setResetLoading(true);

    setTimeout(() => {
      const { fromDate: fyFromDate, toDate: fyToDate } = getFinancialYearDates();
      setFromDate(fyFromDate);
      setToDate(fyToDate);
      setFilteredList(list);
      setShowReport(false);
      setResetLoading(false);
    }, 300);
  };

  // ================= EXPORT =================
  const handleExport = async () => {
    if (exportLoading) return;

    try {
      await DividendExport({
        filteredList,
        list,
        setExportLoading,
      });
    } catch (err) {
      alert(err?.message || "Export failed");
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-4">Dividend</h1>

        {/* ================= FORM ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-gray-900 p-4 rounded">
          <div>
            <label
              htmlFor="declarationDate"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="recordDate"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="companyName"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="shares"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="dividendPercent"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="faceValue"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="perShareDividend"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="grossDividend"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="taxPercent"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="taxAmount"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="netDividend"
              className="block text-sm text-gray-300 mb-1"
            >
              11. Net Dividend
            </label>
            <input
              id="netDividend"
              name="netDividend"
              placeholder="Net Dividend"
              value={form.netDividend}
              readOnly
              className={inputClass("netDividend")}
            />
          </div>

          <div>
            <label
              htmlFor="bankPaymentDate"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="costPerShare"
              className="block text-sm text-gray-300 mb-1"
            >
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
            <label
              htmlFor="dividendPer100tk"
              className="block text-sm text-gray-300 mb-1"
            >
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
        </div>

        {/* SAVE */}
        <div className="flex flex-col gap-2 md:flex-row">
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

        {/* ================= FILTER ================= */}
        <div className="mt-4 bg-gray-900 p-4 rounded space-y-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 bg-gray-800 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleView}
              disabled={viewLoading}
              className="bg-blue-600 p-2 rounded w-full disabled:opacity-60"
            >
              {viewLoading ? "Loading..." : "View"}
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="bg-green-600 p-2 rounded w-full disabled:opacity-60"
            >
              {exportLoading ? "Exporting..." : "Export"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-gray-600 p-2 rounded w-full disabled:opacity-60"
            >
              {resetLoading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>

        {showReport && (
          <div className="mt-4 overflow-x-auto bg-gray-900 p-4 rounded border border-gray-800">
            <h2 className="text-xl font-semibold mb-3">Dividend Report</h2>
            {filteredList.length === 0 ? (
              <p className="text-gray-400">
                No dividend records found for the selected date range.
              </p>
            ) : (
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-800 text-gray-200">
                  <tr>
                    <th className="p-2 border border-gray-700">
                      Declaration Date
                    </th>
                    <th className="p-2 border border-gray-700">Record Date</th>
                    <th className="p-2 border border-gray-700">Company</th>
                    <th className="p-2 border border-gray-700">Shares</th>
                    <th className="p-2 border border-gray-700">Dividend %</th>
                    <th className="p-2 border border-gray-700">Face Value</th>
                    <th className="p-2 border border-gray-700">
                      Per Share Dividend
                    </th>
                    <th className="p-2 border border-gray-700">
                      Gross Dividend
                    </th>
                    <th className="p-2 border border-gray-700">Tax %</th>
                    <th className="p-2 border border-gray-700">Tax Amount</th>
                    <th className="p-2 border border-gray-700">Net Dividend</th>
                    <th className="p-2 border border-gray-700">
                      Bank Payment Date
                    </th>
                    <th className="p-2 border border-gray-700">Cost/Share</th>
                    <th className="p-2 border border-gray-700">
                      Dividend per 100 tk
                    </th>
                    <th className="p-2 border border-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => (
                    <tr
                      key={item._id}
                      className="odd:bg-gray-950 even:bg-gray-900"
                    >
                      <td className="p-2 border border-gray-700">
                        {item.declarationDate
                          ? new Date(item.declarationDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.recordDate
                          ? new Date(item.recordDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.companyName || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.shares || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.dividendPercent || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.faceValue || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.perShareDividend || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.grossDividend || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.taxPercent || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.taxAmount || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.netDividend || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.bankPaymentDate
                          ? new Date(item.bankPaymentDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.costPerShare || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        {item.dividendPer100tk || "-"}
                      </td>
                      <td className="p-2 border border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dividend;
