"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import { Pencil, X, Check, ChevronUp } from "lucide-react";

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
  status: string;
  has_upcoming_lessons?: boolean;
  /** NULL = admin has not enabled any mode — instructor is NOT bookable.
   *  "city" | "yard" | "both" = explicitly enabled by admin. */
  allowed_modes: "city" | "yard" | "both" | null;
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

interface EditState {
  status: "active" | "inactive";
  allowed_modes: "city" | "yard" | "both" | null;
}

const API_BASE = API_CONFIG.BASE_URL;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes — same as student dashboard

// ── cache helpers ────────────────────────────────────────────────────────────

function cacheKey(schoolId: string, kind: "instructors" | "invites") {
  return `autoschool-manage-${kind}-v2:${schoolId}`;
}

function readCache<T>(schoolId: string, kind: "instructors" | "invites"): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(schoolId, kind));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(cacheKey(schoolId, kind)); return null; }
    return data;
  } catch { return null; }
}

function writeCache<T>(schoolId: string, kind: "instructors" | "invites", data: T) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(cacheKey(schoolId, kind), JSON.stringify({ data, ts: Date.now() })); } catch { /* storage full */ }
}

function bustCache(schoolId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(cacheKey(schoolId, "instructors"));
  sessionStorage.removeItem(cacheKey(schoolId, "invites"));
}

function buildEditState(inst: Instructor): EditState {
  return {
    status: inst.status === "active" ? "active" : "inactive",
    allowed_modes: inst.allowed_modes ?? null,  // null = no mode granted yet = not bookable
  };
}

interface Props {
  schoolId: string;
}

export default function ManageInstructors({ schoolId }: Props) {
  const { getToken } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [kicking, setKicking] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<AdminInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [withdrawingInviteId, setWithdrawingInviteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  async function readApiError(res: Response, fallback: string): Promise<string> {
    try {
      const data = await res.json();
      return data?.detail || data?.error || data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  const fetchInstructors = useCallback(async (isRevalidation = false) => {
    // Apply cache immediately on first load (stale-while-revalidate)
    if (!isRevalidation) {
      const cached = readCache<Instructor[]>(schoolId, "instructors");
      if (cached) { setInstructors(cached); setLoading(false); }
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/instructors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to load instructors.")); return; }
      const data: Instructor[] = await res.json();
      setInstructors(data);
      writeCache(schoolId, "instructors", data);
    } catch {
      setError("Network error while loading instructors.");
    } finally {
      setLoading(false);
    }
  }, [getToken, schoolId]);

  const fetchSentInvites = useCallback(async (isRevalidation = false) => {
    if (!isRevalidation) {
      const cached = readCache<AdminInvite[]>(schoolId, "invites");
      if (cached) { setSentInvites(cached); setLoadingInvites(false); }
    }
    setLoadingInvites(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invites?include_responded=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to load sent invites.")); return; }
      const data: AdminInvite[] = await res.json();
      setSentInvites(data);
      writeCache(schoolId, "invites", data);
    } catch {
      setError("Network error while loading sent invites.");
    } finally {
      setLoadingInvites(false);
    }
  }, [getToken, schoolId]);

  useEffect(() => { fetchInstructors(); fetchSentInvites(); }, [fetchInstructors, fetchSentInvites]);

  function openEdit(inst: Instructor) {
    setEditingId(inst.id);
    setEditState(buildEditState(inst));
  }

  function closeEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function handleSaveEdit(inst: Instructor) {
    if (!editState) return;
    setSaving(inst.id);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/instructors/${inst.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: editState.status, allowed_modes: editState.allowed_modes }),
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to update instructor.")); return; }
      const updated: Instructor = await res.json();
      setInstructors((prev) => {
        const next = prev.map((i) => (i.id === inst.id ? updated : i));
        writeCache(schoolId, "instructors", next);
        return next;
      });
      setInviteSuccess("Instructor updated successfully.");
      closeEdit();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  async function handleKick(inst: Instructor) {
    if (inst.has_upcoming_lessons) {
      setError("This instructor cannot be removed while they still have upcoming lessons.");
      return;
    }
    if (!confirm("Are you sure you want to remove this instructor? This cannot be undone.")) return;
    setKicking(inst.id);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/instructors/${inst.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to remove instructor.")); return; }
      setInstructors((prev) => {
        const next = prev.filter((i) => i.id !== inst.id);
        bustCache(schoolId); // full bust — invites may also change
        return next;
      });
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
    if (!identifier || identifier.length < 3) { setError("Enter a valid email or phone number."); return; }
    setInviting(true);
    setError(null);
    setInviteSuccess(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invite/${encodeURIComponent(identifier)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to send invite.")); return; }
      const data = await res.json().catch(() => ({}));
      setInviteSuccess(data?.id ? `Invite sent successfully. Invite ID: ${data.id}` : "Invite sent successfully.");
      setInviteId("");
      bustCache(schoolId); // new invite — bust so next navigation re-fetches
      await fetchSentInvites(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleWithdrawInvite(id: string) {
    if (!confirm("Withdraw this pending invite?")) return;
    setWithdrawingInviteId(id);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/invites/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(await readApiError(res, "Failed to withdraw invite.")); return; }
      setInviteSuccess("Invite withdrawn successfully.");
      setSentInvites((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, status: "declined" as const } : i));
        writeCache(schoolId, "invites", next);
        return next;
      });
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
          <p className="text-xs text-slate-500 mt-0.5">Toggle status or remove instructors. Prices are managed in the Pricing tab.</p>
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
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success toast */}
      {inviteSuccess && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
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
            const isEditing = editingId === inst.id;
            const es = isEditing ? editState : null;

            return (
              <div key={inst.id} className="transition-colors">
                {/* Row */}
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                    {inst.image_url ? (
                      <img src={inst.image_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-red-400">{name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5 text-xs text-gray-400">
                      {inst.rating != null && (
                        <span className="flex items-center gap-0.5">
                          <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
                          </svg>
                          {Number(inst.rating).toFixed(1)}
                        </span>
                      )}
                      {inst.transmission && <span>{inst.transmission}</span>}
                      {inst.has_upcoming_lessons && <span className="font-medium text-amber-600">Upcoming lessons</span>}
                      {/* Read-only prices from school level */}
                      {inst.city_price != null && <span>City ₾{Number(inst.city_price)}</span>}
                      {inst.yard_price != null && <span>Yard ₾{Number(inst.yard_price)}</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    inst.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {inst.status}
                  </span>

                  {/* Mode badge — red 'Not bookable' when null, coloured when enabled */}
                  {inst.allowed_modes ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inst.allowed_modes === "both"
                        ? "bg-blue-50 text-blue-600"
                        : inst.allowed_modes === "city"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {inst.allowed_modes === "both" ? "City + Yard" : inst.allowed_modes === "city" ? "City only" : "Yard only"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      Not bookable
                    </span>
                  )}
                  {/* Edit button */}
                  <button
                    onClick={() => isEditing ? closeEdit() : openEdit(inst)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      isEditing
                        ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    {isEditing ? "Close" : "Edit"}
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => handleKick(inst)}
                    disabled={kicking === inst.id || !!inst.has_upcoming_lessons}
                    title={inst.has_upcoming_lessons ? "Cannot remove instructors with upcoming lessons." : undefined}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                    {inst.has_upcoming_lessons ? "Has upcoming lessons" : "Remove"}
                  </button>
                </div>

                {/* ── Inline edit panel — status only ── */}
                {isEditing && es && (
                  <div className="mx-4 mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    {/* Status toggle */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Status</p>
                      <div className="flex gap-2">
                        {(["active", "inactive"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setEditState((prev) => prev ? { ...prev, status: s } : prev)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                              es.status === s
                                ? s === "active"
                                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                  : "bg-slate-500 text-white border-slate-500 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                  {/* ── Mode selector ── */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Allowed Mode</p>
                      <p className="text-xs text-slate-400 mb-2">
                        Select which lesson type(s) this instructor may offer.
                        {" "}<span className="text-red-400 font-medium">No mode = not bookable.</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {/* Explicit null — disables bookings */}
                        <button
                          onClick={() => setEditState((prev) => prev ? { ...prev, allowed_modes: null } : prev)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                            es.allowed_modes === null
                              ? "bg-red-500 text-white border-red-500 shadow-sm"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          None
                        </button>
                        {([
                          { value: "city",  label: "City only" },
                          { value: "yard",  label: "Yard only" },
                          { value: "both",  label: "City + Yard" },
                        ] as const).map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => setEditState((prev) => prev ? { ...prev, allowed_modes: value } : prev)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                              es.allowed_modes === value
                                ? value === "city"
                                  ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                                  : value === "yard"
                                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                  : "bg-blue-500 text-white border-blue-500 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note about pricing */}
                    <p className="text-xs text-slate-400">
                      Prices are set school-wide in the <span className="font-semibold text-slate-600">Pricing</span> tab.
                    </p>

                    {/* Save / Cancel */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(inst)}
                        disabled={saving === inst.id}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        {saving === inst.id ? (
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        {saving === inst.id ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        onClick={closeEdit}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
              return (
                <div key={invite.id} className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                          {invite.invited_image_url ? (
                            <img src={invite.invited_image_url} alt={label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">{label.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600">
                            <span><strong>Name:</strong> {invite.invited_first_name || "-"}</span>
                            <span><strong>Surname:</strong> {invite.invited_last_name || "-"}</span>
                            <span className="truncate"><strong>Email:</strong> {invite.invited_email || "-"}</span>
                            <span><strong>Phone:</strong> {invite.invited_mobile_number || "-"}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Sent {new Date(invite.invited_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      invite.status === "pending" ? "bg-amber-100 text-amber-700"
                      : invite.status === "accepted" ? "bg-emerald-100 text-emerald-700"
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
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Invite Instructor</label>
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
          <p className="text-xs text-slate-500">Only registered users can be invited via email or phone.</p>
        </form>
      </div>
    </div>
  );
}
