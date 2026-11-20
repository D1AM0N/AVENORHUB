"use client";

import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";

type SalesChannel = "Direct" | "Outsourced";

interface Customer {
  id: string;
  name: string;
  location: string;
  orders: number;
  totalSpent: number;
  channel: SalesChannel;
}

const customers: Customer[] = [];

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111111] md:flex-row">
      <TenantSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 dark:border-gray-800 dark:bg-[#202124] sm:h-16 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <div className="flex items-center gap-3">
            <TenantIdentity />
          </div>
        </header>

        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Customer Directory</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Browse customer locations, order history, and sales channels.</p>
          </div>

          <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Total Spent</th>
                    <th className="px-5 py-3">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{customer.name}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{customer.location}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{customer.orders.toLocaleString("en-NG")}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">{formatNaira(customer.totalSpent)}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{customer.channel}</td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        No customers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
