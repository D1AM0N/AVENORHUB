"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TenantSidebar from "./TenantSidebar";
import TenantHeader from "./TenantHeader";

interface TenantShellProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function TenantShell({
  children,
  defaultCollapsed = false,
}: TenantShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantRevision, setTenantRevision] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const updateTenantRevision = () => setTenantRevision((previous) => previous + 1);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "avenorhub-session") updateTenantRevision();
    };
    window.addEventListener("avenorhub:tenant-changed", updateTenantRevision);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("avenorhub:tenant-changed", updateTenantRevision);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100 transition-colors md:h-screen md:overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:h-screen md:shrink-0">
        <TenantSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          mobileIntegrated={false}
        />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 max-w-[85vw]`}
      >
        <TenantSidebar
          isCollapsed={false}
          onToggleCollapse={() => setMobileOpen(false)}
          mobileIntegrated={false}
          mobileDrawer
        />
      </div>

      {/* Main Column */}
      <div key={tenantRevision} className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TenantHeader
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default TenantShell;
