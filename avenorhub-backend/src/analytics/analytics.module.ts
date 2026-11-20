import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';

@Module({ controllers: [AnalyticsController], providers: [AnalyticsService, TenantAccessGuard] })
export class AnalyticsModule {}
