import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const weekStart = (date: Date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string) {
    const filter = { tenantId };
    const [sales, expenses, products] = await Promise.all([
      this.prisma.db.orm.public.Sale.where(filter).all(),
      this.prisma.db.orm.public.Expense.where(filter).all(),
      this.prisma.db.orm.public.Product.where(filter).all(),
    ]);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      gmv: sales.reduce((sum, sale) => sum + sale.amountPaid, 0),
      grossProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
      totalExpenses,
      netProfit: sales.reduce((sum, sale) => sum + sale.profit, 0) - totalExpenses,
      companyExpenses: expenses.filter((expense) => expense.fundingSource === 'Company').reduce((sum, expense) => sum + expense.amount, 0),
      stephenExpenses: expenses.filter((expense) => expense.fundingSource === 'Stephen').reduce((sum, expense) => sum + expense.amount, 0),
      lowStockCount: products.filter((product) => product.stock <= product.threshold).length,
      salesCount: sales.length,
    };
  }

  async weekly(tenantId: string) {
    const filter = { tenantId };
    const [sales, expenses] = await Promise.all([
      this.prisma.db.orm.public.Sale.where(filter).all(),
      this.prisma.db.orm.public.Expense.where(filter).all(),
    ]);
    const rollups = new Map<string, { weekStarting: string; grossSales: number; adsExpense: number; stockExpense: number; otherExpenses: number; netProfit: number; unitsSold: number }>();
    for (const sale of sales) {
      const start = weekStart(sale.saleDate);
      const key = start.toISOString().slice(0, 10);
      const row = rollups.get(key) ?? { weekStarting: key, grossSales: 0, adsExpense: 0, stockExpense: 0, otherExpenses: 0, netProfit: 0, unitsSold: 0 };
      row.grossSales += sale.amountPaid;
      row.netProfit += sale.profit;
      row.unitsSold += sale.quantity;
      rollups.set(key, row);
    }
    for (const expense of expenses) {
      const key = weekStart(expense.expenseDate).toISOString().slice(0, 10);
      const row = rollups.get(key) ?? { weekStarting: key, grossSales: 0, adsExpense: 0, stockExpense: 0, otherExpenses: 0, netProfit: 0, unitsSold: 0 };
      if (expense.category === 'ads') row.adsExpense += expense.amount;
      else if (expense.category === 'restock') row.stockExpense += expense.amount;
      else row.otherExpenses += expense.amount;
      row.netProfit -= expense.amount;
      rollups.set(key, row);
    }
    return [...rollups.values()].sort((a, b) => b.weekStarting.localeCompare(a.weekStarting));
  }
}
