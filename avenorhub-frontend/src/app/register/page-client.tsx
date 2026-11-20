"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRegisterBusiness } from "@/lib/api";

const inputClass = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRegisterBusiness(form);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Business registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-4 py-10 text-[#202124] dark:bg-[#111111] dark:text-white">
      <section className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-[#202124]">
        <Link href="/login" className="text-sm font-semibold text-[#0F766E] hover:underline">AvenorHub</Link>
        <h1 className="mt-5 text-2xl font-bold">Register Your Business</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your business workspace and owner account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block space-y-1 text-sm font-medium">Business Name
            <input required autoComplete="organization" value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className={inputClass} />
          </label>
          <label className="block space-y-1 text-sm font-medium">Owner Full Name
            <input required autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={inputClass} />
          </label>
          <label className="block space-y-1 text-sm font-medium">Work Email
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
          </label>
          <label className="block space-y-1 text-sm font-medium">Password
            <input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} />
          </label>
          <p className="rounded-lg bg-[#F3F4F6] p-3 text-xs leading-5 text-gray-600 dark:bg-[#111111] dark:text-gray-300">
            Cashiers and other staff accounts are added by your business admin after registration.
          </p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60">
            {loading ? "Creating workspace..." : "Create Business"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">Already registered? <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">Sign in</Link></p>
      </section>
    </main>
  );
}
