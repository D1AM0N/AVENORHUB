"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredSession,
  switchBusiness,
  type BusinessSummary,
  type RoleConfig,
  type SessionUser,
  type StoredSession,
} from "@/lib/api";

interface TenantContextValue {
  user: SessionUser | null;
  tenant: StoredSession["tenant"];
  businesses: BusinessSummary[];
  roleConfig: RoleConfig | null;
  isHydrated: boolean;
  isSwitchingTenant: boolean;
  tenantVersion: number;
  switchActiveBusiness: (targetTenantId: string) => Promise<void>;
  addBusinessToState: (newTenant: BusinessSummary, updatedBusinesses: BusinessSummary[]) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<StoredSession["tenant"]>(null);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false);
  const [tenantVersion, setTenantVersion] = useState(0);

  const syncFromStorage = useCallback(() => {
    const session = getStoredSession();
    const accessToken = localStorage.getItem("access_token") ?? localStorage.getItem("token");
    const readJson = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) as T : fallback;
      } catch {
        return fallback;
      }
    };
    const storedUser = readJson<SessionUser | null>("avenorhub-user", null)
      ?? readJson<SessionUser | null>("user", null);
    const storedTenant = readJson<StoredSession["tenant"]>("avenorhub-tenant", null)
      ?? readJson<StoredSession["tenant"]>("tenant", null);
    const storedBusinesses = readJson<BusinessSummary[]>("avenorhub-businesses", []);
    const storedRoleConfig = readJson<RoleConfig | null>("avenorhub-role-config", null)
      ?? readJson<RoleConfig | null>("roleConfig", null);
    setUser(session?.user ?? (accessToken ? storedUser : null));
    setTenant(session?.tenant ?? storedTenant);
    setBusinesses(session?.businesses.length ? session.businesses : storedBusinesses);
    setRoleConfig(session?.roleConfig ?? storedRoleConfig);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setIsHydrated(true);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "avenorhub-session") {
        syncFromStorage();
        setTenantVersion((version) => version + 1);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncFromStorage]);

  const switchActiveBusiness = useCallback(async (targetTenantId: string) => {
    if (!user?.email) throw new Error("Sign in before switching businesses.");
    setIsSwitchingTenant(true);
    try {
      const result = await switchBusiness({ tenantId: targetTenantId, email: user.email });
      setTenant(result.tenant);
      setUser(result.user);
      setRoleConfig(result.roleConfig);
      setBusinesses(result.businesses);
      setTenantVersion((version) => version + 1);
    } finally {
      setIsSwitchingTenant(false);
    }
  }, [user]);

  const addBusinessToState = useCallback((
    newTenant: BusinessSummary,
    updatedBusinesses: BusinessSummary[],
  ) => {
    setBusinesses(updatedBusinesses);
    const session = getStoredSession();
    if (session) {
      localStorage.setItem("avenorhub-businesses", JSON.stringify(updatedBusinesses));
      localStorage.setItem("avenorhub-session", JSON.stringify({
        ...session,
        businesses: updatedBusinesses,
      }));
    }
    if (!updatedBusinesses.some((business) => business.id === newTenant.id)) {
      setBusinesses((current) => [...current, newTenant]);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    tenant,
    businesses,
    roleConfig,
    isHydrated,
    isSwitchingTenant,
    tenantVersion,
    switchActiveBusiness,
    addBusinessToState,
  }), [
    user,
    tenant,
    businesses,
    roleConfig,
    isHydrated,
    isSwitchingTenant,
    tenantVersion,
    switchActiveBusiness,
    addBusinessToState,
  ]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within a TenantProvider.");
  return context;
}
