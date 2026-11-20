import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ROLE_MODULES, toRoleSlug } from '../common/role';
import { CreateBusinessDto, LoginDto, RegisterDto, SwitchTenantDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(dto: LoginDto, request: Request) {
    const email = dto.email.trim().toLowerCase();
    const matchingUsers = await this.prisma.db.orm.public.User.where({ email }).all();
    let user = null;
    for (const candidate of matchingUsers) {
      if (await compare(dto.password, candidate.passwordHash)) {
        user = candidate;
        break;
      }
    }
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const activeTenant = user.tenantId
      ? await this.prisma.db.orm.public.Tenant.first({ id: user.tenantId })
      : null;
    if (activeTenant) {
      await this.prisma.db.orm.public.User.where({ id: user.id }).update({ companyName: activeTenant.name });
      user = { ...user, companyName: activeTenant.name };
    }
    const businesses = await this.businessesForEmail(email);

    const payload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const ipAddress = request.ip ?? null;
    await this.prisma.db.orm.public.AuditLog.create({
      tenantId: user.tenantId,
      actorEmail: user.email,
      action: 'login',
      target: user.id,
      ipAddress,
    });

    const tenant = user.tenantId
      ? await this.prisma.db.orm.public.Tenant.first({ id: user.tenantId })
      : null;
    const savedRoleConfig = user.tenantId && !DEFAULT_ROLE_MODULES[user.role]
      ? await this.prisma.db.orm.public.RoleConfig.first({
          tenantId: user.tenantId,
          roleSlug: toRoleSlug(user.role),
        })
      : null;

    const accessToken = await this.jwt.signAsync(payload);
    return {
      access_token: accessToken,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            currencySymbol: tenant.currencySymbol,
          }
        : null,
      businesses,
      roleConfig: savedRoleConfig
        ? {
            roleName: savedRoleConfig.roleName,
            roleSlug: savedRoleConfig.roleSlug,
            modules: savedRoleConfig.modules,
            activityFields: savedRoleConfig.activityFields,
          }
        : {
            roleName: user.role,
            roleSlug: toRoleSlug(user.role),
            modules: DEFAULT_ROLE_MODULES[user.role] ?? [],
            activityFields: [],
          },
    };
  }

  async register(dto: RegisterDto, request: Request) {
    const email = dto.email.trim().toLowerCase();
    const businessName = dto.businessName.trim();
    const fullName = dto.fullName.trim();
    const passwordHash = await hash(dto.password, 12);

    const { user, tenant } = await this.prisma.db.transaction(async (tx) => {
      if (await tx.orm.public.User.first({ email })) {
        throw new ConflictException('Email is already registered');
      }

      const baseSlug = businessName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'business';
      let slug = baseSlug;
      let suffix = 2;
      while (await tx.orm.public.Tenant.first({ slug })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const createdTenant = await tx.orm.public.Tenant.create({
        name: businessName,
        slug,
        currencySymbol: '₦',
        status: 'active',
        mrrAmount: 0,
      });
      const createdUser = await tx.orm.public.User.create({
        tenantId: createdTenant.id,
        name: fullName,
        email,
        companyName: createdTenant.name,
        passwordHash,
        role: 'tenant_admin',
      });
      await tx.orm.public.AuditLog.create({
        tenantId: createdTenant.id,
        actorEmail: email,
        action: 'TENANT_REGISTERED',
        target: businessName,
        ipAddress: request.ip ?? null,
      });
      return { user: createdUser, tenant: createdTenant };
    });

    const payload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      access_token: accessToken,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        currencySymbol: tenant.currencySymbol,
      },
      businesses: [{ id: tenant.id, name: tenant.name, slug: tenant.slug, currencySymbol: tenant.currencySymbol }],
      roleConfig: {
        roleName: user.role,
        roleSlug: toRoleSlug(user.role),
        modules: DEFAULT_ROLE_MODULES[user.role] ?? [],
        activityFields: [],
      },
    };
  }

  async createBusiness(dto: CreateBusinessDto, request: Request) {
    const auth = await this.authPayload(request, dto.userId, dto.email);
    if (dto.userId && dto.userId !== auth.id) throw new UnauthorizedException('User does not match authenticated account');
    if (dto.email && dto.email.trim().toLowerCase() !== auth.email.toLowerCase()) {
      throw new UnauthorizedException('Email does not match authenticated account');
    }
    const existingUser = await this.prisma.db.orm.public.User.first({ id: auth.id, email: auth.email.toLowerCase() });
    if (!existingUser) throw new NotFoundException('Authenticated user not found');

    const businessName = dto.businessName.trim();
    const baseSlug = businessName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
    let slug = baseSlug;
    let suffix = 2;
    while (await this.prisma.db.orm.public.Tenant.first({ slug })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const tenant = await this.prisma.db.transaction(async (tx) => {
      const tenant = await tx.orm.public.Tenant.create({
        name: businessName,
        slug,
        currencySymbol: dto.currencySymbol?.trim() || '₦',
        status: 'active',
        mrrAmount: 0,
      });
      await tx.orm.public.User.create({
        tenantId: tenant.id,
        name: existingUser.name,
        email: existingUser.email,
        companyName: tenant.name,
        passwordHash: existingUser.passwordHash,
        role: 'tenant_admin',
      });
      await tx.orm.public.AuditLog.create({
        tenantId: tenant.id,
        actorEmail: existingUser.email,
        action: 'BUSINESS_CREATED',
        target: businessName,
        ipAddress: request.ip ?? null,
      });
      return tenant;
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        currencySymbol: tenant.currencySymbol,
      },
      businesses: await this.businessesForEmail(auth.email),
    };
  }

  async switchTenant(
    dto: Pick<SwitchTenantDto, 'tenantId'> & Partial<Pick<SwitchTenantDto, 'userId' | 'email'>>,
    request: Request,
  ) {
    const auth = await this.authPayload(request, dto.userId, dto.email);
    const email = (dto.email ?? auth.email).trim().toLowerCase();
    if (auth.email.toLowerCase() !== email || (dto.userId && auth.id !== dto.userId)) {
      throw new UnauthorizedException('User does not match authenticated account');
    }
    const user = await this.prisma.db.orm.public.User.first({ email, tenantId: dto.tenantId });
    if (!user) throw new NotFoundException('User or tenant membership not found');
    const tenant = await this.prisma.db.orm.public.Tenant.first({ id: dto.tenantId });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.prisma.db.orm.public.User.where({ id: user.id }).update({ companyName: tenant.name });
    user.companyName = tenant.name;
    return this.buildTenantResponse(user, tenant);
  }

  private async authPayload(
    request: Request,
    userId?: string,
    email?: string,
  ): Promise<{ id: string; email: string; role: string; tenantId: string | null }> {
    const authenticatedRequest = request as Request & {
      user?: { id: string; email: string; role: string; tenantId: string | null };
    };
    if (authenticatedRequest.user) return authenticatedRequest.user;

    const authorization = request.headers.authorization;
    if (authorization) {
      if (!authorization.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
      try {
        return await this.jwt.verifyAsync(authorization.slice(7));
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    if (userId && email) {
      const verifiedUser = await this.prisma.db.orm.public.User.first({
        id: userId,
        email: email.trim().toLowerCase(),
      });
      if (verifiedUser) {
        return {
          id: verifiedUser.id,
          email: verifiedUser.email,
          role: verifiedUser.role,
          tenantId: verifiedUser.tenantId,
        };
      }
    }
    throw new UnauthorizedException('Bearer token required');
  }

  private async businessesForEmail(email: string) {
    const users = await this.prisma.db.orm.public.User.where({ email }).all();
    const tenantIds = [...new Set(users.map((user) => user.tenantId).filter((id): id is string => Boolean(id)))];
    const businesses = [];
    for (const tenantId of tenantIds) {
      const tenant = await this.prisma.db.orm.public.Tenant.first({ id: tenantId });
      if (tenant) businesses.push({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        currencySymbol: tenant.currencySymbol,
      });
    }
    return businesses;
  }

  private async buildTenantResponse(user: any, tenant: any) {
    const businesses = await this.businessesForEmail(user.email);
    const payload = { id: user.id, email: user.email, role: user.role, tenantId: tenant.id };
    const accessToken = await this.jwt.signAsync(payload);
    const savedRoleConfig = !DEFAULT_ROLE_MODULES[user.role]
      ? await this.prisma.db.orm.public.RoleConfig.first({ tenantId: tenant.id, roleSlug: toRoleSlug(user.role) })
      : null;
    const roleConfig = savedRoleConfig
      ? {
          roleName: savedRoleConfig.roleName,
          roleSlug: savedRoleConfig.roleSlug,
          modules: savedRoleConfig.modules,
          activityFields: savedRoleConfig.activityFields,
        }
      : {
          roleName: user.role,
          roleSlug: toRoleSlug(user.role),
          modules: DEFAULT_ROLE_MODULES[user.role] ?? [],
          activityFields: [],
        };
    return {
      access_token: accessToken,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, currencySymbol: tenant.currencySymbol },
      roleConfig,
      businesses,
    };
  }
}
