import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { StaffManagementGuard } from './staff-management.guard';
import { RoleActivityGuard } from './role-activity.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';

@Module({ controllers: [AdminController], providers: [AdminService, SuperAdminGuard, StaffManagementGuard, RoleActivityGuard, TenantAccessGuard] })
export class AdminModule {}
