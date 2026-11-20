export const ROLE_MODULES = ['overview', 'sales', 'inventory', 'expenses', 'analytics', 'activity_log'] as const;

export type RoleModule = (typeof ROLE_MODULES)[number];

export function toRoleSlug(roleName: string): string {
  return roleName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const DEFAULT_ROLE_MODULES: Record<string, RoleModule[]> = {
  tenant_admin: [...ROLE_MODULES],
  manager: ['overview', 'sales', 'inventory', 'expenses', 'analytics'],
  inventory_officer: ['inventory'],
  accountant: ['expenses', 'analytics'],
  cashier: ['sales'],
};
