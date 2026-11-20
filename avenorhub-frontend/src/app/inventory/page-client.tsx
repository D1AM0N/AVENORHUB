"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import TenantIdentity from "@/components/TenantIdentity";
import LocationSelector from "@/components/LocationSelector";
import { createProduct, getProducts, getStoredSession, Product, updateProduct } from "@/lib/api";

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  stock: string;
  threshold: string;
  country: string;
  location: string;
}

const tiers = [
  { name: "Promo Tier", price: 25000 },
  { name: "Abuja Standard", price: 27000 },
  { name: "Standard", price: 30000 },
  { name: "Interstate/Lagos", price: 32000 },
];
const emptyForm: ProductForm = { name: "Promo Tier", sku: "", category: "Essentials", sellingPrice: "25000", costPrice: "", stock: "", threshold: "5", country: "Nigeria", location: "FCT - Abuja" };
const inputClass = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white";
const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId) {
        setError("Sign in with a business account to view inventory.");
        return;
      }
      setTenantId(session.user.tenantId);
      setToken(session.token);
      getProducts(session.user.tenantId, session.token)
        .then(setProducts)
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load products."));
    });
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [modalOpen]);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const product = await createProduct({
        tenantId,
        name: form.name,
        sku: form.sku,
        category: form.category,
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        stock: Number(form.stock),
        threshold: Number(form.threshold),
        location: form.country === "Nigeria" ? form.location : `${form.location}, ${form.country}`,
      }, token);
      setProducts((current) => [product, ...current]);
      setForm(emptyForm);
      setModalOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create product.");
    } finally {
      setSaving(false);
    }
  }

  async function restock(product: Product) {
    setError("");
    try {
      const updated = await updateProduct(product.id, tenantId, { stock: product.stock + 1 }, token);
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update stock.");
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] text-[#202124] dark:bg-[#111111] dark:text-white md:flex-row">
      <TenantSidebar />
      <main className="min-w-0 flex-1 space-y-6 p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-bold">Inventory</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live product catalogue and stock levels.</p></div><div className="flex flex-wrap items-center gap-3"><TenantIdentity /><button onClick={() => setModalOpen(true)} disabled={!tenantId} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"><Plus className="h-4 w-4" />Add Product</button></div></header>
        {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
        <section className="w-full overflow-x-auto -mx-4 px-4 rounded-lg border border-[#E5E7EB] bg-white sm:mx-0 sm:px-0 dark:border-gray-800 dark:bg-[#202124]"><table className="w-full text-left text-sm">
          <thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Product", "SKU", "Category", "Selling Price", "Cost Price", "Stock", "Threshold", "Action"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
            {products.map((product) => <tr key={product.id}><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3 font-mono text-xs">{product.sku}</td><td className="px-4 py-3">{product.category}</td><td className="px-4 py-3">{naira(product.sellingPrice)}</td><td className="px-4 py-3">{naira(product.costPrice)}</td><td className="px-4 py-3">{product.stock}</td><td className="px-4 py-3">{product.threshold}</td><td className="px-4 py-3"><button onClick={() => void restock(product)} className="text-xs font-semibold text-[#0F766E] hover:underline">Restock +1</button></td></tr>)}
            {products.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No products found.</td></tr>}
          </tbody>
        </table></section>
      </main>
      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section role="dialog" aria-modal="true" className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 dark:bg-[#202124]">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Add Product</h2><button aria-label="Close dialog" onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button></div>
        <form onSubmit={addProduct} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium">Pricing Tier<select className={inputClass} value={tiers.find((tier) => tier.name === form.name)?.name ?? ""} onChange={(event) => { const tier = tiers.find((item) => item.name === event.target.value); if (tier) setForm({ ...form, name: tier.name, sellingPrice: String(tier.price) }); }}><option value="">Custom</option>{tiers.map((tier) => <option key={tier.name} value={tier.name}>{tier.name} — {naira(tier.price)}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">SKU (Optional)<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">Selling Price (₦)<input required type="number" min="0" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">Cost Price (₦)<input required type="number" min="0" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">Stock<input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={inputClass} /></label>
          <label className="space-y-1 text-xs font-medium">Threshold<input required type="number" min="0" value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} className={inputClass} /></label>
          <div className="sm:col-span-2"><LocationSelector country={form.country} state={form.location} onCountryChange={(country) => setForm({ ...form, country })} onStateChange={(location) => setForm({ ...form, location })} /></div>
          <button disabled={saving} className="rounded-lg bg-[#0F766E] py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:col-span-2">{saving ? "Saving..." : "Create Product"}</button>
        </form>
      </section></div>}
    </div>
  );
}
