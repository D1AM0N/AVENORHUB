import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantQueryDto } from '../common/dto/tenant-query.dto';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import type { TenantScopedRequest } from '../common/guards/tenant-access.guard';
import { CreateExpenseDto } from './expenses.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(TenantAccessGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Query() _query: TenantQueryDto, @Req() request: TenantScopedRequest) {
    return this.expenses.list(request.tenantId);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @Req() request: TenantScopedRequest) {
    return this.expenses.create(dto, request.tenantId);
  }
}
