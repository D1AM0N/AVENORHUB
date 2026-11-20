import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsDateString()
  saleDate!: string;

  @IsString()
  @IsIn(['inventory', 'direct', 'outsourced'])
  channel!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  partnerName?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryOrPartnerCost = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @IsOptional()
  @IsIn(['completed', 'delivery_default'])
  status?: string;

  @ValidateIf((sale: CreateSaleDto) => sale.channel === 'inventory')
  @IsString()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice?: number;
}
