import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TenantQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;
}
