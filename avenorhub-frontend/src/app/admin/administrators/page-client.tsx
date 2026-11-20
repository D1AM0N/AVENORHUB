"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { AdminOverview, createAdminUser, getAdminOverview, getStoredSession } from "@/lib/api";

const field = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#202124]";

export default function AdministratorsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [token, setToken] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async (activeToken: string) => {
    setOverview(await getAdminOverview(activeToken));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || session.user.role !== "super_admin") {
        setError("Sign in as Super Admin to manage platform administrators.");
        return;
      }
      setToken(session.token);
      refresh(session.token).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load administrators."));
    });
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createAdminUser({ ...form, role: "super_admin" }, token);
      setForm({ name: "", email: "", password: "" });
      setOpen(false);
      await refresh(token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create administrator.");
    } finally {
      setSaving(false);
    }
  }

  const admins = overview?.users.filter((user) => user.role === "super_admin") ?? [];
  return <div className="flex min-h-screen bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white"><AdminSidebar /><main className="flex-1 space-y-5 p-6">
    <header className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Administrators</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live Super Admin accounts and sign-in security.</p></div><button onClick={() => setOpen(true)} className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add Admin</button></header>
    {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
    <section className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]"><table className="w-full text-left text-sm"><thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Name", "Role", "2FA Enabled", "Last Login IP"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">{admins.map((admin) => <tr key={admin.id}><td className="px-5 py-3 font-medium">{admin.name}<span className="block text-xs text-gray-500">{admin.email}</span></td><td className="px-5 py-3">Super Admin</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${admin.twoFactorEnabled ? "bg-[#0F766E]/10 text-[#0F766E]" : "bg-gray-100 text-gray-500"}`}>{admin.twoFactorEnabled ? "Enabled" : "Not enabled"}</span></td><td className="px-5 py-3 font-mono text-xs">{admin.lastLoginIp ?? "—"}</td></tr>)}{overview && admins.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">No platform administrators.</td></tr>}</tbody></table></section>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 dark:bg-[#202124]"><div className="flex justify-between"><h2 className="font-semibold">Add Admin</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div><input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={field} /><input required type="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={field} /><input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={field} /><button disabled={saving} className="w-full rounded-lg bg-[#0F766E] py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{saving ? "Creating..." : "Add Admin"}</button></form></div>}
  </main></div>;
}
