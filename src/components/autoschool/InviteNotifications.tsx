"use client";

/**
 * InviteNotifications — shows pending autoschool invites for an instructor.
 *
 * Usage:
 *   import InviteNotifications from "@/components/autoschool/InviteNotifications";
 *   <InviteNotifications />
 *
 * Fetches GET /api/me/autoschool-invites and renders each pending invite
 * with Accept / Decline buttons. Shows nothing if there are no pending invites.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface Invite {
  id: string;
  autoschool_id: string;
  autoschool_name: string;
  autoschool_city?: string | null;
  autoschool_logo_url?: string | null;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function InviteNotifications() {
  const { getToken, isSignedIn } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null); // invite id being responded to

  const fetchInvites = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/me/autoschool-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setInvites(await res.json());
    } catch {
      // Silently ignore — not critical UI
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  async function respond(inviteId: string, accept: boolean) {
    setResponding(inviteId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/me/autoschool-invites/${inviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) {
        // Remove the responded invite from the list
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch {
      // Silently ignore
    } finally {
      setResponding(null);
    }
  }

  if (!isSignedIn || loading || invites.length === 0) return null;

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm"
        >
          {/* School logo or placeholder */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
            {invite.autoschool_logo_url ? (
              <img src={invite.autoschool_logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🏫</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{invite.autoschool_name}</p>
            {invite.autoschool_city && (
              <p className="text-xs text-gray-400 mt-0.5">{invite.autoschool_city}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              Invited {new Date(invite.invited_at).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => respond(invite.id, false)}
              disabled={responding === invite.id}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => respond(invite.id, true)}
              disabled={responding === invite.id}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F03D3D] text-white hover:bg-[#d93333] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {responding === invite.id ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
