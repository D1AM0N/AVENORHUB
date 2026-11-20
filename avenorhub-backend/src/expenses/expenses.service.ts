import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.db.orm.public.Expense
      .where({ tenantId })
      .orderBy((expense) => expense.expenseDate.desc())
      .all();
  }

  async create(dto: CreateExpenseDto, tenantId: string) {
    if (!(await this.prisma.db.orm.public.Tenant.first({ id: tenantId }))) {
      throw new NotFoundException('Tenant not found');
    }
    const { expenseDate, ...expense } = dto;
    return this.prisma.db.orm.public.Expense.create({ ...expense, tenantId, expenseDate: new Date(expenseDate) });
  }
}
