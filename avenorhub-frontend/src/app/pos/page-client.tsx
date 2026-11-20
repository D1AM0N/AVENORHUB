"use client";

import { useState, useMemo, useEffect } from "react";
import TenantSidebar from "@/components/TenantSidebar";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Printer,
  X,
} from "lucide-react";

import { createSale, getProducts, getSales, getStoredSession } from "@/lib/api";
import TenantIdentity from "@/components/TenantIdentity";
import type { Product as ApiProduct, SaleChannel, SaleLocation, SaleStatus } from "@/lib/api";
import { NIGERIAN_STATES, COUNTRIES } from "@/lib/locations";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  sku: string | null;
  costPrice: number;
  threshold: number;
};

type CartItem = Product & { qty: number; sellingPrice: number };

const partners = ["Aby", "Dahyah", "Oniks"] as const;

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [salesCount, setSalesCount] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleDate, setSaleDate] = useState("");
  const [channel, setChannel] = useState<SaleChannel>("inventory");
  const [location, setLocation] = useState<SaleLocation>("Lagos");
  const [partnerName, setPartnerName] = useState<(typeof partners)[number]>("Aby");
  const [deliveryOrPartnerCost, setDeliveryOrPartnerCost] = useState(0);
  const [saleStatus, setSaleStatus] = useState<SaleStatus>("completed");
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setSaleDate(new Date().toISOString().slice(0, 10));
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId) {
        setError("Sign in with a business account to use the point of sale.");
        return;
      }
      setTenantId(session.user.tenantId);
      setToken(session.token);
      getProducts(session.user.tenantId, session.token)
        .then((items: ApiProduct[]) => setProducts(items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.sellingPrice,
          stock: item.stock,
          unit: "unit",
          sku: item.sku,
          costPrice: item.costPrice,
          threshold: item.threshold,
        }))))
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load products."));
      getSales(session.user.tenantId, session.token)
        .then((items) => setSalesCount(items.length))
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load sales history."));
    });
  }, []);

  useEffect(() => {
    if (!showReceipt) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowReceipt(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [showReceipt]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search, category]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, sellingPrice: product.price }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: Math.min(i.stock, i.qty + delta) } : i)
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
  const total = subtotal;
  const quantity = cart.reduce((sum, item) => sum + item.qty, 0);

  async function confirmSale() {
    if (cart.length === 0 || !tenantId || saving) return;
    setSaving(true);
    setError("");
    try {
      if (channel === "inventory") {
        for (const [index, item] of cart.entries()) {
          await createSale({
            tenantId,
            saleDate,
            channel,
            location,
            quantity: item.qty,
            productId: item.id,
            deliveryOrPartnerCost: index === 0 ? deliveryOrPartnerCost : 0,
            amountPaid: item.sellingPrice * item.qty,
            unitPrice: item.sellingPrice,
            sellingPrice: item.sellingPrice,
            status: saleStatus,
          }, token);
        }
      } else {
        await createSale({
          tenantId,
          saleDate,
          channel,
          location,
          partnerName,
          quantity,
          deliveryOrPartnerCost,
          amountPaid: subtotal,
          status: saleStatus,
        }, token);
      }
      setProducts((current) => current.map((product) => {
        const sold = cart.find((item) => item.id === product.id);
        return sold && channel === "inventory" ? { ...product, stock: product.stock - sold.qty } : product;
      }));
      setSalesCount((count) => count + (channel === "inventory" ? cart.length : 1));
      setShowReceipt(true);
      const recentSales = await getSales(tenantId, token);
      setSalesCount(recentSales.length);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not record sale.");
      const updatedProducts = await getProducts(tenantId, token).catch(() => null);
      if (updatedProducts) setProducts(updatedProducts.map((item) => ({
        id: item.id, name: item.name, category: item.category, price: item.sellingPrice,
        stock: item.stock, unit: "unit", sku: item.sku, costPrice: item.costPrice, threshold: item.threshold,
      })));
    } finally {
      setSaving(false);
    }
  }

  function resetSale() {
    setCart([]);
    setSaleDate(new Date().toISOString().slice(0, 10));
    setChannel("inventory");
    setLocation("Lagos");
    setPartnerName("Aby");
    setDeliveryOrPartnerCost(0);
    setSaleStatus("completed");
    setShowReceipt(false);
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111111] md:flex-row">
      <TenantSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="hidden h-14 bg-white dark:bg-[#202124] border-b border-[#E5E7EB] dark:border-gray-800 md:flex items-center gap-4 px-4">
          <h1 className="font-bold text-gray-900 dark:text-gray-100 text-base">Point of Sale</h1>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{salesCount.toLocaleString("en-NG")} recorded sales</span>
          <TenantIdentity />
        </header>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Product Grid — 60% */}
          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
            {/* Search & filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#202124] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["All", ...new Set(products.map((product) => product.category))].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === c
                        ? "bg-[#0F766E] text-white"
                        : "bg-white dark:bg-[#202124] border border-[#E5E7EB] dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#0F766E]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {error && <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600 dark:bg-[#202124]">{error}</p>}
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="bg-white dark:bg-[#202124] border border-[#E5E7EB] dark:border-gray-800 rounded-lg p-3 text-left hover:border-[#0F766E] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                    {p.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F766E]">{fmt(p.price)}</p>
                  <p className={`text-xs mt-0.5 ${p.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                    {p.stock} {p.unit}s left
                  </p>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-gray-400">
                  No products found
                </div>
              )}
            </div>
          </div>

          {/* Cart — 40% */}
          <aside className="flex w-full min-w-0 flex-col border-t border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
            <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-gray-800">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Order Summary{" "}
                {cart.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F766E] text-white text-xs">
                    {cart.length}
                  </span>
                )}
              </h2>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ShoppingCart className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Cost ref: {fmt(item.costPrice)}</p>
                      <label className="mt-1 block text-[10px] text-gray-500">Selling Price (₦)
                        <input type="number" min="0" value={item.sellingPrice} onChange={(event) => setCart((current) => current.map((line) => line.id === item.id ? { ...line, sellingPrice: Number(event.target.value) } : line))} className="mt-0.5 w-24 rounded border border-[#E5E7EB] px-2 py-1 text-xs text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white" />
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(item.id, -1)} className="p-0.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-900 dark:text-gray-100">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.stock} className="p-0.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-0.5 rounded text-red-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 shrink-0 w-16 text-right">
                      {fmt(item.sellingPrice * item.qty)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Cart footer */}
            <div className="border-t border-[#E5E7EB] dark:border-gray-800 p-4 space-y-3">
              {/* Sale fields */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sale Date</label>
                <input required type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400">Channel
                  <select value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                    <option value="inventory">Inventory</option>
                    <option value="outsourced">Outsourced</option>
                  </select>
                </label>
                <label className="block text-xs text-gray-500 dark:text-gray-400">Location
                  <select value={location} onChange={(e) => setLocation(e.target.value as SaleLocation)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                    <optgroup label="Nigeria States">{NIGERIAN_STATES.map((item) => <option key={item} value={item}>{item}</option>)}</optgroup>
                    <optgroup label="Countries">{COUNTRIES.map((item) => <option key={item} value={item}>{item}</option>)}</optgroup>
                  </select>
                </label>
              </div>
              {channel === "outsourced" && (
                <label className="block text-xs text-gray-500 dark:text-gray-400">Partner Name
                  <select value={partnerName} onChange={(e) => setPartnerName(e.target.value as (typeof partners)[number])} className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                    {partners.map((partner) => <option key={partner}>{partner}</option>)}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery / Partner Cost (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryOrPartnerCost || ""}
                    onChange={(e) => setDeliveryOrPartnerCost(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {deliveryOrPartnerCost > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery / Partner Cost</span>
                    <span>{fmt(deliveryOrPartnerCost)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span>Quantity</span><span>{quantity}</span></div>
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-gray-100 pt-1 border-t border-[#E5E7EB] dark:border-gray-700">
                  <span>Amount Paid</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sale Status</label>
                <select
                  value={saleStatus}
                  onChange={(e) => setSaleStatus(e.target.value as SaleStatus)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="completed">Completed</option>
                  <option value="delivery_default">Delivery Default</option>
                </select>
              </div>

              <button
                onClick={confirmSale}
                disabled={cart.length === 0 || saving || !tenantId || !saleDate}
                className="w-full py-3 bg-[#0F766E] text-white rounded-lg font-semibold text-sm hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Recording sale..." : `Confirm Sale · ${fmt(total)}`}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReceipt(false); }}>
          <div className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#202124] rounded-xl border border-[#E5E7EB] dark:border-gray-800 shadow-2xl">
            <div className="p-4 text-center space-y-3 sm:p-6">
              <div className="flex justify-end"><button type="button" aria-label="Close dialog" onClick={() => setShowReceipt(false)} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button></div>
              <div className="flex justify-center">
                <CheckCircle className="w-14 h-14 text-[#16A34A]" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Sale Confirmed!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {saleDate} · {location} · {channel} · {saleStatus}
              </p>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-left space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>{item.name} × {item.qty}</span>
                    <span>{fmt(item.sellingPrice * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 border-t border-[#E5E7EB] dark:border-gray-700 pt-1 mt-1">
                  <span>Amount Paid</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={resetSale}
                  className="flex-1 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  New Sale
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-teal-800 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
