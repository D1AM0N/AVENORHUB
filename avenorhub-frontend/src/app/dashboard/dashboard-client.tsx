"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";
import { AnalyticsSummary, getAnalyticsSummary, getProducts, getSales, getStoredSession, Product, Sale } from "@/lib/api";
import { getRoleModules } from "@/lib/role-access";
import { BarChart2, CreditCard, DollarSign, Plus, ShoppingBag, Users } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("");
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId) {
        setError("Sign in with a tenant account to load your live business dashboard.");
        return;
      }
      setBusinessName(session.tenant?.name ?? "");
      setCurrency(session.tenant?.currencySymbol ?? "");
      setIsTenantAdmin(session.user.role === "tenant_admin");
      const modules = getRoleModules(session.user.role, session.roleConfig);
      setAllowedModules(modules);
      const tenantId = session.user.tenantId;
      const requests: Promise<void>[] = [];
      if (modules.includes("analytics")) requests.push(getAnalyticsSummary(tenantId, session.token).then(setSummary));
      if (modules.includes("sales")) requests.push(getSales(tenantId, session.token).then(setSales));
      if (modules.includes("inventory")) requests.push(getProducts(tenantId, session.token).then((products) => setLowStock(products.filter((product) => product.stock <= product.threshold))));
      Promise.all(requests).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load dashboard data."));
    });
  }, []);

  const money = (amount: number) => `${currency}${amount.toLocaleString("en-NG")}`;
  const cards = allowedModules.includes("analytics") ? [
    { label: "Gross Merchandise Value", value: money(summary?.gmv ?? 0), icon: ShoppingBag },
    { label: "Gross Profit", value: money(summary?.grossProfit ?? 0), icon: BarChart2 },
    { label: "Net Profit", value: money(summary?.netProfit ?? 0), icon: DollarSign },
    { label: "Total Expenses", value: money(summary?.totalExpenses ?? 0), icon: CreditCard },
  ] : [];

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white md:flex-row">
      <TenantSidebar />
      <main className="min-w-0 w-full max-w-full flex-1 space-y-6 overflow-hidden p-4 sm:p-6">
        <header className="flex min-w-0 w-full max-w-full flex-col gap-2.5 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-gray-800 dark:bg-[#202124]">
          <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold">{isTenantAdmin ? "Tenant Admin Dashboard" : "Business Overview"}</h1><p className="break-words text-xs text-gray-500 dark:text-gray-400">{businessName}</p></div>
          <div className="flex min-w-0 max-w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4"><span className="w-full max-w-full rounded-full bg-[#0F766E]/10 px-3 py-1 text-center text-xs font-semibold text-[#0F766E] sm:w-auto">Live Data</span><TenantIdentity /></div>
        </header>
        {error && <p role="alert" className="min-w-0 w-full max-w-full break-words overflow-hidden rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
        {cards.length > 0 && <section className="grid min-w-0 w-full max-w-full grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => <article key={label} className="min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-[#202124]"><div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between"><p className="min-w-0 flex-1 break-words text-xs font-medium uppercase text-gray-500">{label}</p><Icon className="h-5 w-5 shrink-0 text-[#0F766E]" /></div><p className="mt-3 min-w-0 max-w-full break-words text-xl font-bold sm:text-2xl">{value}</p></article>)}
        </section>}
        {(allowedModules.includes("sales") || allowedModules.includes("inventory") || allowedModules.includes("expenses") || isTenantAdmin) && <section className="grid min-w-0 w-full max-w-full grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {allowedModules.includes("sales") && <Link href="/pos" className="flex min-w-0 w-full max-w-full items-center justify-center gap-2 overflow-hidden break-words rounded-lg bg-[#0F766E] p-3 text-sm font-semibold text-white hover:bg-teal-800"><ShoppingBag className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">Make a Sale</span></Link>}
          {allowedModules.includes("inventory") && <Link href="/inventory" className="flex min-w-0 w-full max-w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm font-semibold hover:border-[#0F766E] dark:border-gray-800 dark:bg-[#202124]"><Plus className="h-4 w-4 shrink-0 text-[#0F766E]" /><span className="min-w-0 truncate">Manage Products</span></Link>}
          {allowedModules.includes("expenses") && <Link href="/expenses-log" className="flex min-w-0 w-full max-w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm font-semibold hover:border-[#0F766E] dark:border-gray-800 dark:bg-[#202124]"><CreditCard className="h-4 w-4 shrink-0 text-[#0F766E]" /><span className="min-w-0 truncate">Record Expense</span></Link>}
          {isTenantAdmin && <Link href="/team" className="flex min-w-0 w-full max-w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm font-semibold hover:border-[#0F766E] dark:border-gray-800 dark:bg-[#202124]"><Users className="h-4 w-4 shrink-0 text-[#0F766E]" /><span className="min-w-0 truncate">Manage Team</span></Link>}
        </section>
        }
        {allowedModules.includes("sales") && <section className="min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
          <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Recent Sales</h2></div>
          <div className="min-w-0 w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full text-left text-sm"><thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Date", "Channel", "Location", "Units", "Amount Paid", "Status"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
            {sales.slice(0, 8).map((sale) => <tr key={sale.id}><td className="px-4 py-3">{new Date(sale.saleDate).toLocaleDateString("en-NG")}</td><td className="px-4 py-3 capitalize">{sale.channel}</td><td className="max-w-40 break-words px-4 py-3">{sale.location}</td><td className="px-4 py-3">{sale.quantity}</td><td className="px-4 py-3 font-semibold">{money(sale.amountPaid)}</td><td className="px-4 py-3">{sale.status}</td></tr>)}
            {sales.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No sales recorded yet.</td></tr>}
          </tbody></table></div>
        </section>}
        {allowedModules.includes("inventory") && <section className="min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-[#202124]"><h2 className="break-words font-semibold">Low-Stock Alerts</h2>{lowStock.length ? <ul className="mt-3 min-w-0 divide-y divide-[#E5E7EB] dark:divide-gray-800">{lowStock.map((product) => <li key={product.id} className="flex min-w-0 flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"><span className="min-w-0 flex-1 break-words">{product.name}</span><span className="min-w-0 max-w-full break-words font-medium text-[#0F766E] sm:text-right">{product.stock} left · threshold {product.threshold}</span></li>)}</ul> : <p className="mt-3 break-words text-sm text-gray-500">No low-stock products.</p>}</section>}
      </main>
    </div>
  );
}
