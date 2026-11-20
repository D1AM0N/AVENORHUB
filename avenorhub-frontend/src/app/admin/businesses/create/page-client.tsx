"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { createAdminTenant, createAdminUser, getStoredSession } from "@/lib/api";

type FormFields = { name: string; admin: string; email: string; password: string };
const input = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#202124] dark:text-gray-100";

export default function CreateBusinessPage() {
  const [form, setForm] = useState<FormFields>({ name: "", admin: "", email: "", password: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (key: keyof FormFields, value: string) => { setForm({ ...form, [key]: value }); setSaved(false); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = getStoredSession();
    if (!session?.token || session.user.role !== "super_admin") {
      setError("Sign in as Super Admin to create a business.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const tenant = await createAdminTenant({ name: form.name, currencySymbol: "₦", status: "active", mrrAmount: 0 }, session.token);
      await createAdminUser({ tenantId: tenant.id, name: form.admin, email: form.email, password: form.password, role: "tenant_admin" }, session.token);
      setSaved(true);
      setForm({ name: "", admin: "", email: "", password: "" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create business.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="flex min-h-screen bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100"><AdminSidebar /><main className="flex-1 p-6"><div className="mx-auto max-w-3xl space-y-5">
    <Link href="/admin/businesses" className="text-sm font-medium text-[#0F766E]">← Back to Businesses</Link>
    <header><h1 className="text-xl font-bold">Create Business</h1><p className="mt-1 text-sm text-gray-500">Register a tenant and its primary administrator.</p></header>
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6 dark:border-gray-800 dark:bg-[#202124] sm:grid-cols-2">
      {([["name", "Business Name"], ["admin", "Administrator Name"], ["email", "Administrator Email"], ["password", "Temporary Admin Password"]] as const).map(([key, label]) => <label key={key} className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}<input required minLength={key === "password" ? 8 : undefined} type={key === "email" ? "email" : key === "password" ? "password" : "text"} value={form[key]} onChange={(event) => update(key, event.target.value)} className={input} /></label>)}
      <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency<input readOnly value="₦ Nigerian Naira" className={input} /></label>
      {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="flex items-end gap-3"><button disabled={loading} className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{loading ? "Creating..." : "Create Business"}</button>{saved && <span role="status" className="text-sm font-medium text-[#0F766E]">Business created.</span>}</div>
    </form>
  </div></main></div>;
}
