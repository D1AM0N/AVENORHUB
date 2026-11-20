import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TenantQueryDto } from '../common/dto/tenant-query.dto';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import type { TenantScopedRequest } from '../common/guards/tenant-access.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(TenantAccessGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(@Query() _query: TenantQueryDto, @Req() request: TenantScopedRequest) {
    return this.analytics.summary(request.tenantId);
  }

  @Get('weekly')
  weekly(@Query() _query: TenantQueryDto, @Req() request: TenantScopedRequest) {
    return this.analytics.weekly(request.tenantId);
  }
}
