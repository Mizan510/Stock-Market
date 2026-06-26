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
  
  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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
      await alert(
        `User ${user.isActive ? "deactivated" : "activated"} successfully!`,
        "success"
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
      await alert("User deleted successfully!", "success");
    } catch (error) {
      console.error(error);
      await alert(error.response?.data?.message || "Unable to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setEditLoading(false);
    setPasswordError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password if provided
    if (editFormData.password) {
      if (editFormData.password.length < 6) {
        setPasswordError("Password must be at least 6 characters long!");
        return;
      }
      if (editFormData.password !== editFormData.confirmPassword) {
        setPasswordError("Passwords do not match!");
        return;
      }
    }

    try {
      setEditLoading(true);
      
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
      };
      
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      
      console.log("Sending update request:", updateData);
      console.log("User ID:", editingUser._id);
      
      const response = await api.put(`/users/${editingUser._id}`, updateData);
      
      console.log("Update response:", response.data);
      
      setUsers((prev) =>
        prev.map((item) =>
          item._id === editingUser._id
            ? { ...item, ...response.data.data }
            : item,
        ),
      );
      
      await alert("User updated successfully!", "success");
      handleCloseModal();
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response);
      const message = error.response?.data?.message || "Unable to update user";
      await alert(message);
    } finally {
      setEditLoading(false);
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
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
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
                      <div className="flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
                        <button
                          disabled={actionLoading === user._id}
                          onClick={() => handleEditUser(user)}
                          className="rounded-2xl border border-blue-600 bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition disabled:opacity-50 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          disabled={actionLoading === user._id}
                          onClick={() => handleToggleActive(user)}
                          className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:border-white transition disabled:opacity-50 whitespace-nowrap"
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
                          className="rounded-2xl border border-rose-500 bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50 whitespace-nowrap"
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

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                Edit User: {editingUser?.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Update user information. Leave password fields empty to keep current password.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                  <span className="text-slate-500 text-xs ml-2">
                    (leave blank to keep current)
                  </span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Confirm Password Field */}
              {editFormData.password && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={editFormData.confirmPassword}
                    onChange={handleEditChange}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Password Error */}
              {passwordError && (
                <div className="bg-rose-950/30 border border-rose-800/50 rounded-lg p-3">
                  <p className="text-rose-400 text-sm flex items-center gap-2">
                    <span>⚠️</span> {passwordError}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={editLoading}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;