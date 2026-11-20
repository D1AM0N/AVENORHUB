"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import TenantShell from "@/components/TenantShell";
import {
  assignTenantStaff,
  getRoleConfigs,
  getStoredSession,
  getTenantStaff,
  roleSlug,
  saveRoleConfig,
  type RoleConfig,
  type RoleModule,
  type TenantStaff,
  updateStaffRole,
} from "@/lib/api";
import { ESTABLISHED_ROLES, ROLE_MODULES } from "@/lib/role-access";

const inputClass = "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111] dark:text-white";
const establishedLabels: Record<string, string> = {
  tenant_admin: "Tenant Admin",
  manager: "Manager",
  inventory_officer: "Inventory Officer",
  accountant: "Accountant",
  cashier: "Cashier",
};

export default function RolesAndPermissionsPage() {
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [staff, setStaff] = useState<TenantStaff[]>([]);
  const [roles, setRoles] = useState<Array<RoleConfig & { id: string }>>([]);
  const [roleName, setRoleName] = useState("");
  const [modules, setModules] = useState<RoleModule[]>(["overview"]);
  const [activityFields, setActivityFields] = useState<string[]>([""]);
  const [member, setMember] = useState({ name: "", email: "", password: "", role: "cashier" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(
    () => [...ESTABLISHED_ROLES, ...roles.map((role) => role.roleName)],
    [roles],
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      const session = getStoredSession();
      if (!session?.token || !session.user.tenantId || session.user.role !== "tenant_admin") {
        setError("Only a tenant administrator can manage roles and permissions.");
        setLoading(false);
        return;
      }
      setTenantId(session.user.tenantId);
      setToken(session.token);
      setIsTenantAdmin(true);
      Promise.all([
        getTenantStaff(session.user.tenantId, session.token),
        getRoleConfigs(session.user.tenantId, session.token),
      ])
        .then(([staffRows, roleRows]) => {
          setStaff(staffRows);
          setRoles(roleRows);
        })
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load roles and staff."))
        .finally(() => setLoading(false));
    });
  }, []);

  function toggleModule(module: RoleModule) {
    setModules((current) => current.includes(module) ? current.filter((entry) => entry !== module) : [...current, module]);
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTenantAdmin) return;
    setError("");
    setStatus("");
    if (ESTABLISHED_ROLES.includes(roleSlug(roleName) as (typeof ESTABLISHED_ROLES)[number])) {
      setError("Use the established role assignment instead of creating a custom role with a built-in role name.");
      return;
    }
    setSaving(true);
    try {
      const config = await saveRoleConfig({
        tenantId,
        roleName,
        modules,
        activityFields: activityFields.map((field) => field.trim()).filter(Boolean),
      }, token);
      setRoles((current) => [...current, config]);
      setRoleName("");
      setModules(["overview"]);
      setActivityFields([""]);
      setStatus(`Created ${config.roleName}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save this role.");
    } finally {
      setSaving(false);
    }
  }

  async function assignStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTenantAdmin) return;
    setError("");
    setStatus("");
    setSaving(true);
    try {
      const created = await assignTenantStaff({ ...member, tenantId }, token);
      setStaff((current) => [created, ...current]);
      setMember({ name: "", email: "", password: "", role: "cashier" });
      setStatus(`Added ${created.name} as ${created.role}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not assign this staff member.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStaffRole(userId: string, role: string) {
    if (!isTenantAdmin) return;
    setError("");
    setStatus("");
    try {
      const updated = await updateStaffRole({ tenantId, userId, role, requesterRole: "tenant_admin" }, token);
      setStaff((current) => current.map((entry) => entry.id === userId ? updated : entry));
      setStatus(`Updated ${updated.name}'s role.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this role.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-4 text-[#202124] dark:bg-[#202124] dark:text-white">
        <p role="status" className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium dark:border-gray-700 dark:bg-[#202124]">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#0F766E]" />
          Checking role access...
        </p>
      </main>
    );
  }

  return (
    <TenantShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[#202124] dark:text-white">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure permitted workspace modules and operational fields for your staff.</p>
        </header>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-white p-3 text-sm text-red-700 dark:border-red-900 dark:bg-[#202124]">{error}</p>}
        {status && <p role="status" className="rounded-lg bg-[#0F766E]/10 p-3 text-sm font-medium text-[#0F766E]">{status}</p>}

        {isTenantAdmin && <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
            <h2 className="font-semibold text-[#202124] dark:text-white">Create a Custom Role</h2>
            <form onSubmit={createRole} className="mt-4 space-y-4">
              <label className="block space-y-1.5 text-sm font-medium">Role title
                <input required value={roleName} onChange={(event) => setRoleName(event.target.value)} className={inputClass} placeholder="e.g. Dispatch Rider" />
              </label>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Permitted modules</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ROLE_MODULES.map((module) => <label key={module.id} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-2.5 text-sm dark:border-gray-700">
                    <input type="checkbox" checked={modules.includes(module.id)} onChange={() => toggleModule(module.id)} className="accent-[#0F766E]" />
                    {module.label}
                  </label>)}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Custom operational activity fields</legend>
                <div className="space-y-2">
                  {activityFields.map((field, index) => <div key={index} className="flex gap-2">
                    <input value={field} onChange={(event) => setActivityFields((current) => current.map((entry, itemIndex) => itemIndex === index ? event.target.value : entry))} className={inputClass} placeholder="e.g. Deliveries completed" />
                    <button type="button" disabled={activityFields.length === 1} onClick={() => setActivityFields((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#202124] disabled:opacity-40 dark:border-gray-700 dark:text-white">Remove</button>
                  </div>)}
                </div>
                <button type="button" onClick={() => setActivityFields((current) => [...current, ""])} className="mt-2 text-sm font-semibold text-[#0F766E] hover:underline">+ Add activity field</button>
              </fieldset>
              <button disabled={saving || !tenantId || !roleName.trim()} className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{saving ? "Saving..." : "Save Custom Role"}</button>
            </form>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
            <h2 className="font-semibold text-[#202124] dark:text-white">Assign a Staff Role</h2>
            <form onSubmit={assignStaff} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">Full name<input required value={member.name} onChange={(event) => setMember({ ...member, name: event.target.value })} className={inputClass} /></label>
              <label className="space-y-1 text-sm font-medium">Work email<input required type="email" value={member.email} onChange={(event) => setMember({ ...member, email: event.target.value })} className={inputClass} /></label>
              <label className="space-y-1 text-sm font-medium">Temporary password<input required minLength={8} type="password" value={member.password} onChange={(event) => setMember({ ...member, password: event.target.value })} className={inputClass} /></label>
              <label className="space-y-1 text-sm font-medium">Role<select value={member.role} onChange={(event) => setMember({ ...member, role: event.target.value })} className={inputClass}>
                {ESTABLISHED_ROLES.map((role) => <option key={role} value={role}>{establishedLabels[role]}</option>)}
                {roles.map((role) => <option key={role.id} value={role.roleName}>{role.roleName} (Custom)</option>)}
              </select></label>
              <button disabled={saving || !tenantId} className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 sm:col-span-2">{saving ? "Assigning..." : "Add Staff Member"}</button>
            </form>
          </section>
        </div>}

        <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
          <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Team Role Assignments</h2></div>
          <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3F4F6] text-xs uppercase text-gray-500 dark:bg-[#111111]"><tr>{["Staff member", "Email", "Assigned role"].map((item) => <th key={item} className="px-5 py-3">{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                {staff.map((entry) => <tr key={entry.id}>
                  <td className="px-5 py-3 font-medium">{entry.name}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{entry.email}</td>
                  <td className="px-5 py-3">{isTenantAdmin ? <select aria-label={`Role for ${entry.name}`} value={entry.role} onChange={(event) => void changeStaffRole(entry.id, event.target.value)} className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-sm focus:ring-2 focus:ring-[#0F766E] dark:border-gray-700 dark:bg-[#111111]">{roleOptions.map((role) => <option key={role} value={role}>{establishedLabels[role] ?? role}</option>)}</select> : <span>{entry.role}</span>}</td>
                </tr>)}
                {!loading && staff.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">No staff accounts yet.</td></tr>}
                {loading && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">Loading team roles...</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => <article key={role.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5 dark:border-gray-800 dark:bg-[#202124]">
            <h2 className="font-semibold">{role.roleName}</h2>
            <p className="mt-1 text-xs text-gray-500">/{role.roleSlug}</p>
            <div className="mt-3 flex flex-wrap gap-2">{role.modules.map((module) => <span key={module} className="rounded-full bg-[#0F766E]/10 px-2.5 py-1 text-xs font-medium text-[#0F766E]">{module.replace("_", " ")}</span>)}</div>
            {role.activityFields.length > 0 && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Activity fields: {role.activityFields.join(", ")}</p>}
          </article>)}
        </section>
      </div>
    </TenantShell>
  );
}
