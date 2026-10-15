"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { Card, CardContent } from "@/components/ui/Card.jsx";

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_REVELACODE_URL || import.meta.env.VITE_BACKEND_URL || "https://revelacode-backend.onrender.com").replace(/\/+$/, "").replace(/\/api$/i, "");

export default function AdminTeamManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [form, setForm] = useState({ full_name: "", contact: "", role: "support", password: "" });

  const loadUsers = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      const response = await fetch(`${API}/api/admin/list-users`, {
        method: "GET",
        headers: { Accept: "application/json", "X-API-KEY": user?.apiKey || "" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to load users (HTTP ${response.status}).`);
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error("Admin user list failed:", error);
      setMessageType("error");
      setMessage(error?.message || "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.apiKey]);

  useEffect(() => { if (user?.apiKey) loadUsers(); }, [user?.apiKey, loadUsers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createUser(event) {
    event.preventDefault();
    if (creating) return;
    if (!form.full_name.trim() || !form.contact.trim()) {
      setMessageType("error"); setMessage("Please enter the user's full name and contact."); return;
    }
    if (form.role === "support" && form.password.length < 12) {
      setMessageType("error"); setMessage("Support accounts need an initial password of at least 12 characters."); return;
    }

    try {
      setCreating(true); setMessage("");
      const payload = { full_name: form.full_name.trim(), contact: form.contact.trim(), role: form.role };
      if (form.role === "support") payload.password = form.password;
      const response = await fetch(`${API}/api/admin/manage-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-API-KEY": user?.apiKey || "" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to create account (HTTP ${response.status}).`);
      setMessageType("success");
      setMessage(data.message || "Account created successfully.");
      setForm({ full_name: "", contact: "", role: "support", password: "" });
      await loadUsers(true);
    } catch (error) {
      console.error("Admin user creation failed:", error);
      setMessageType("error");
      setMessage(error?.message || "Unable to create account.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Platform access</p><h2 className="mt-1 text-2xl font-bold text-slate-950">User management</h2><p className="mt-1 text-sm text-slate-600">Provision support agents and review current account status.</p></div><Button variant="outline" onClick={() => loadUsers(true)} disabled={loading || refreshing} className="inline-flex min-h-10 items-center gap-2"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh users</Button></div>

      {message && <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{messageType === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}{message}</div>}

      <Card><CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><UserPlus size={21} /></div><div><h3 className="font-bold text-slate-900">Create a platform account</h3><p className="mt-1 text-sm text-slate-600">Support accounts receive access to ticket operations after an administrator provisions them.</p></div></div>
        <form onSubmit={createUser} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</span><input required autoComplete="name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} placeholder="Support agent name" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Account contact</span><input required autoComplete="username" value={form.contact} onChange={(event) => updateField("contact", event.target.value)} placeholder="Email address or registered contact" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Account role</span><select value={form.role} onChange={(event) => { updateField("role", event.target.value); if (event.target.value !== "support") updateField("password", ""); }} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"><option value="support">Support</option><option value="user">Standard user</option></select></label>
          {form.role === "support" && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Initial password</span><input required minLength={12} type="password" autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="At least 12 characters" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /><span className="mt-1.5 block text-xs leading-5 text-slate-500">The backend stores a password hash. Share the initial password with the agent through a separate secure channel.</span></label>}
          <div className="md:col-span-2"><Button type="submit" disabled={creating} className="inline-flex min-h-11 w-full items-center justify-center gap-2 sm:w-auto"><UserPlus size={17} />{creating ? "Creating account…" : "Create account"}</Button></div>
        </form>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Users size={20} /></div><div><h3 className="font-bold text-slate-900">Registered accounts</h3><p className="mt-1 text-sm text-slate-500">Account status returned by the backend.</p></div></div>
        {loading ? <div className="space-y-3 p-5"><div className="h-14 animate-pulse rounded-xl bg-slate-100" /><div className="h-14 animate-pulse rounded-xl bg-slate-100" /></div> : users.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">No user accounts were returned.</div> : <div className="divide-y divide-slate-100">{users.map((item, index) => <div key={item.contact || item.id || index} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.full_name || "Unnamed user"}</p><p className="mt-1 break-words text-sm text-slate-600">{item.contact || "No contact"}</p><p className="mt-1 text-xs text-slate-400">Created: {item.created_at || "Not provided"}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{item.role || "unknown"}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{item.verified ? "Verified" : "Not verified"}</span>{item.status && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">{item.status}</span>}</div></div>)}</div>}
      </CardContent></Card>
    </div>
  );
}
