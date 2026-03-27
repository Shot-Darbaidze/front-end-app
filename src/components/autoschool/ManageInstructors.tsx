"use client";

/**
 * ManageInstructors — Admin view to manage school instructors.
 *
 * Features:
 * - Lists all instructors with their status, rating, and transmission
 * - "Remove" button per instructor to kick them from the school
 * - Handles the 400 error (upcoming booked lessons) with a clear toast
 * - Invite-by-ID form at the bottom
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";

interface Instructor {
  id: string;
  instructor_id: string;
  title: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  rating?: number | null;
  transmission?: string | null;
  city_price?: number | null;
  yard_price?: number | null;
  instructor_type: string;
}

interface AdminInvite {
  id: string;
  autoschool_id: string;
  invited_first_name?: string | null;
  invited_last_name?: string | null;
  invited_email?: string | null;
  invited_mobile_number?: string | null;
  invited_image_url?: string | null;
  invited_name?: string | null;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  responded_at?: string | null;
}

const API_BASE = API_CONFIG.BASE_URL;

interface Props {
  schoolId: string;
}

export default function ManageInstructors({ schoolId }: Props) {
  const { getToken } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [kicking, setKicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<AdminInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [withdrawingInviteId, setWithdrawingInviteId] = useState<string | null>(null);

  async function readApiError(res: Response, fallback: string): Promise<string> {
    try {
      const data = await res.json();
      return data?.detail || data?.error || data?.message || fallback;
    } catch {
      try {
        const text = await res.text();
        return text || fallback;
      } catch {
        return fallback;
      }
    }
  }

  const fetchInstructors = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/instructors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to load instructors."));
        return;
      }
      setInstructors(await res.json());
    } catch {
      setError("Network error while loading instructors.");
    } finally {
      setLoading(false);
    }
  }, [getToken, schoolId]);

  const fetchSentInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invites?include_responded=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to load sent invites."));
        return;
      }
      setSentInvites(await res.json());
    } catch {
      setError("Network error while loading sent invites.");
    } finally {
      setLoadingInvites(false);
    }
  }, [getToken, schoolId]);

  useEffect(() => {
    fetchInstructors();
    fetchSentInvites();
  }, [fetchInstructors, fetchSentInvites]);

  async function handleKick(postId: string) {
    if (!confirm("Are you sure you want to remove this instructor? This cannot be undone.")) return;
    setKicking(postId);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/instructors/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to remove instructor."));
        return;
      }
      setInstructors((prev) => prev.filter((i) => i.id !== postId));
      setInviteSuccess("Instructor removed successfully.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setKicking(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const identifier = inviteId.trim();
    if (!identifier) return;

    if (identifier.length < 3) {
      setError("Enter a valid email or phone number.");
      return;
    }

    setInviting(true);
    setError(null);
    setInviteSuccess(null);
    try {
      const token = await getToken();
      const encoded = encodeURIComponent(identifier);
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invite/${encoded}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to send invite."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setInviteSuccess(data?.id ? `Invite sent successfully. Invite ID: ${data.id}` : "Invite sent successfully.");
      setInviteId("");
      await fetchSentInvites();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleWithdrawInvite(inviteId: string) {
    if (!confirm("Withdraw this pending invite?")) return;
    setWithdrawingInviteId(inviteId);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invites/${inviteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to withdraw invite."));
        return;
      }
      setInviteSuccess("Invite withdrawn successfully.");
      setSentInvites((prev) => prev.map((i) => (i.id === inviteId ? { ...i, status: "declined" } : i)));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setWithdrawingInviteId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="animate-pulse text-sm text-gray-400">Loading instructors…</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h3 className="text-base font-bold text-gray-900">Manage Instructors</h3>
          <p className="text-xs text-slate-500 mt-0.5">Invite by email or phone. Errors show exact failure reason.</p>
        </div>
        <span className="text-xs text-gray-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
          {instructors.length} total
        </span>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success toast */}
      {inviteSuccess && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {inviteSuccess}
        </div>
      )}

      {/* Instructor list */}
      <div className="divide-y divide-slate-100">
        {instructors.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="text-sm font-medium text-slate-600">No instructors yet</div>
            <div className="text-xs text-slate-400 mt-1">Send your first invite from the panel below.</div>
          </div>
        ) : (
          instructors.map((inst) => {
            const name = [inst.first_name, inst.last_name].filter(Boolean).join(" ") || inst.title;
            const price = inst.city_price ?? inst.yard_price;
            return (
              <div key={inst.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                  {inst.image_url ? (
                    <img src={inst.image_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-red-400">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    {inst.rating != null && (
                      <span className="flex items-center gap-0.5">
                        <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                        </svg>
                        {Number(inst.rating).toFixed(1)}
                      </span>
                    )}
                    {inst.transmission && <span>{inst.transmission}</span>}
                    {price != null && <span>₾{Number(price)}</span>}
                  </div>
                </div>

                {/* Status badge */}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">
                  {inst.instructor_type}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => handleKick(inst.id)}
                  disabled={kicking === inst.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  title="Remove instructor from school"
                >
                  {kicking === inst.id ? (
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                  )}
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sent invites */}
      <div className="px-6 py-5 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-800">Sent Invites</h4>
          <span className="text-xs text-slate-500">{sentInvites.length} total</span>
        </div>

        {loadingInvites ? (
          <p className="text-sm text-slate-400">Loading invites...</p>
        ) : sentInvites.length === 0 ? (
          <p className="text-sm text-slate-400">No invites sent yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sentInvites.map((invite) => {
              const label = invite.invited_name || invite.invited_email || invite.invited_mobile_number || "Unknown user";
              const isPending = invite.status === "pending";
              const firstName = invite.invited_first_name || "-";
              const lastName = invite.invited_last_name || "-";
              const email = invite.invited_email || "-";
              const mobile = invite.invited_mobile_number || "-";
              return (
                <div key={invite.id} className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                          {invite.invited_image_url ? (
                            <img src={invite.invited_image_url} alt={label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">
                              {label.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600">
                            <span><strong>Name:</strong> {firstName}</span>
                            <span><strong>Surname:</strong> {lastName}</span>
                            <span className="truncate"><strong>Email:</strong> {email}</span>
                            <span><strong>Phone:</strong> {mobile}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Sent {new Date(invite.invited_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      invite.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : invite.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                    }`}>
                      {invite.status}
                    </span>
                  </div>

                  {isPending && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleWithdrawInvite(invite.id)}
                        disabled={withdrawingInviteId === invite.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {withdrawingInviteId === invite.id ? "Withdrawing..." : "Withdraw Invite"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/60">
        <form onSubmit={handleInvite} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Invite Instructor
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              placeholder="Email or phone number"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-white"
            />
            <button
              type="submit"
              disabled={inviting || !inviteId.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#F03D3D] hover:bg-[#d93333] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-28"
            >
              {inviting ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Invite
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Only registered users can be invited via email or phone. Users with an existing instructor profile cannot be invited again.
          </p>
        </form>
      </div>
    </div>
  );
}
