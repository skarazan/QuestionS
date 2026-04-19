"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RENTAL_PLANS } from "@/lib/rentalPlans";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysLeft(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / 86400_000);
}

export default function SubscriptionsManager() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState("1mo");
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/subscriptions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSubs(data.subscriptions);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    // Fetch-on-mount + refetch when filters change. setState inside is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleGrant(e) {
    e.preventDefault();
    if (!grantEmail) return;
    setGranting(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: grantEmail, plan: grantPlan }),
    });
    if (res.ok) {
      toast.success(`Subscription granted to ${grantEmail}`);
      setGrantEmail("");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to grant subscription");
    }
    setGranting(false);
  }

  async function handleRevoke(userId, email) {
    if (!confirm(`Revoke subscription for ${email}?`)) return;
    const res = await fetch(`/api/admin/subscriptions/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Subscription revoked");
      load();
    } else {
      toast.error("Failed to revoke");
    }
  }

  const pageSize = 50;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Grant form */}
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-5">
        <h2 className="text-white font-semibold mb-3">Grant Subscription</h2>
        <form onSubmit={handleGrant} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-slate-300 text-xs">User email</Label>
            <Input
              type="email"
              required
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="student@example.com"
              className="mt-1 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Plan</Label>
            <select
              value={grantPlan}
              onChange={(e) => setGrantPlan(e.target.value)}
              className="mt-1 bg-slate-800 border border-slate-600 rounded-md text-white px-3 py-2 text-sm"
            >
              {RENTAL_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            disabled={granting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {granting ? "Granting..." : "Grant"}
          </Button>
        </form>
        <p className="text-slate-500 text-xs mt-2">
          Extending an active subscription stacks on top of remaining days.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label className="text-slate-300 text-xs">Search</Label>
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="email or name"
            className="mt-1 bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300 text-xs">Status</Label>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="mt-1 bg-slate-800 border border-slate-600 rounded-md text-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Granted</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subs.map((s) => {
                const remaining = daysLeft(s.expiresAt);
                const active = remaining > 0;
                return (
                  <tr
                    key={s.id}
                    className="border-t border-slate-700 text-slate-200"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.user.email}</div>
                      {s.user.name && (
                        <div className="text-slate-500 text-xs">{s.user.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{s.plan}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(s.grantedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(s.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      {active ? (
                        <span className="text-emerald-400">
                          Active · {remaining}d left
                        </span>
                      ) : (
                        <span className="text-slate-500">Expired</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRevoke(s.user.id, s.user.email)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-between items-center text-sm text-slate-400">
          <div>
            {total} total · page {page}/{pages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-slate-600 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-slate-600 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
