import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useConfirm, useAlert } from "../components/ConfirmProvider";

const UserManager = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const alert = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const payload = response?.data;
      const usersList =
        payload?.data ||
        payload?.users ||
        (Array.isArray(payload) ? payload : []);
      setUsers(usersList);
    } catch (error) {
      console.error(error);
      await alert(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    const confirmed = await confirm(
      `Set ${user.name} ${user.isActive ? "inactive" : "active"}?`,
    );
    if (!confirmed) return;

    try {
      setActionLoading(user._id);
      const response = await api.put(`/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, isActive: response.data.data.isActive }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
      await alert(
        error.response?.data?.message || "Unable to update user status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = await confirm(`Delete user ${user.name}?`);
    if (!confirmed) return;

    try {
      setActionLoading(user._id);
      await api.delete(`/users/${user._id}`);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
    } catch (error) {
      console.error(error);
      await alert(error.response?.data?.message || "Unable to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const getCreatedDate = (user) => {
    if (user?.createdAt) return new Date(user.createdAt);
    if (user?.updatedAt) return new Date(user.updatedAt);

    if (user?._id) {
      try {
        const hex = user._id.toString().substring(0, 8);
        const timestamp = parseInt(hex, 16) * 1000;
        return new Date(timestamp);
      } catch (err) {
        return null;
      }
    }

    return null;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">User Manager</h1>
            <p className="mt-2 text-slate-400">
              View all registered users and manage active status or delete
              accounts.
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="rounded-2xl border border-slate-600 bg-slate-900 px-5 py-3 text-sm font-semibold hover:border-white transition"
          >
            Back to Login
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950 text-left text-sm uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-4">Full Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Registered</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No registered users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id || user.email}
                    className="hover:bg-slate-950 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-slate-100">
                      {user.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-200 break-all">
                      {user.email || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {formatDate(getCreatedDate(user))}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-600 text-emerald-100"
                            : "bg-rose-600 text-rose-100"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          disabled={actionLoading === user._id}
                          onClick={() => handleToggleActive(user)}
                          className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:border-white transition disabled:opacity-50"
                        >
                          {actionLoading === user._id
                            ? "..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          disabled={actionLoading === user._id}
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-2xl border border-rose-500 bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
