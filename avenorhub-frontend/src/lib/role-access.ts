import type { RoleConfig, RoleModule, SessionUser } from "./api";

export const ESTABLISHED_ROLES = [
  "tenant_admin",
  "manager",
  "inventory_officer",
  "accountant",
  "cashier",
] as const;

export const ROLE_MODULES: { id: RoleModule; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "sales", label: "Sales", href: "/pos" },
  { id: "inventory", label: "Inventory", href: "/inventory" },
  { id: "expenses", label: "Expenses", href: "/expenses-log" },
  { id: "analytics", label: "Analytics", href: "/finance" },
  { id: "activity_log", label: "Activity log", href: "" },
];

export const DEFAULT_ROLE_MODULES: Record<string, RoleModule[]> = {
  tenant_admin: ROLE_MODULES.map((module) => module.id),
  manager: ["overview", "sales", "inventory", "expenses", "analytics"],
  inventory_officer: ["inventory"],
  accountant: ["expenses", "analytics"],
  cashier: ["sales"],
};

export function getRoleModules(role: string, config: RoleConfig | null): RoleModule[] {
  return DEFAULT_ROLE_MODULES[role] ?? config?.modules ?? [];
}

export function getRoleHomePath(user: SessionUser, config: RoleConfig | null): string {
  if (user.role === "super_admin") return "/admin/dashboard";
  if (user.role === "tenant_admin" || user.role === "manager") return "/dashboard";
  if (user.role === "inventory_officer") return "/inventory";
  if (user.role === "accountant") return "/finance";
  if (user.role === "cashier") return "/pos";
  return `/workspace/${encodeURIComponent(config?.roleSlug ?? slugifyRole(user.role))}`;
}

export function slugifyRole(role: string): string {
  return role.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function canAccessTenantPath(
  pathname: string,
  user: SessionUser,
  config: RoleConfig | null,
): boolean {
  if (user.role === "tenant_admin") return !pathname.startsWith("/admin");
  if (user.role === "super_admin") return pathname.startsWith("/admin/");
  if (pathname === "/team" || pathname === "/roles" || pathname === "/settings" || pathname === "/customers") return false;

  if (!ESTABLISHED_ROLES.includes(user.role as (typeof ESTABLISHED_ROLES)[number])) {
    const slug = config?.roleSlug ?? slugifyRole(user.role);
    if (pathname === `/workspace/${slug}`) return true;
  }

  const moduleRoute = ROLE_MODULES.find((module) => module.href && (pathname === module.href || pathname.startsWith(`${module.href}/`)));
  if (!moduleRoute) return false;
  return getRoleModules(user.role, config).includes(moduleRoute.id);
}
