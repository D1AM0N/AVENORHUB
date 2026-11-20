"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TenantShell from "@/components/TenantShell";
import {
  createRoleActivity,
  getAnalyticsSummary,
  getExpenses,
  getProducts,
  getRoleActivities,
  getSales,
  getStoredSession,
  type AnalyticsSummary,
  type Expense,
  type Product,
  type RoleActivity,
  type Sale,
  type StoredSession,
} from "@/lib/api";
import { ROLE_MODULES, getRoleModules } from "@/lib/role-access";

const fieldClass = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white";

export default function CustomRoleWorkspacePage() {
  const params = useParams<{ roleSlug: string }>();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<RoleActivity[]>([]);
  const [summaryText, setSummaryText] = useState("");
  const [amount, setAmount] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleConfig = session?.roleConfig ?? null;
  const modules = useMemo(() => getRoleModules(session?.user.role ?? "", roleConfig), [roleConfig, session?.user.role]);
  const roleFields = roleConfig?.activityFields ?? [];
  const currency = session?.tenant?.currencySymbol ?? "";

  useEffect(() => {
    void Promise.resolve().then(() => {
      const stored = getStoredSession();
      setSession(stored);
      if (!stored?.token || !stored.user.tenantId) {
        setError("Sign in with a tenant account to open this workspace.");
        setLoading(false);
        return;
      }
      if (!stored.roleConfig || stored.roleConfig.roleSlug !== params.roleSlug) {
        setError("The role configuration for this workspace is unavailable.");
        setLoading(false);
        return;
      }

      const tenantId = stored.user.tenantId;
      const token = stored.token;
      const activeModules = getRoleModules(stored.user.role, stored.roleConfig);
      const requests: Promise<void>[] = [getRoleActivities(tenantId, stored.user.role, token).then(setActivities)];
      if (activeModules.includes("analytics")) requests.push(getAnalyticsSummary(tenantId, token).then(setSummary));
      if (activeModules.includes("sales")) requests.push(getSales(tenantId, token).then(setSales));
      if (activeModules.includes("inventory")) requests.push(getProducts(tenantId, token).then(setProducts));
      if (activeModules.includes("expenses")) requests.push(getExpenses(tenantId, token).then(setExpenses));
      Promise.all(requests)
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load workspace data."))
        .finally(() => setLoading(false));
    });
  }, [params.roleSlug]);

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.user.tenantId || !session.user.id || saving) return;
    setError("");
    setSaving(true);
    try {
      const activity = await createRoleActivity({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        actorName: session.user.name,
        roleName: session.user.role,
        summary: summaryText,
        amountNaira: amount ? Number(amount) : 0,
        metadata: Object.fromEntries(Object.entries(metadata).filter(([, value]) => value.trim())),
      }, session.token);
      setActivities((current) => [activity, ...current]);
      setSummaryText("");
      setAmount("");
      setMetadata({});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save this activity.");
    } finally {
      setSaving(false);
    }
  }

  const enabledModules = ROLE_MODULES.filter((module) => modules.includes(module.id) && module.id !== "activity_log");

  return (
    <TenantShell>
      <div className="space-y-6">
        <header className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-gray-800 dark:bg-[#202124]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">{session?.tenant?.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-[#202124] dark:text-white">{roleConfig?.roleName ?? session?.user.role}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your operational workspace and daily role activity.</p>
        </header>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-white p-3 text-sm text-red-700 dark:border-red-900 dark:bg-[#202124]">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.includes("overview") && (modules.includes("analytics") || modules.includes("sales")) && <>
            <Kpi label="Sales recorded" value={String(summary?.salesCount ?? sales.length)} />
            <Kpi label="Gross merchandise value" value={`${currency}${(summary?.gmv ?? sales.reduce((total, sale) => total + sale.amountPaid, 0)).toLocaleString()}`} />
          </>}
          {modules.includes("inventory") && <Kpi label="Products" value={String(products.length)} />}
          {modules.includes("inventory") && <Kpi label="Low stock" value={String(products.filter((product) => product.stock <= product.threshold).length)} />}
          {modules.includes("expenses") && <Kpi label="Expenses recorded" value={String(expenses.length)} />}
          {modules.includes("analytics") && <Kpi label="Net profit" value={`${currency}${(summary?.netProfit ?? 0).toLocaleString()}`} />}
          {modules.includes("sales") && !modules.includes("overview") && <Kpi label="Sales recorded" value={String(sales.length)} />}
          <Kpi label="Activity entries" value={String(activities.length)} />
        </section>

        {enabledModules.length > 0 && <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enabledModules.map((module) => <article key={module.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
            <h2 className="font-semibold">{module.label}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live {module.label.toLowerCase()} data and actions for this tenant.</p>
            <Link href={module.href} className="mt-4 inline-flex rounded-lg bg-[#0F766E] px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Open {module.label}</Link>
          </article>)}
        </section>}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitActivity} className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
            <div><h2 className="font-semibold">Role Activity &amp; Operations Logger</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record completed work and operational amounts.</p></div>
            <label className="block space-y-1.5 text-sm font-medium">Activity summary<textarea required rows={3} value={summaryText} onChange={(event) => setSummaryText(event.target.value)} className={fieldClass} placeholder="Describe the work completed" /></label>
            <label className="block space-y-1.5 text-sm font-medium">Amount ({currency})<input min="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} /></label>
            {roleFields.map((field) => <label key={field} className="block space-y-1.5 text-sm font-medium">{field}<input value={metadata[field] ?? ""} onChange={(event) => setMetadata((current) => ({ ...current, [field]: event.target.value }))} className={fieldClass} /></label>)}
            <button disabled={saving} className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{saving ? "Saving..." : "Log Activity"}</button>
          </form>

          <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
            <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Recent role activity</h2></div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
              {activities.map((activity) => <article key={activity.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{activity.summary}</p><time className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</time></div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.actorName}{activity.amountNaira ? ` · ${currency}${activity.amountNaira.toLocaleString()}` : ""}</p>
                {activity.metadata && Object.keys(activity.metadata).length > 0 && <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">{Object.entries(activity.metadata).map(([key, value]) => <div key={key}><dt className="inline font-medium">{key}: </dt><dd className="inline">{String(value)}</dd></div>)}</dl>}
              </article>)}
              {!loading && activities.length === 0 && <p className="px-5 py-10 text-center text-sm text-gray-500">No role activity recorded yet.</p>}
              {loading && <p className="px-5 py-10 text-center text-sm text-gray-500">Loading role activity...</p>}
            </div>
          </section>
        </section>
      </div>
    </TenantShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <article className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-[#202124] dark:text-white">{value}</p>
  </article>;
}
