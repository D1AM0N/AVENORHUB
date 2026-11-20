"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredSession } from "@/lib/api";
import { canAccessTenantPath, getRoleHomePath } from "@/lib/role-access";
import { useTenant } from "@/context/TenantContext";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, tenantVersion } = useTenant();
  const [decision, setDecision] = useState<{ pathname: string; allow: boolean } | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/admin/login";
      if (isPublicRoute) {
        if (session) {
          router.replace(getRoleHomePath(session.user, session.roleConfig));
        } else {
          setDecision({ pathname, allow: true });
        }
        return;
      }

      if (!session?.token) {
        router.replace(pathname.startsWith("/admin") ? "/admin/login" : "/login");
        return;
      }
      if (session.user.role !== "super_admin" && !session.user.tenantId) {
        clearSession();
        router.replace("/login");
        return;
      }
      if (canAccessTenantPath(pathname, session.user, session.roleConfig)) {
        setDecision({ pathname, allow: true });
        return;
      }
      router.replace(getRoleHomePath(session.user, session.roleConfig));
    });
  }, [pathname, router]);

  const isCheckingAccess = !decision?.allow || decision.pathname !== pathname;

  return (
    <>
      <div
        aria-hidden={isCheckingAccess}
        aria-busy={isCheckingAccess}
        className={isCheckingAccess ? "pointer-events-none select-none" : undefined}
        inert={isCheckingAccess}
      >
        <div key={`${tenant?.id ?? "default"}-${tenantVersion}`}>{children}</div>
      </div>
      {isCheckingAccess && (
        <div
          role="status"
          aria-label="Checking access"
          className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[#F3F4F6]/95 text-[#202124] dark:bg-[#202124]/95 dark:text-white"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0F766E]" />
        </div>
      )}
    </>
  );
}
