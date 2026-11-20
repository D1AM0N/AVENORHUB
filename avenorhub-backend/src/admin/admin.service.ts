import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { toRoleSlug } from '../common/role';
import { CreateAdminUserDto, CreateRoleActivityDto, CreateStaffDto, CreateTenantDto, RoleConfigDto, TenantStatusDto } from './admin.dto';
import type { RoleActivityRequest } from './role-activity.guard';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listTenants() {
    return this.prisma.db.orm.public.Tenant.orderBy((tenant) => tenant.createdAt.desc()).all();
  }

  async createTenant(dto: CreateTenantDto) {
    const slug = (dto.slug ?? dto.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await this.prisma.db.orm.public.Tenant.first({ slug });
    if (existing) throw new ConflictException('Tenant slug already exists');
    return this.prisma.db.orm.public.Tenant.create({
      name: dto.name,
      slug,
      currencySymbol: dto.currencySymbol ?? '₦',
      status: dto.status ?? 'pending',
      mrrAmount: dto.mrrAmount ?? 0,
    });
  }

  async updateTenantStatus(id: string, dto: TenantStatusDto) {
    const tenant = await this.prisma.db.orm.public.Tenant.first({ id });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.db.orm.public.Tenant.where({ id }).update({ status: dto.status });
  }

  async listUsers() {
    const users = await this.prisma.db.orm.public.User.orderBy((user) => user.createdAt.desc()).all();
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  async createUser(dto: CreateAdminUserDto) {
    const existing = await this.prisma.db.orm.public.User.first({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email is already registered');
    const user = await this.prisma.db.orm.public.User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash: await hash(dto.password, 12),
      role: dto.role,
      tenantId: dto.tenantId ?? null,
      companyName: dto.tenantId
        ? (await this.prisma.db.orm.public.Tenant.first({ id: dto.tenantId }))?.name ?? null
        : null,
      twoFactorEnabled: dto.twoFactorEnabled ?? false,
    });
    const { passwordHash: _passwordHash, ...profile } = user;
    return profile;
  }

  async listStaff(tenantId: string) {
    const users = await this.prisma.db.orm.public.User
      .where({ tenantId })
      .orderBy((user) => user.createdAt.desc())
      .all();
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  async assignStaff(dto: CreateStaffDto, actorEmail: string, ipAddress: string | null) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role?.trim() || 'cashier';
    this.assertAssignableRole(role);
    const user = await this.prisma.db.transaction(async (tx) => {
      const tenant = await tx.orm.public.Tenant.first({ id: dto.tenantId });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      let createdUser = await tx.orm.public.User.first({ email, tenantId: dto.tenantId });
      if (createdUser) {
        const updated = await tx.orm.public.User.where({ email, tenantId: dto.tenantId }).update({
          name: dto.name.trim(),
          passwordHash: await hash(dto.password, 12),
          role,
          companyName: tenant.name,
        });
        if (!updated) throw new NotFoundException('Staff member not found');
        createdUser = updated;
      } else {
        createdUser = await tx.orm.public.User.create({
          tenantId: dto.tenantId,
          name: dto.name.trim(),
          email,
          passwordHash: await hash(dto.password, 12),
          role,
          companyName: tenant.name,
        });
      }
      await tx.orm.public.AuditLog.create({
        tenantId: dto.tenantId,
        actorEmail,
        action: 'STAFF_ASSIGNED',
        target: createdUser.email,
        ipAddress,
      });
      const { passwordHash: _passwordHash, ...profile } = createdUser;
      return profile;
    });
    return user;
  }

  async updateStaffRole(id: string, tenantId: string, roleName: string, actorEmail: string, ipAddress: string | null) {
    const role = roleName.trim();
    this.assertAssignableRole(role);
    return this.prisma.db.transaction(async (tx) => {
      const target = await tx.orm.public.User.first({ id, tenantId });
      if (!target) throw new NotFoundException('Staff member not found');
      const tenant = await tx.orm.public.Tenant.first({ id: tenantId });
      const updated = await tx.orm.public.User.where({ id, tenantId }).update({
        role,
        companyName: tenant?.name ?? null,
      });
      if (!updated) throw new NotFoundException('Staff member not found');
      await tx.orm.public.AuditLog.create({
        tenantId,
        actorEmail,
        action: 'ROLE_UPDATED',
        target: `${target.email}:${role}`,
        ipAddress,
      });
      const { passwordHash: _passwordHash, ...profile } = updated;
      return profile;
    });
  }

  listRoles(tenantId: string) {
    return this.prisma.db.orm.public.RoleConfig
      .where({ tenantId })
      .orderBy((config) => config.roleName.asc())
      .all();
  }

  async createRole(dto: RoleConfigDto & { tenantId: string }) {
    const roleName = dto.roleName.trim();
    this.assertAssignableRole(roleName);
    if (!(await this.prisma.db.orm.public.Tenant.first({ id: dto.tenantId }))) {
      throw new NotFoundException('Tenant not found');
    }
    const roleSlug = toRoleSlug(roleName);
    if (!roleSlug) throw new ConflictException('Role name must include letters or numbers');
    if (await this.prisma.db.orm.public.RoleConfig.first({ tenantId: dto.tenantId, roleSlug })) {
      throw new ConflictException('Role already exists for this tenant');
    }
    return this.prisma.db.orm.public.RoleConfig.create({
      tenantId: dto.tenantId,
      roleName,
      roleSlug,
      modules: dto.modules,
      activityFields: dto.activityFields.map((field) => field.trim()),
    });
  }

  listRoleActivities(tenantId: string, roleName?: string) {
    const activities = this.prisma.db.orm.public.RoleActivity.where(
      roleName ? { tenantId, roleName } : { tenantId },
    );
    return activities.orderBy((activity) => activity.createdAt.desc()).limit(500).all();
  }

  async createRoleActivity(dto: CreateRoleActivityDto, actor: RoleActivityRequest['user']) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant access required');
    const user = await this.prisma.db.orm.public.User.first({ id: actor.id, tenantId: actor.tenantId });
    if (!user || !user.tenantId || user.role !== actor.role) throw new NotFoundException('Authenticated user not found');
    if (dto.roleName !== user.role) throw new ConflictException('Activity role does not match the user role');
    return this.prisma.db.orm.public.RoleActivity.create({
      tenantId: user.tenantId,
      userId: user.id,
      actorName: user.name,
      roleName: user.role,
      summary: dto.summary.trim(),
      amountNaira: dto.amountNaira ?? 0,
      metadata: dto.metadata,
    });
  }

  private assertAssignableRole(role: string): void {
    if (!role.trim() || toRoleSlug(role) === 'super_admin') {
      throw new ConflictException('The super_admin role cannot be assigned');
    }
  }

  logs() {
    return this.prisma.db.orm.public.AuditLog.orderBy((log) => log.createdAt.desc()).limit(500).all();
  }

  tenantLogs(tenantId: string) {
    return this.prisma.db.orm.public.AuditLog
      .where({ tenantId })
      .orderBy((log) => log.createdAt.desc())
      .limit(500)
      .all();
  }
}
