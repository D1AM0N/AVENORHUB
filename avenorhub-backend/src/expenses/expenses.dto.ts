import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsDateString()
  expenseDate!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsIn(['restock', 'ads', 'logistics', 'payroll', 'setup_ops'])
  category!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitsRestocked?: number;

  @IsString()
  @IsIn(['Company', 'Stephen'])
  fundingSource = 'Company';

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}
