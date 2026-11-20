const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export type SaleChannel = "inventory" | "outsourced";
export type SaleLocation = "Abuja" | "Lagos" | "PH" | "Benin" | "Warri" | "Asaba" | "Enugu";
export type SaleStatus = "completed" | "delivery_default";
export type ExpenseCategory = "restock" | "ads" | "logistics" | "payroll" | "setup_ops";
export type FundingSource = "Company" | "Stephen";

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  currencySymbol: string;
}

export interface LoginResponse {
  access_token: string;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string | null;
    twoFactorEnabled: boolean;
  };
  tenant: Pick<Tenant, "id" | "name" | "slug" | "currencySymbol"> | null;
  roleConfig: RoleConfig;
  businesses: BusinessSummary[];
}

export interface RegisterResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
  tenant: Pick<Tenant, "id" | "name" | "slug" | "currencySymbol">;
  roleConfig: RoleConfig;
  businesses: BusinessSummary[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  twoFactorEnabled?: boolean;
}

export type RoleModule = "overview" | "sales" | "inventory" | "expenses" | "analytics" | "activity_log";

export interface RoleConfig {
  roleName: string;
  roleSlug: string;
  modules: RoleModule[];
  activityFields: string[];
}

export interface StoredSession {
  token: string;
  user: SessionUser;
  tenant: Pick<Tenant, "id" | "name" | "slug" | "currencySymbol"> | null;
  roleConfig: RoleConfig | null;
  businesses: BusinessSummary[];
}

export const SESSION_STORAGE_KEY = "avenorhub-session";

export function saveSession(
  token: string,
  user: SessionUser,
  tenant: StoredSession["tenant"] = null,
  roleConfig: RoleConfig | null = null,
  businesses: BusinessSummary[] = tenant ? [tenant] : [],
): void {
  const session: StoredSession = { token, user, tenant, roleConfig, businesses };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem("access_token", token);
  localStorage.setItem("token", token);
  localStorage.setItem("avenorhub-user", JSON.stringify(user));
  localStorage.setItem("avenorhub-businesses", JSON.stringify(businesses));
  if (tenant) localStorage.setItem("avenorhub-tenant", JSON.stringify(tenant));
  else localStorage.removeItem("avenorhub-tenant");
  if (roleConfig) localStorage.setItem("avenorhub-role-config", JSON.stringify(roleConfig));
  else localStorage.removeItem("avenorhub-role-config");
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<StoredSession>;
    if (!parsed.token || !parsed.user) return null;
    const user = JSON.parse(localStorage.getItem("avenorhub-user") ?? JSON.stringify(parsed.user)) as SessionUser;
    const tenant = JSON.parse(localStorage.getItem("avenorhub-tenant") ?? JSON.stringify(parsed.tenant ?? null)) as StoredSession["tenant"];
    const roleConfig = JSON.parse(localStorage.getItem("avenorhub-role-config") ?? JSON.stringify(parsed.roleConfig ?? null)) as RoleConfig | null;
    let businesses: BusinessSummary[] = [];
    try { businesses = JSON.parse(localStorage.getItem("avenorhub-businesses") ?? "[]") as BusinessSummary[]; } catch { businesses = []; }
    if (!businesses.length && tenant) businesses = [tenant];
    return { token: parsed.token, user, tenant, roleConfig, businesses };
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant");
  localStorage.removeItem("roleConfig");
  localStorage.removeItem("avenorhub-user");
  localStorage.removeItem("avenorhub-tenant");
  localStorage.removeItem("avenorhub-role-config");
  localStorage.removeItem("avenorhub-businesses");
}

export function roleSlug(roleName: string): string {
  return roleName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string | null;
  location?: string | null;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  threshold: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  saleDate: string;
  channel: SaleChannel;
  location: SaleLocation;
  partnerName: string | null;
  quantity: number;
  deliveryOrPartnerCost: number;
  amountPaid: number;
  profit: number;
  status: SaleStatus;
  createdAt: string;
  unitPrice?: number | null;
  sellingPrice?: number | null;
}

export interface CreateSaleInput {
  tenantId: string;
  saleDate: string;
  channel: SaleChannel;
  location: SaleLocation;
  partnerName?: "Aby" | "Dahyah" | "Oniks";
  productId?: string;
  quantity: number;
  deliveryOrPartnerCost: number;
  amountPaid: number;
  status: SaleStatus;
  unitPrice?: number;
  sellingPrice?: number;
}

export interface Expense {
  id: string;
  tenantId: string;
  expenseDate: string;
  description: string;
  category: ExpenseCategory;
  unitsRestocked: number | null;
  fundingSource: FundingSource;
  amount: number;
  createdAt: string;
}

export interface CreateExpenseInput {
  tenantId: string;
  expenseDate: string;
  description: string;
  category: ExpenseCategory;
  unitsRestocked?: number;
  fundingSource: FundingSource;
  amount: number;
}

export interface CreateProductInput {
  tenantId: string;
  name: string;
  sku?: string;
  location?: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  threshold: number;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "tenantId">>;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  currencySymbol: string;
  taxRate: number;
  status: string;
  mrrAmount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  lastLoginIp: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  target: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  gmv: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  companyExpenses: number;
  stephenExpenses: number;
  lowStockCount: number;
  salesCount: number;
}

export interface AdminOverview {
  tenants: Tenant[];
  users: AdminUser[];
  auditLogs: AuditLog[];
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const accessToken = token ?? (
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") ?? localStorage.getItem("token") ?? getAccessToken()
      : undefined
  );
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (typeof window !== "undefined") {
    const storedTenant = localStorage.getItem("avenorhub-tenant") ?? localStorage.getItem("tenant");
    if (storedTenant) {
      try {
        const tenant = JSON.parse(storedTenant) as { id?: unknown };
        if (typeof tenant.id === "string" && tenant.id) headers.set("x-tenant-id", tenant.id);
      } catch {
        headers.delete("x-tenant-id");
      }
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const storedToken = localStorage.getItem("access_token") ?? localStorage.getItem("token");
  if (storedToken) return storedToken;
  const sessionToken = getStoredSession()?.token;
  return sessionToken;
}

function tenantQuery(tenantId?: string): string {
  return tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(result.access_token || result.accessToken, result.user, result.tenant, result.roleConfig, result.businesses);
  return result;
}

export async function apiRegisterBusiness(input: {
  businessName: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const result = await apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  saveSession(result.access_token, result.user, result.tenant, result.roleConfig, result.businesses);
  return result;
}

export async function createAdditionalBusiness(input: { businessName: string }): Promise<{
  tenant: BusinessSummary;
  businesses: BusinessSummary[];
}> {
  const user = getStoredSession()?.user
    ?? JSON.parse(localStorage.getItem("avenorhub-user") ?? localStorage.getItem("user") ?? "null") as SessionUser | null;
  const result = await apiFetch<{ tenant: BusinessSummary; businesses: BusinessSummary[] }>(
    "/auth/businesses",
    {
      method: "POST",
      body: JSON.stringify({
        businessName: input.businessName,
        userId: user?.id,
        email: user?.email,
        currencySymbol: "₦",
      }),
    },
  );
  localStorage.setItem("avenorhub-businesses", JSON.stringify(result.businesses));
  const session = getStoredSession();
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, businesses: result.businesses }));
  }
  return result;
}

export async function switchBusiness(input: { tenantId: string; email: string }) {
  const result = await apiFetch<LoginResponse>(
    "/auth/switch-tenant",
    { method: "POST", body: JSON.stringify(input) },
  );
  saveSession(result.access_token || result.accessToken, result.user, result.tenant, result.roleConfig, result.businesses);
  window.dispatchEvent(new CustomEvent("avenorhub:tenant-changed", {
    detail: { tenant: result.tenant, user: result.user, roleConfig: result.roleConfig },
  }));
  return result;
}

export const createAdminTenant = (
  input: { name: string; currencySymbol?: string; status?: string; mrrAmount?: number },
  token: string,
) =>
  apiFetch<Tenant>("/admin/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);

export const updateAdminTenantStatus = (
  id: string,
  status: "active" | "pending" | "suspended",
  token: string,
) =>
  apiFetch<Tenant>(`/admin/tenants/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);

export const createAdminUser = (
  input: { tenantId?: string | null; name: string; email: string; password: string; role: "tenant_admin" | "cashier" | "super_admin" },
  token: string,
) =>
  apiFetch<AdminUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);

export interface TenantStaff {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  lastLoginIp: string | null;
  createdAt: string;
}

export const getTenantStaff = (tenantId: string, token = getStoredSession()?.token) => {
  assertTenantScope(tenantId);
  return apiFetch<TenantStaff[]>(`/admin/staff${tenantQuery(tenantId)}`, {}, token);
};

export const assignTenantStaff = (
  input: { tenantId: string; name: string; email: string; password: string; role: string },
  token = getStoredSession()?.token,
) => {
  assertTenantScope(input.tenantId);
  return apiFetch<TenantStaff>("/admin/staff", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
};

export const updateStaffRole = (
  input: { tenantId: string; userId: string; role: string; requesterRole: "tenant_admin" },
  token = getStoredSession()?.token,
) => {
  assertTenantScope(input.tenantId);
  return apiFetch<TenantStaff>(`/admin/staff/${encodeURIComponent(input.userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role: input.role, requesterRole: input.requesterRole }),
  }, token);
};

export interface SaveRoleConfigInput {
  tenantId: string;
  roleName: string;
  modules: RoleModule[];
  activityFields: string[];
}

export const saveRoleConfig = (
  input: SaveRoleConfigInput,
  token = getStoredSession()?.token,
) => {
  assertTenantScope(input.tenantId);
  return apiFetch<RoleConfig & { id: string; tenantId: string }>(
    "/admin/roles",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
};

export const getRoleConfigs = (tenantId: string, token = getStoredSession()?.token) => {
  assertTenantScope(tenantId);
  return apiFetch<Array<RoleConfig & { id: string; tenantId: string }>>(
    `/admin/roles${tenantQuery(tenantId)}`,
    {},
    token,
  );
};

export interface RoleActivity {
  id: string;
  tenantId: string;
  userId: string;
  actorName: string;
  roleName: string;
  summary: string;
  amountNaira: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const getRoleActivities = (
  tenantId: string,
  roleName?: string,
  token = getStoredSession()?.token,
) => {
  assertTenantScope(tenantId);
  const query = new URLSearchParams({ tenantId });
  if (roleName) query.set("roleName", roleName);
  return apiFetch<RoleActivity[]>(`/admin/role-activities?${query.toString()}`, {}, token);
};

export const createRoleActivity = (
  input: {
    tenantId: string;
    userId: string;
    actorName: string;
    roleName: string;
    summary: string;
    amountNaira?: number;
    metadata?: Record<string, unknown>;
  },
  token = getStoredSession()?.token,
) => {
  assertTenantScope(input.tenantId);
  return apiFetch<RoleActivity>(
    "/admin/role-activities",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
};

function assertTenantScope(tenantId: string): void {
  const session = getStoredSession();
  if (!tenantId || !session?.user.tenantId || session.user.tenantId !== tenantId) {
    throw new Error("The requested tenant does not match the authenticated user.");
  }
}

export const getSales = (tenantId: string, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<Sale[]>(`/sales${tenantQuery(tenantId)}`, {}, token);
};

export const createSale = (sale: CreateSaleInput, token?: string) => {
  assertTenantScope(sale.tenantId);
  return apiFetch<Sale>("/sales", { method: "POST", body: JSON.stringify(sale) }, token);
};

export const getExpenses = (tenantId: string, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<Expense[]>(`/expenses${tenantQuery(tenantId)}`, {}, token);
};

export const createExpense = (expense: CreateExpenseInput, token?: string) => {
  assertTenantScope(expense.tenantId);
  return apiFetch<Expense>("/expenses", { method: "POST", body: JSON.stringify(expense) }, token);
};

export const getProducts = (tenantId: string, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<Product[]>(`/products${tenantQuery(tenantId)}`, {}, token);
};

export const createProduct = (product: CreateProductInput, token?: string) => {
  assertTenantScope(product.tenantId);
  return apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(product) }, token);
};

export const updateProduct = (id: string, tenantId: string, product: UpdateProductInput, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}${tenantQuery(tenantId)}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  }, token);
};

export const getAnalyticsSummary = (tenantId: string, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<AnalyticsSummary>(`/analytics/summary${tenantQuery(tenantId)}`, {}, token);
};

export interface AnalyticsWeekly {
  weekStarting: string;
  grossSales: number;
  adsExpense: number;
  stockExpense: number;
  otherExpenses: number;
  netProfit: number;
  unitsSold: number;
}

export const getAnalyticsWeekly = (tenantId: string, token?: string) => {
  assertTenantScope(tenantId);
  return apiFetch<AnalyticsWeekly[]>(`/analytics/weekly${tenantQuery(tenantId)}`, {}, token);
};

export async function getAdminOverview(token: string): Promise<AdminOverview> {
  const [tenants, users, auditLogs] = await Promise.all([
    apiFetch<Tenant[]>("/admin/tenants", {}, token),
    apiFetch<AdminUser[]>("/admin/users", {}, token),
    apiFetch<AuditLog[]>("/admin/logs", {}, token),
  ]);
  return { tenants, users, auditLogs };
}
