"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { AdminOverview, getAdminOverview, getStoredSession, Tenant, updateAdminTenantStatus } from "@/lib/api";

export default function BusinessesPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async (activeToken: string) => {
    setOverview(await getAdminOverview(activeToken));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || session.user.role !== "super_admin") {
        setError("Sign in as Super Admin to manage businesses.");
        return;
      }
      setToken(session.token);
      refresh(session.token).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load businesses."));
    });
  }, [refresh]);

  async function toggle(tenant: Tenant) {
    setError("");
    try {
      await updateAdminTenantStatus(tenant.id, tenant.status === "active" ? "suspended" : "active", token);
      await refresh(token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update business status.");
    }
  }

  return <div className="flex min-h-screen bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white"><AdminSidebar /><main className="flex-1 space-y-5 p-6">
    <header className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Businesses</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live tenant directory.</p></div><Link href="/admin/businesses/create" className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Create Business</Link></header>
    {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
    <section className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]"><table className="w-full text-left text-sm"><thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Business", "Administrator", "Slug", "Currency", "Status", "Action"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">{overview?.tenants.map((tenant) => {
        const admin = overview.users.find((user) => user.tenantId === tenant.id && user.role === "tenant_admin");
        return <tr key={tenant.id}><td className="px-4 py-3 font-semibold">{tenant.name}</td><td className="px-4 py-3">{admin?.name ?? admin?.email ?? "—"}</td><td className="px-4 py-3 font-mono text-xs">{tenant.slug}</td><td className="px-4 py-3">{tenant.currencySymbol}</td><td className="px-4 py-3 capitalize text-[#0F766E]">{tenant.status}</td><td className="px-4 py-3"><button onClick={() => void toggle(tenant)} className="text-xs font-semibold text-[#0F766E] hover:underline">Set {tenant.status === "active" ? "Suspended" : "Active"}</button></td></tr>;
      })}{overview?.tenants.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No businesses registered.</td></tr>}</tbody>
    </table></section>
  </main></div>;
}
