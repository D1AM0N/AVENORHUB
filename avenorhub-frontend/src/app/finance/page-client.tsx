"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Wallet, ShoppingBag } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";
import { getAnalyticsWeekly, getStoredSession, type AnalyticsWeekly } from "@/lib/api";

type ReportPeriod = "Weekly" | "Monthly";

interface ProfitRollup {
  id: string;
  period: string;
  grossSales: number;
  adsExpense: number;
  stockExpense: number;
  netProfit: number;
  unitsSold: number;
}

export default function FinancePage() {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("Weekly");
  const [weekly, setWeekly] = useState<AnalyticsWeekly[]>([]);
  const [currency, setCurrency] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId) {
        setError("Sign in with a tenant account to load financial analytics.");
        setLoading(false);
        return;
      }
      setCurrency(session.tenant?.currencySymbol ?? "");
      getAnalyticsWeekly(session.user.tenantId, session.token)
        .then(setWeekly)
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load financial analytics."))
        .finally(() => setLoading(false));
    });
  }, []);

  const rollups = useMemo<ProfitRollup[]>(() => {
    if (reportPeriod === "Weekly") {
      return weekly.map((row) => ({
        id: row.weekStarting,
        period: row.weekStarting,
        grossSales: row.grossSales,
        adsExpense: row.adsExpense,
        stockExpense: row.stockExpense,
        netProfit: row.netProfit,
        unitsSold: row.unitsSold,
      }));
    }
    const monthly = new Map<string, ProfitRollup>();
    for (const row of weekly) {
      const month = row.weekStarting.slice(0, 7);
      const value = monthly.get(month) ?? { id: month, period: month, grossSales: 0, adsExpense: 0, stockExpense: 0, netProfit: 0, unitsSold: 0 };
      value.grossSales += row.grossSales;
      value.adsExpense += row.adsExpense;
      value.stockExpense += row.stockExpense;
      value.netProfit += row.netProfit;
      value.unitsSold += row.unitsSold;
      monthly.set(month, value);
    }
    return [...monthly.values()].sort((a, b) => b.period.localeCompare(a.period));
  }, [reportPeriod, weekly]);

  const totals = rollups.reduce((sum, row) => ({
    grossSales: sum.grossSales + row.grossSales,
    expenses: sum.expenses + row.adsExpense + row.stockExpense,
    netProfit: sum.netProfit + row.netProfit,
    unitsSold: sum.unitsSold + row.unitsSold,
  }), { grossSales: 0, expenses: 0, netProfit: 0, unitsSold: 0 });
  const formatMoney = (amount: number) => `${currency}${amount.toLocaleString("en-NG")}`;

  const cards = [
    { label: "Gross Sales", value: formatMoney(totals.grossSales), icon: TrendingUp },
    { label: "Ads & Stock Expense", value: formatMoney(totals.expenses), icon: Wallet },
    { label: "Net Profit", value: formatMoney(totals.netProfit), icon: ShoppingBag },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111111] md:flex-row">
      <TenantSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 dark:border-gray-800 dark:bg-[#202124] sm:h-16 sm:px-6">
          <h1 className="text-lg font-bold text-[#202124] dark:text-white">Financial Analytics</h1>
          <TenantIdentity />
        </header>
        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          <div><h2 className="text-xl font-bold text-[#202124] dark:text-white">Profit &amp; Loss</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live tenant sales, expenses, and profit performance.</p></div>
          {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-lg border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]"><div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#202124] dark:text-white">{value}</p></div><div className="rounded-lg bg-[#0F766E]/10 p-2.5"><Icon className="h-5 w-5 text-[#0F766E]" /></div></div></article>)}
          </section>
          <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
            <div className="flex flex-col justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center">
              <div><h3 className="text-sm font-semibold text-[#202124] dark:text-white">{reportPeriod} Profit Rollup</h3><p className="mt-1 text-xs text-gray-500">Gross sales less operating expenses.</p></div>
              <div className="inline-flex rounded-lg bg-[#F3F4F6] p-1 dark:bg-[#111111]">{(["Weekly", "Monthly"] as const).map((period) => <button key={period} type="button" onClick={() => setReportPeriod(period)} aria-pressed={reportPeriod === period} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${reportPeriod === period ? "bg-white text-[#0F766E] shadow-sm dark:bg-[#202124]" : "text-gray-500 hover:text-[#202124] dark:text-gray-400 dark:hover:text-white"}`}>{period}</button>)}</div>
            </div>
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full text-left text-sm">
              <thead className="bg-[#F3F4F6] text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-[#111111]"><tr>{[reportPeriod === "Weekly" ? "Week starting" : "Month", "Gross Sales", "Ads Expense", "Stock Expense", "Net Profit", "Units Sold"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                {rollups.map((row) => <tr key={row.id}><td className="px-5 py-3 font-medium">{row.period}</td><td className="px-5 py-3">{formatMoney(row.grossSales)}</td><td className="px-5 py-3">{formatMoney(row.adsExpense)}</td><td className="px-5 py-3">{formatMoney(row.stockExpense)}</td><td className="px-5 py-3 font-semibold">{formatMoney(row.netProfit)}</td><td className="px-5 py-3">{row.unitsSold.toLocaleString("en-NG")}</td></tr>)}
                {!loading && rollups.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">No financial activity recorded yet.</td></tr>}
                {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">Loading tenant analytics...</td></tr>}
              </tbody>
            </table></div>
          </section>
        </div>
      </main>
    </div>
  );
}
