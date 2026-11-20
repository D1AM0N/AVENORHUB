"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";

import { createExpense, getExpenses, getStoredSession } from "@/lib/api";
import type { Expense, ExpenseCategory, FundingSource } from "@/lib/api";

interface ExpenseForm {
  expenseDate: string;
  description: string;
  category: ExpenseCategory;
  fundingSource: FundingSource;
  unitsRestocked: string;
  amount: string;
}

const emptyForm: ExpenseForm = {
  expenseDate: new Date().toISOString().slice(0, 10),
  description: "",
  category: "restock",
  fundingSource: "Company",
  unitsRestocked: "",
  amount: "",
};
const expenseCategories: ExpenseCategory[] = ["restock", "ads", "logistics", "payroll", "setup_ops"];

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const fieldClassName =
  "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-gray-100";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const companyTotal = useMemo(
    () => expenses.filter((expense) => expense.fundingSource === "Company").reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );
  const stephenTotal = useMemo(
    () => expenses.filter((expense) => expense.fundingSource === "Stephen").reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId) {
        setError("Sign in with a business account to view expenses.");
        setLoading(false);
        return;
      }
      setTenantId(session.user.tenantId);
      setToken(session.token);
      getExpenses(session.user.tenantId, session.token)
        .then(setExpenses)
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load expenses."))
        .finally(() => setLoading(false));
    });
  }, []);

  const recordExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const expense = await createExpense({
        tenantId,
        expenseDate: form.expenseDate,
        description: form.description,
        category: form.category,
        unitsRestocked: form.unitsRestocked ? Number(form.unitsRestocked) : undefined,
        fundingSource: form.fundingSource,
        amount: Number(form.amount),
      }, token);
      setExpenses((current) => [expense, ...current]);
      setForm(emptyForm);
      setIsModalOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not record expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111111] md:flex-row">
      <TenantSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 dark:border-gray-800 dark:bg-[#202124] sm:h-16 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
          <div className="flex items-center gap-3">
            <TenantIdentity />
          </div>
        </header>

        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expense Ledger</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track business expenses and their funding sources.</p>
            </div>
            <button type="button" onClick={() => setIsModalOpen(true)} disabled={!tenantId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              Record Expense
            </button>
          </div>

          {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Expenses", value: formatNaira(total) },
              { label: "Company Funded", value: formatNaira(companyTotal) },
              { label: "Stephen Funded", value: formatNaira(stephenTotal) },
              { label: "Expense Entries", value: expenses.length.toLocaleString("en-NG") },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Expense Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Funding Source</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-600 dark:text-gray-300">{expense.expenseDate}</td>
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{expense.description}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{expense.category}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{expense.fundingSource}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatNaira(expense.amount)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        {loading ? "Loading expenses..." : "No expenses recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="expense-modal-title" className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4 sm:px-6 dark:border-gray-800">
              <h2 id="expense-modal-title" className="font-semibold text-gray-900 dark:text-gray-100">Record Expense</h2>
              <button type="button" aria-label="Close dialog" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={recordExpense} className="space-y-4 p-4 sm:p-6">
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Expense Date
                <input required type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} className={fieldClassName} />
              </label>
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Description
                <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClassName} />
              </label>
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Category
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })} className={fieldClassName}>
                  {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Units Restocked (optional)
                <input min="0" step="1" type="number" value={form.unitsRestocked} onChange={(event) => setForm({ ...form, unitsRestocked: event.target.value })} className={fieldClassName} />
              </label>
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Funding Source
                <select value={form.fundingSource} onChange={(event) => setForm({ ...form, fundingSource: event.target.value as FundingSource })} className={fieldClassName}>
                  <option value="Company">Company</option>
                  <option value="Stephen">Stephen</option>
                </select>
              </label>
              <label className="block space-y-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Amount (₦)
                <input required min="0" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={fieldClassName} />
              </label>
              <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#0F766E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60">
                {saving ? "Saving..." : "Record Expense"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
