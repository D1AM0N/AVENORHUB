"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import { getStoredSession, type StoredSession } from "@/lib/api";

interface TenantProfile {
  businessName: string;
  taxRate: string;
  salesChannels: string;
}

const initialProfile: TenantProfile = {
  businessName: "",
  taxRate: "0",
  salesChannels: "Direct, Outsourced",
};

const fieldClassName =
  "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-gray-100";

export default function SettingsPage() {
  const [profile, setProfile] = useState<TenantProfile>(initialProfile);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const stored = getStoredSession();
      setSession(stored);
      if (stored?.tenant) setProfile((current) => ({ ...current, businessName: stored.tenant!.name }));
    });
  }, []);

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(true);
  };

  const updateProfile = (field: keyof TenantProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setIsSaved(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111111] md:flex-row">
      <TenantSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 dark:border-gray-800 dark:bg-[#202124] sm:h-16 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <div className="flex items-center gap-3">
            <div className="text-right"><p className="text-sm font-semibold text-[#202124] dark:text-white">{session?.tenant?.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{session?.user.name} · {session?.user.email}</p></div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] text-sm font-bold text-white">{session?.user.name.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tenant Profile</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your business details and sales configuration.</p>
          </div>

          <form onSubmit={saveProfile} className="w-full max-w-3xl space-y-5 rounded-lg border border-[#E5E7EB] bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-[#202124]">
            <label className="block space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Name
              <input required value={profile.businessName} onChange={(event) => updateProfile("businessName", event.target.value)} className={fieldClassName} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
              <input value={session?.tenant?.currencySymbol ?? ""} readOnly className={`${fieldClassName} cursor-not-allowed bg-gray-50 dark:bg-[#111111]`} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Tax Rate (%)
              <input required min="0" max="100" step="0.01" type="number" value={profile.taxRate} onChange={(event) => updateProfile("taxRate", event.target.value)} className={fieldClassName} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sales Channels / Partners
              <textarea rows={3} value={profile.salesChannels} onChange={(event) => updateProfile("salesChannels", event.target.value)} placeholder="e.g. Direct, Outsourced" className={fieldClassName} />
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">Separate channels or partner names with commas.</span>
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
                Save Profile
              </button>
              {isSaved && (
                <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Profile saved locally
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
