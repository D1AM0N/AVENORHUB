"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { clearSession, createAdditionalBusiness } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { getRoleHomePath, getRoleModules } from "@/lib/role-access";
import TenantIdentity from "@/components/TenantIdentity";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Wallet,
  Users,
  UserCog,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Building2,
  X,
  PlusCircle,
  Menu,
} from "lucide-react";

interface TenantSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileIntegrated?: boolean;
  mobileDrawer?: boolean;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sales", href: "/pos", icon: ShoppingCart },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Expenses", href: "/expenses-log", icon: Receipt },
  { label: "Analytics", href: "/finance", icon: Wallet },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Team Management", href: "/team", icon: UserCog },
  { label: "Roles & Permissions", href: "/roles", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function TenantSidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileIntegrated = true,
  mobileDrawer = false,
}: TenantSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    tenant: activeTenant,
    businesses,
    roleConfig,
    isHydrated,
    isSwitchingTenant,
    switchActiveBusiness,
    addBusinessToState,
  } = useTenant();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setBusinessOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!createOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCreateOpen(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [createOpen]);

  async function switchToBusiness(tenantId: string) {
    if (!user || tenantId === activeTenant?.id) {
      setBusinessOpen(false);
      return;
    }
    try {
      await switchActiveBusiness(tenantId);
      setBusinessOpen(false);
      setMobileMenuOpen(false);
      if (mobileDrawer) onToggleCollapse?.();
    } catch (error) {
      console.error("Could not switch business:", error);
    }
  }

  async function createBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createAdditionalBusiness({ businessName });
      addBusinessToState(result.tenant, result.businesses);
      setCreateOpen(false);
      setBusinessName("");
    } catch (error) {
      console.error("Could not create business:", error);
    } finally {
      setBusy(false);
    }
  }

  const sidebarPanel = (drawer = false) => {
    const role = user?.role ?? "";
    const roleModules = getRoleModules(role, roleConfig);
    const isTenantAdmin = role === "tenant_admin";
    const customRole = Boolean(role && !["tenant_admin", "manager", "inventory_officer", "accountant", "cashier", "super_admin"].includes(role));
    const visibleNavItems = navItems.filter((item) => {
      if (isTenantAdmin) return true;
      if (item.href === "/team" || item.href === "/roles" || item.href === "/settings") return false;
      if (item.href === "/dashboard") return roleModules.includes("overview");
      if (item.href === "/pos") return roleModules.includes("sales");
      if (item.href === "/inventory") return roleModules.includes("inventory");
      if (item.href === "/expenses-log") return roleModules.includes("expenses");
      if (item.href === "/finance") return roleModules.includes("analytics");
      return false;
    });
    const workspacePath = customRole && user ? getRoleHomePath(user, roleConfig) : null;
    const closeAfterNavigation = () => {
      setMobileMenuOpen(false);
      setBusinessOpen(false);
      if (drawer || mobileDrawer) onToggleCollapse?.();
    };

    return (
      <aside className={`${drawer || mobileDrawer ? "h-full w-72 max-w-[85vw] shadow-2xl" : isCollapsed ? "w-20" : "w-64"} h-full min-h-screen bg-white dark:bg-[#202124] border-r border-[#E5E7EB] dark:border-gray-800 flex flex-col`}>
        <div className={`h-14 md:h-16 shrink-0 flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4 sm:px-6"} border-b border-[#E5E7EB] dark:border-gray-800`}>
          <img src="/avenor-logo.jpg" alt="AvenorHub" className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen" />
          {drawer || mobileDrawer ? (
            <button type="button" onClick={closeAfterNavigation} aria-label="Close navigation" className="min-h-10 min-w-10 flex items-center justify-center rounded-lg text-[#202124] hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
          ) : onToggleCollapse && (
            <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="min-h-10 min-w-10 rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
          )}
        </div>

        {!isCollapsed && <div className="relative shrink-0 border-b border-[#E5E7EB] px-4 py-3 dark:border-gray-800">
          <button type="button" onClick={() => setBusinessOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Workspace</span>
              <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{isHydrated && activeTenant?.name ? activeTenant.name : "AvenorHub"}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
          {businessOpen && <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-[#202124]">
            {businesses.map((business) => (
              <button key={business.id} type="button" disabled={busy || isSwitchingTenant} onClick={() => void switchToBusiness(business.id)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {business.id === activeTenant?.id ? <Check className="h-4 w-4 shrink-0 text-[#0F766E]" /> : <Building2 className="h-4 w-4 shrink-0 text-gray-400" />}
                <span className="truncate">{business.name}</span>
              </button>
            ))}
            {isSwitchingTenant && <p className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-[#0F766E]"><span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0F766E] border-t-transparent" />Switching business…</p>}
            <button type="button" onClick={() => { setCreateOpen(true); setMobileMenuOpen(false); if (mobileDrawer) onToggleCollapse?.(); }} className="mt-1 flex min-h-10 w-full items-center gap-2 border-t border-[#E5E7EB] px-2 py-2 text-xs font-semibold text-[#0F766E] dark:border-gray-700">
              <PlusCircle className="h-4 w-4" />Create New Business
            </button>
          </div>}
        </div>}

        <nav className="flex-1 overflow-y-auto">
          {!isHydrated ? (
            <div className="space-y-2 px-3 py-4">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
          ) : (
            <div className="space-y-0.5 px-3 py-4">
              {workspacePath && <Link href={workspacePath} onClick={closeAfterNavigation} className={`mb-1 flex min-h-10 items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-lg bg-[#0F766E]/10 px-3 py-2.5 text-sm font-semibold text-[#0F766E]`} title={isCollapsed ? "My Workspace" : undefined}><LayoutDashboard className="h-4 w-4 shrink-0" />{!isCollapsed && "My Workspace"}</Link>}
              {visibleNavItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return <Link key={href} href={href} onClick={closeAfterNavigation} title={isCollapsed ? label : undefined} className={`flex min-h-10 items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#0F766E] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}><Icon className="w-4 h-4 shrink-0" />{!isCollapsed && label}</Link>;
              })}
            </div>
          )}
        </nav>

        <div className="mt-auto shrink-0 border-t border-gray-200 p-3 dark:border-gray-800">
          <button type="button" onClick={() => { clearSession(); router.replace("/login"); }} title={isCollapsed ? "Logout" : undefined} className={`flex min-h-11 w-full items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-lg px-3 py-2.5 text-sm font-medium text-[#202124] transition-colors hover:bg-gray-100 hover:text-[#0F766E] dark:text-white dark:hover:bg-gray-800`}>
            <LogOut className="w-4 h-4 shrink-0" />{!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    );
  };

  const businessModal = createOpen ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
      <form onSubmit={(event) => void createBusiness(event)} className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 dark:bg-[#202124]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-[#202124] dark:text-white">Create New Business</h2>
          <button type="button" aria-label="Close" onClick={() => setCreateOpen(false)} className="min-h-10 min-w-10 flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
        </div>
        <label className="block space-y-1 text-xs font-medium">Business Name
          <input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="min-h-11 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-base sm:text-sm dark:border-gray-700 dark:bg-[#111111]" />
        </label>
        <button disabled={busy} className="mt-5 min-h-11 w-full rounded-lg bg-[#0F766E] py-2.5 text-base font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:text-sm">{busy ? "Creating..." : "Create Business"}</button>
      </form>
    </div>
  ) : null;

  return (
    <>
      {mobileIntegrated && (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-[#202124]">
          <button type="button" onClick={() => setMobileMenuOpen((previous) => !previous)} aria-label="Toggle navigation" className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#202124] hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"><Menu className="h-5 w-5" /></button>
          <span className="min-w-0 flex-1 truncate px-2 text-sm font-semibold text-[#202124] dark:text-white">{isHydrated && activeTenant?.name ? activeTenant.name : "AvenorHub"}</span>
          <TenantIdentity compact />
        </header>
      )}
      {mobileIntegrated ? (
        <>
          <div className="hidden shrink-0 md:flex">{sidebarPanel()}</div>
          {isHydrated && createPortal(
            <>
              {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
              <div
                aria-hidden={!mobileMenuOpen}
                inert={!mobileMenuOpen}
                className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
              >
                {sidebarPanel(true)}
              </div>
            </>,
            document.body,
          )}
        </>
      ) : sidebarPanel()}
      {businessModal && createPortal(businessModal, document.body)}
    </>
  );
}
