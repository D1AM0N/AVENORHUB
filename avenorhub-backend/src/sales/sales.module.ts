import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';

@Module({ controllers: [SalesController], providers: [SalesService, TenantAccessGuard] })
export class SalesModule {}
