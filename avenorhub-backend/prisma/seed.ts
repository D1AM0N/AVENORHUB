import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();
const db = prisma.db;
const today = new Date();
const daysAgo = (days: number) => new Date(today.getTime() - days * 86_400_000);

async function seed() {
  const tenantData = [
    { id: 'seed-tenant-avenor', name: 'Avenor Retail Ltd', slug: 'avenor-retail', currencySymbol: '₦', status: 'active', mrrAmount: 150000 },
    { id: 'seed-tenant-kano', name: 'Kano Agro Imports', slug: 'kano-agro-imports', currencySymbol: '₦', status: 'active', mrrAmount: 85000 },
    { id: 'seed-tenant-lekki', name: 'Lekki Gadgets Hub', slug: 'lekki-gadgets-hub', currencySymbol: '₦', status: 'active', mrrAmount: 120000 },
  ];
  const tenants = [];
  for (const tenant of tenantData) {
    const existing = await db.orm.public.Tenant.first({ slug: tenant.slug });
    tenants.push(existing
      ? await db.orm.public.Tenant.where({ id: existing.id }).update({ ...tenant, id: existing.id })
      : await db.orm.public.Tenant.create(tenant));
  }
  const primaryTenant = tenants[0];
  if (!primaryTenant) throw new Error('Primary seed tenant was not created');

  const passwordHash = await hash('Avenor@2026', 10);
  const userRows = [
    { id: 'seed-user-super-admin', name: 'Avenor Super Admin', email: 'admin@avenorhub.ng', role: 'super_admin', tenantId: null },
    { id: 'seed-user-tenant-admin', name: 'Stephen', email: 'stephen@avenor.ng', role: 'tenant_admin', tenantId: primaryTenant.id },
    { id: 'seed-user-cashier', name: 'Avenor Sales', email: 'sales@avenor.ng', role: 'cashier', tenantId: primaryTenant.id },
  ];
  for (const user of userRows) {
    const existing = await db.orm.public.User.first({ email: user.email });
    const data = { ...user, id: existing?.id ?? user.id, passwordHash, twoFactorEnabled: user.role === 'super_admin' };
    if (existing) await db.orm.public.User.where({ id: existing.id }).update(data);
    else await db.orm.public.User.create(data);
  }

  const productRows = [
    { id: 'seed-product-promo', name: 'Avenor Essentials - Promo Tier', sku: 'AVN-PROMO-25', category: 'Essentials', sellingPrice: 25000, costPrice: 18500, stock: 42, threshold: 8 },
    { id: 'seed-product-abuja', name: 'Avenor Essentials - Abuja Standard', sku: 'AVN-ABJ-27', category: 'Essentials', sellingPrice: 27000, costPrice: 19500, stock: 28, threshold: 6 },
    { id: 'seed-product-standard', name: 'Avenor Essentials - Standard', sku: 'AVN-STD-30', category: 'Essentials', sellingPrice: 30000, costPrice: 22000, stock: 19, threshold: 5 },
    { id: 'seed-product-interstate', name: 'Avenor Essentials - Interstate/Lagos', sku: 'AVN-LAG-32', category: 'Essentials', sellingPrice: 32000, costPrice: 23500, stock: 3, threshold: 5 },
  ];
  for (const product of productRows) {
    const { id, ...data } = product;
    const existing = await db.orm.public.Product.first({ id });
    if (existing) await db.orm.public.Product.where({ id }).update({ tenantId: primaryTenant.id, ...data });
    else await db.orm.public.Product.create({ id, tenantId: primaryTenant.id, ...data });
  }

  const saleRows = [
    { id: 'seed-sale-abuja', location: 'Abuja', amountPaid: 1000000, channel: 'inventory', partnerName: null, deliveryOrPartnerCost: 25000, quantity: 34, days: 1, status: 'completed', profit: 235000 },
    { id: 'seed-sale-lagos', location: 'Lagos', amountPaid: 850000, channel: 'outsourced', partnerName: 'Aby', deliveryOrPartnerCost: 42000, quantity: 29, days: 2, status: 'completed', profit: 196000 },
    { id: 'seed-sale-ph', location: 'PH', amountPaid: 600000, channel: 'outsourced', partnerName: 'Dahyah', deliveryOrPartnerCost: 38000, quantity: 21, days: 3, status: 'delivery_default', profit: 138000 },
    { id: 'seed-sale-benin', location: 'Benin', amountPaid: 450000, channel: 'inventory', partnerName: null, deliveryOrPartnerCost: 18000, quantity: 16, days: 4, status: 'completed', profit: 104000 },
    { id: 'seed-sale-warri', location: 'Warri', amountPaid: 400000, channel: 'outsourced', partnerName: 'Oniks', deliveryOrPartnerCost: 25000, quantity: 14, days: 5, status: 'delivery_default', profit: 91000 },
    { id: 'seed-sale-asaba', location: 'Asaba', amountPaid: 350000, channel: 'inventory', partnerName: null, deliveryOrPartnerCost: 12000, quantity: 12, days: 8, status: 'completed', profit: 82000 },
    { id: 'seed-sale-enugu', location: 'Enugu', amountPaid: 305000, channel: 'outsourced', partnerName: 'Aby', deliveryOrPartnerCost: 21000, quantity: 11, days: 10, status: 'completed', profit: 69000 },
  ];
  for (const sale of saleRows) {
    const { id, days, ...data } = sale;
    const existing = await db.orm.public.Sale.first({ id });
    const values = { ...data, tenantId: primaryTenant.id, saleDate: daysAgo(days) };
    if (existing) await db.orm.public.Sale.where({ id }).update(values);
    else await db.orm.public.Sale.create({ id, ...values });
  }

  const expenseRows = [
    { id: 'seed-expense-restock', category: 'restock', description: 'Monthly stock replenishment', fundingSource: 'Company', amount: 480000, unitsRestocked: 120, days: 2 },
    { id: 'seed-expense-ads', category: 'ads', description: 'November campaign spend', fundingSource: 'Company', amount: 125000, unitsRestocked: null, days: 3 },
    { id: 'seed-expense-logistics', category: 'logistics', description: 'Interstate delivery runs', fundingSource: 'Stephen', amount: 68000, unitsRestocked: null, days: 4 },
    { id: 'seed-expense-payroll', category: 'payroll', description: 'Sales team payroll', fundingSource: 'Company', amount: 350000, unitsRestocked: null, days: 7 },
    { id: 'seed-expense-setup', category: 'setup_ops', description: 'Store operations setup', fundingSource: 'Stephen', amount: 95000, unitsRestocked: null, days: 9 },
  ];
  for (const expense of expenseRows) {
    const { id, days, ...data } = expense;
    const existing = await db.orm.public.Expense.first({ id });
    const values = { ...data, tenantId: primaryTenant.id, expenseDate: daysAgo(days) };
    if (existing) await db.orm.public.Expense.where({ id }).update(values);
    else await db.orm.public.Expense.create({ id, ...values });
  }

  const auditRows = [
    { id: 'seed-audit-initialized', actorEmail: 'admin@avenorhub.ng', action: 'seed_initialized', target: 'AvenorHub platform', ipAddress: '127.0.0.1' },
    { id: 'seed-audit-tenant', actorEmail: 'admin@avenorhub.ng', action: 'tenant_created', target: 'Avenor Retail Ltd', ipAddress: '127.0.0.1' },
  ];
  for (const log of auditRows) {
    const existing = await db.orm.public.AuditLog.first({ id: log.id });
    if (existing) await db.orm.public.AuditLog.where({ id: log.id }).update(log);
    else await db.orm.public.AuditLog.create(log);
  }

  const gmv = saleRows.reduce((total, sale) => total + sale.amountPaid, 0);
  if (gmv !== 3_955_000) throw new Error(`Seed GMV mismatch: ${gmv}`);
  console.log(`Seeded ${tenants.length} tenants, ${userRows.length} users, ${productRows.length} products, ${saleRows.length} sales (₦${gmv.toLocaleString('en-NG')} GMV), and ${expenseRows.length} expenses.`);
}

seed()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
