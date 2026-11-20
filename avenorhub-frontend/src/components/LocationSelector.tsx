"use client";

import { COUNTRIES, NIGERIAN_STATES } from "@/lib/locations";

interface LocationSelectorProps {
  country: string;
  state: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  className?: string;
}

export default function LocationSelector({
  country,
  state,
  onCountryChange,
  onStateChange,
  className = "",
}: LocationSelectorProps) {
  const field = `w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white ${className}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs font-medium">
        Country
        <input list="countries-list" value={country} onChange={(event) => onCountryChange(event.target.value)} placeholder="Search country" className={field} />
        <datalist id="countries-list">
          {COUNTRIES.map((item) => <option key={item} value={item} />)}
        </datalist>
      </label>
      <label className="space-y-1 text-xs font-medium">
        State / Location
        {country === "Nigeria" ? (
          <select value={state} onChange={(event) => onStateChange(event.target.value)} className={field}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        ) : (
          <input value={state} onChange={(event) => onStateChange(event.target.value)} placeholder="State / city / location" className={field} />
        )}
      </label>
    </div>
  );
}
