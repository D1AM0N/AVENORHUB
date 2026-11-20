"use client";
import { FormEvent, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

type Settings = { enforceTwoFactor: boolean; autoApprove: boolean; maintenance: boolean };
const options: { key: keyof Settings; title: string; detail: string }[] = [
  { key: "enforceTwoFactor", title: "Enforce 2FA", detail: "Require two-factor authentication for administrator accounts." },
  { key: "autoApprove", title: "Auto-Approve Tenants", detail: "Activate new tenant registrations without manual review." },
  { key: "maintenance", title: "Maintenance Mode", detail: "Temporarily restrict tenant access during platform maintenance." },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ enforceTwoFactor: true, autoApprove: false, maintenance: false });
  const [saved, setSaved] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaved(true); };
  return <div className="flex min-h-screen bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100"><AdminSidebar /><main className="flex-1 space-y-5 p-6">
    <header><h1 className="text-xl font-bold">Platform Settings</h1><p className="mt-1 text-sm text-gray-500">Configure global defaults and access controls.</p></header>
    <form onSubmit={submit} className="max-w-3xl space-y-5 rounded-lg border border-[#E5E7EB] bg-white p-6 dark:border-gray-800 dark:bg-[#202124]">
      <label className="block space-y-2 text-sm font-medium">Default Currency<select defaultValue="NGN" className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#202124]"><option value="NGN">₦ Nigerian Naira (NGN)</option></select></label>
      {options.map(({ key, title, detail }) => <label key={key} className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] p-4 dark:border-gray-800"><input type="checkbox" checked={settings[key]} onChange={(event) => { setSettings({ ...settings, [key]: event.target.checked }); setSaved(false); }} className="mt-1 accent-[#0F766E]" /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-gray-500">{detail}</span></span></label>)}
      <div className="flex items-center gap-3"><button className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white">Save Settings</button>{saved && <span role="status" className="text-sm font-medium text-[#0F766E]">Settings saved.</span>}</div>
    </form>
  </main></div>;
}
