"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { AdminOverview, getAdminOverview, getStoredSession } from "@/lib/api";

const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || session.user.role !== "super_admin") {
        setError("Sign in as Super Admin to view platform data.");
        return;
      }
      getAdminOverview(session.token).then(setOverview).catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load platform overview.");
      });
    });
  }, []);

  const metrics = [
    ["Businesses", overview?.tenants.length ?? 0],
    ["Administrators", overview?.users.length ?? 0],
    ["Active Businesses", overview?.tenants.filter((tenant) => tenant.status === "active").length ?? 0],
    ["Audit Events", overview?.auditLogs.length ?? 0],
  ];

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white">
      <AdminSidebar />
      <main className="flex-1 space-y-6 p-6">
        <header><h1 className="text-xl font-bold">Admin Control Center</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live tenant, account, and audit data.</p></header>
        {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <article key={label} className="rounded-lg border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]"><p className="text-xs uppercase text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>)}</section>
        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
          <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Registered Businesses</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Business", "Slug", "Status", "MRR", "Registered"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
            {overview?.tenants.map((tenant) => <tr key={tenant.id}><td className="px-4 py-3 font-semibold">{tenant.name}</td><td className="px-4 py-3 font-mono text-xs">{tenant.slug}</td><td className="px-4 py-3 capitalize text-[#0F766E]">{tenant.status}</td><td className="px-4 py-3">{naira(tenant.mrrAmount)}</td><td className="px-4 py-3">{new Date(tenant.createdAt).toLocaleDateString("en-NG")}</td></tr>)}
            {overview?.tenants.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No businesses registered.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]"><h2 className="font-semibold">Recent Platform Activity</h2><ul className="mt-3 divide-y divide-[#E5E7EB] dark:divide-gray-800">{overview?.auditLogs.slice(0, 5).map((log) => <li key={log.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span><span className="font-medium">{log.actorEmail}</span> · {log.action} · {log.target}</span><time className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("en-NG")}</time></li>)}</ul></section>
      </main>
    </div>
  );
}
