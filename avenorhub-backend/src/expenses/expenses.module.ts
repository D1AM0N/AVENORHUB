import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';

@Module({ controllers: [ExpensesController], providers: [ExpensesService, TenantAccessGuard] })
export class ExpensesModule {}
