"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

const SubAdminsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // adminId being acted on

  // Transfer super admin state
  const [transferTarget, setTransferTarget] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // Guard: super_admin only
  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    if (status === "authenticated" && session?.user?.role !== "super_admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/approve");
      setAdmins(res.data.admins || []);
    } catch {
      toast.error("Failed to load sub-admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "super_admin") {
      fetchAdmins();
    }
  }, [status, session]);

  const handleAction = async (adminId, action, username) => {
    setActionLoading(adminId + action);
    try {
      const res = await axios.patch("/api/admin/approve", { adminId, action });
      toast.success(res.data.message);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (adminId, username) => {
    if (!confirm(`Permanently delete ${username}? This cannot be undone.`)) return;
    setActionLoading(adminId + "delete");
    try {
      const res = await axios.delete(`/api/admin/approve?adminId=${adminId}`);
      toast.success(res.data.message);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) {
      toast.error("Please select an admin to transfer the role to.");
      return;
    }
    setTransferring(true);
    try {
      const res = await axios.post("/api/admin/transfer-superadmin", {
        targetAdminId: transferTarget,
      });
      toast.success(res.data.message);
      setShowConfirm(false);
      // Force logout since the current user is no longer super_admin
      setTimeout(() => {
        window.location.href = "/api/auth/signout?callbackUrl=/admin/login";
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed.");
    } finally {
      setTransferring(false);
    }
  };

  const pendingAdmins = admins.filter((a) => !a.isApproved);
  const approvedAdmins = admins.filter((a) => a.isApproved);

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sub-Admin Management</h1>

      {/* ── Pending Approval ─────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-white text-xs font-bold">
            {pendingAdmins.length}
          </span>
          Pending Approval
        </h2>

        {pendingAdmins.length === 0 ? (
          <p className="text-gray-500 text-sm bg-gray-50 rounded-xl p-4">No pending registrations.</p>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y">
            {pendingAdmins.map((admin) => (
              <div key={admin._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{admin.username}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registered: {new Date(admin.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(admin._id, "approve", admin.username)}
                    disabled={!!actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === admin._id + "approve" ? "Approving..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleDelete(admin._id, admin.username)}
                    disabled={!!actionLoading}
                    className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === admin._id + "delete" ? "Deleting..." : "✕ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Approved Sub-Admins ───────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Approved Sub-Admins</h2>

        {approvedAdmins.length === 0 ? (
          <p className="text-gray-500 text-sm bg-gray-50 rounded-xl p-4">No approved sub-admins yet.</p>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y">
            {approvedAdmins.map((admin) => (
              <div key={admin._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{admin.username}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Approved · Since {new Date(admin.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(admin._id, "revoke", admin.username)}
                    disabled={!!actionLoading}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === admin._id + "revoke" ? "Revoking..." : "⊘ Revoke Access"}
                  </button>
                  <button
                    onClick={() => handleDelete(admin._id, admin.username)}
                    disabled={!!actionLoading}
                    className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === admin._id + "delete" ? "Deleting..." : "🗑 Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Transfer Super Admin Role ─────────────────── */}
      <section className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-1 flex items-center gap-2">
          ⚠ Transfer Super Admin Role
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Transfer your super admin privileges to an approved sub-admin. You will immediately lose super admin access after confirming.
        </p>

        {approvedAdmins.length === 0 ? (
          <p className="text-sm text-gray-500">No approved sub-admins to transfer to. Approve an admin first.</p>
        ) : (
          <>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full border-2 border-red-300 focus:border-red-600 rounded-xl px-4 py-3 outline-none mb-4 bg-white text-gray-800"
            >
              <option value="">— Select an admin to promote —</option>
              {approvedAdmins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.username} ({a.email})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!transferTarget}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Transfer Super Admin Role
            </button>
          </>
        )}

        {/* Confirm Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Are you absolutely sure?</h3>
              <p className="text-gray-600 mb-6 text-sm">
                You will <strong>permanently lose super admin access</strong> and be downgraded to a regular admin. This action is instant.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferring}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {transferring ? "Transferring..." : "Yes, Transfer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SubAdminsPage;
