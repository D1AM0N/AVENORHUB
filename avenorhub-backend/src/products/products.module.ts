import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';

@Module({ controllers: [ProductsController], providers: [ProductsService, TenantAccessGuard] })
export class ProductsModule {}
