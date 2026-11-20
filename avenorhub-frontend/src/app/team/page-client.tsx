"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";
import { assignTenantStaff, getRoleConfigs, getStoredSession, getTenantStaff, type RoleConfig, type TenantStaff } from "@/lib/api";

const inputClass = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white";

export default function TeamManagementPage() {
  const [staff, setStaff] = useState<TenantStaff[]>([]);
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });
  const [token, setToken] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async (activeTenantId: string, activeToken: string) => {
    setStaff(await getTenantStaff(activeTenantId, activeToken));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId || session.user.role !== "tenant_admin") {
        setError("Sign in with a tenant administrator account to manage staff.");
        setLoading(false);
        return;
      }
      setIsTenantAdmin(true);
      setToken(session.token);
      setTenantId(session.user.tenantId);
      Promise.all([
        loadStaff(session.user.tenantId, session.token),
        getRoleConfigs(session.user.tenantId, session.token).then(setRoles),
      ])
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load staff."))
        .finally(() => setLoading(false));
    });
  }, [loadStaff]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await assignTenantStaff({ ...form, tenantId }, token);
      setForm({ name: "", email: "", password: "", role: "cashier" });
      await loadStaff(tenantId, token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not assign staff member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white md:flex-row">
      <TenantSidebar />
      <main className="min-w-0 flex-1 space-y-6 p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-bold">Team Management</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Assign staff and manage access to your business.</p></div><TenantIdentity /></header>
        {!isTenantAdmin && error ? <p role="alert" className="rounded-lg bg-white p-4 text-sm text-red-600 dark:bg-[#202124]">{error} <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">Sign in</Link></p> : isTenantAdmin ? (
          <>
            <section className="max-w-3xl rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
              <h2 className="font-semibold">Assign Cashier / Worker</h2>
              <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
                <label className="space-y-1 text-xs font-medium">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label>
                <label className="space-y-1 text-xs font-medium">Temporary Password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} /></label>
                <label className="space-y-1 text-xs font-medium">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className={inputClass}><option value="tenant_admin">Tenant Admin</option><option value="manager">Manager</option><option value="inventory_officer">Inventory Officer</option><option value="accountant">Accountant</option><option value="cashier">Cashier</option>{roles.map((role) => <option key={role.roleSlug} value={role.roleName}>{role.roleName} (Custom)</option>)}</select></label>
                <div className="flex items-end"><button disabled={saving} className="w-full rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">{saving ? "Assigning..." : "Assign Staff"}</button></div>
              </form>
              {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            </section>
            <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
              <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Active Staff</h2></div>
              <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full text-left text-sm">
                <thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Name", "Email", "Role", "Added"].map((item) => <th key={item} className="px-5 py-3">{item}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                  {staff.map((member) => <tr key={member.id}><td className="px-5 py-3 font-medium">{member.name}</td><td className="px-5 py-3 text-gray-600 dark:text-gray-300">{member.email}</td><td className="px-5 py-3 capitalize">{member.role.replace("_", " ")}</td><td className="px-5 py-3 text-gray-500">{new Date(member.createdAt).toLocaleDateString("en-NG")}</td></tr>)}
                  {!loading && staff.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">No staff accounts yet.</td></tr>}
                  {loading && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">Loading staff...</td></tr>}
                </tbody>
              </table></div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
