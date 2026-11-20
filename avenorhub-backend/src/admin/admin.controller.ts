import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import type { TenantScopedRequest } from '../common/guards/tenant-access.guard';
import { AdminService } from './admin.service';
import {
  CreateAdminUserDto,
  CreateRoleActivityDto,
  CreateStaffDto,
  CreateTenantDto,
  RoleActivityQueryDto,
  RoleConfigDto,
  RoleConfigQueryDto,
  StaffQueryDto,
  TenantStatusDto,
  UpdateStaffRoleDto,
} from './admin.dto';
import { StaffManagementGuard } from './staff-management.guard';

interface StaffRequest extends TenantScopedRequest, Request {
  user: { id: string; email: string; role: string; tenantId: string | null };
}

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('tenants')
  @UseGuards(SuperAdminGuard)
  tenants() { return this.admin.listTenants(); }

  @Post('tenants')
  @UseGuards(SuperAdminGuard)
  createTenant(@Body() dto: CreateTenantDto) { return this.admin.createTenant(dto); }

  @Patch('tenants/:id/status')
  @UseGuards(SuperAdminGuard)
  tenantStatus(@Param('id') id: string, @Body() dto: TenantStatusDto) { return this.admin.updateTenantStatus(id, dto); }

  @Get('users')
  @UseGuards(SuperAdminGuard)
  users() { return this.admin.listUsers(); }

  @Post('users')
  @UseGuards(SuperAdminGuard)
  createUser(@Body() dto: CreateAdminUserDto) { return this.admin.createUser(dto); }

  @Get('logs')
  @UseGuards(SuperAdminGuard)
  logs() { return this.admin.logs(); }

  @Get('tenant-logs')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  tenantLogs(@Req() request: StaffRequest) {
    return this.admin.tenantLogs(request.tenantId);
  }

  @Get('staff')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  staff(@Query() query: StaffQueryDto, @Req() request: StaffRequest) {
    return this.admin.listStaff(request.tenantId);
  }

  @Post('staff')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  assignStaff(@Body() dto: CreateStaffDto, @Req() request: StaffRequest) {
    return this.admin.assignStaff(
      Object.assign(dto, { tenantId: request.tenantId }),
      request.user.email,
      request.ip ?? null,
    );
  }

  @Patch('staff/:id/role')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  updateStaffRole(@Param('id') id: string, @Body() dto: UpdateStaffRoleDto, @Req() request: StaffRequest) {
    if (request.user.role !== 'tenant_admin' || dto.requesterRole !== request.user.role) {
      throw new ForbiddenException('Tenant Admin access required');
    }
    if (!request.user.tenantId) throw new ForbiddenException('Tenant access required');
    return this.admin.updateStaffRole(id, request.user.tenantId, dto.role, request.user.email, request.ip ?? null);
  }

  @Get('roles')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  roles(@Query() query: RoleConfigQueryDto, @Req() request: StaffRequest) {
    return this.admin.listRoles(request.tenantId);
  }

  @Post('roles')
  @UseGuards(TenantAccessGuard, StaffManagementGuard)
  createRole(@Body() dto: RoleConfigDto, @Req() request: StaffRequest) {
    if (request.user.role !== 'tenant_admin') throw new ForbiddenException('Tenant Admin access required');
    return this.admin.createRole(Object.assign(dto, { tenantId: request.tenantId }));
  }

  @Get('role-activities')
  @UseGuards(TenantAccessGuard)
  roleActivities(@Query() query: RoleActivityQueryDto, @Req() request: StaffRequest) {
    if (request.user.role !== 'tenant_admin' && query.roleName && query.roleName !== request.user.role) {
      throw new ForbiddenException('You can only view activity for your role');
    }
    const roleName =
      request.user.role === 'tenant_admin' || request.user.role === 'super_admin'
        ? query.roleName
        : request.user.role;
    return this.admin.listRoleActivities(request.tenantId, roleName);
  }

  @Post('role-activities')
  @UseGuards(TenantAccessGuard)
  createRoleActivity(@Body() dto: CreateRoleActivityDto, @Req() request: StaffRequest) {
    if (
      !request.user.tenantId ||
      dto.userId !== request.user.id ||
      dto.roleName !== request.user.role
    ) {
      throw new ForbiddenException('Activity must belong to your authenticated user and role');
    }
    return this.admin.createRoleActivity(dto, request.user);
  }
}
