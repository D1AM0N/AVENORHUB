import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ROLE_MODULES } from '../common/role';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mrrAmount?: number;

  @IsOptional()
  @IsIn(['active', 'pending', 'suspended'])
  status?: string;
}

export class TenantStatusDto {
  @IsIn(['active', 'pending', 'suspended'])
  status!: string;
}

export class CreateAdminUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsIn(['super_admin', 'tenant_admin', 'cashier'])
  role!: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}

export class CreateStaffDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;
}

export class StaffQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;
}

export class UpdateStaffRoleDto {
  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsIn(['tenant_admin'])
  requesterRole!: string;
}

export class RoleConfigDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  roleName!: string;

  @IsArray()
  @IsIn(ROLE_MODULES, { each: true })
  modules!: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  activityFields!: string[];
}

export class RoleConfigQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;
}

export class RoleActivityQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleName?: string;
}

export class CreateRoleActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  actorName!: string;

  @IsString()
  @IsNotEmpty()
  roleName!: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountNaira?: number;

  @IsOptional()
  @IsObject()
  metadata?: { [key: string]: JsonValue };
}
