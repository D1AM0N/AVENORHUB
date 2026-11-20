import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { TenantScopedRequest } from '../common/guards/tenant-access.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { TenantQueryDto } from '../common/dto/tenant-query.dto';
import { CreateSaleDto } from './sales.dto';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(TenantAccessGuard)
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  list(@Query() _query: TenantQueryDto, @Req() request: TenantScopedRequest) {
    return this.sales.list(request.tenantId);
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @Req() request: TenantScopedRequest) {
    return this.sales.create(dto, request.tenantId);
  }
}
