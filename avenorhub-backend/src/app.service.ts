import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const [tenants, users, products, sales, expenses, auditLogs] = await Promise.all([
      this.prisma.db.orm.public.Tenant.where({ id: tenantId }).all(),
      this.prisma.db.orm.public.User
        .where({ tenantId })
        .select('id', 'tenantId', 'name', 'email', 'role', 'twoFactorEnabled', 'lastLoginIp', 'createdAt')
        .orderBy((user) => user.createdAt.desc())
        .all(),
      this.prisma.db.orm.public.Product.where({ tenantId }).orderBy((product) => product.createdAt.desc()).all(),
      this.prisma.db.orm.public.Sale.where({ tenantId }).orderBy((sale) => sale.saleDate.desc()).all(),
      this.prisma.db.orm.public.Expense.where({ tenantId }).orderBy((expense) => expense.expenseDate.desc()).all(),
      this.prisma.db.orm.public.AuditLog.where({ tenantId }).orderBy((log) => log.createdAt.desc()).all(),
    ]);

    return { tenants, users, products, sales, expenses, auditLogs };
  }
}
