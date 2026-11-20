import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantQueryDto } from '../common/dto/tenant-query.dto';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import type { TenantScopedRequest } from '../common/guards/tenant-access.guard';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(TenantAccessGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() _query: TenantQueryDto, @Req() request: TenantScopedRequest) {
    return this.products.list(request.tenantId);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() request: TenantScopedRequest) {
    return this.products.create(dto, request.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() request: TenantScopedRequest) {
    return this.products.update(id, dto, request.tenantId);
  }
}
