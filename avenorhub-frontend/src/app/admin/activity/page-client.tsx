"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { AuditLog, getAdminOverview, getStoredSession } from "@/lib/api";

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || session.user.role !== "super_admin") {
        setError("Sign in as Super Admin to review platform activity.");
        return;
      }
      getAdminOverview(session.token).then((overview) => setLogs(overview.auditLogs)).catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load audit logs.");
      });
    });
  }, []);

  const filtered = useMemo(() => logs.filter((log) =>
    [log.actorEmail, log.action, log.target, log.ipAddress ?? "", log.createdAt]
      .some((value) => value.toLowerCase().includes(query.toLowerCase()))
  ), [logs, query]);

  return <div className="flex min-h-screen bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white"><AdminSidebar /><main className="flex-1 space-y-5 p-6">
    <header><h1 className="text-xl font-bold">Platform Activity</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live, filterable audit events.</p></header>
    {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
    <input aria-label="Filter audit log" placeholder="Filter by admin, action, target, IP, or timestamp..." value={query} onChange={(event) => setQuery(event.target.value)} className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#202124]" />
    <section className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]"><table className="w-full text-left text-sm"><thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Timestamp", "Admin", "Action", "Target", "IP"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">{filtered.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString("en-NG")}</td><td className="px-4 py-3 font-medium">{log.actorEmail}</td><td className="px-4 py-3 text-[#0F766E]">{log.action}</td><td className="px-4 py-3">{log.target}</td><td className="px-4 py-3 font-mono text-xs">{log.ipAddress ?? "—"}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No matching activity.</td></tr>}</tbody></table></section>
  </main></div>;
}
