import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './sales.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.db.orm.public.Sale
      .where({ tenantId })
      .orderBy((sale) => sale.saleDate.desc())
      .all();
  }

  async create(dto: CreateSaleDto, tenantId: string) {
    return this.prisma.db.transaction(async (tx) => {
      let costOfGoods = 0;
      if (dto.channel === 'inventory') {
        if (!dto.productId) throw new BadRequestException('productId is required for inventory sales');
        const product = await tx.orm.public.Product
          .where({ id: dto.productId, tenantId })
          .forNoKeyUpdate()
          .first();
        if (!product) throw new NotFoundException('Product not found for tenant');
        if (product.stock < dto.quantity) throw new BadRequestException('Insufficient product stock');
        costOfGoods = product.costPrice * dto.quantity;
        await tx.orm.public.Product.where({ id: product.id, tenantId }).update({ stock: product.stock - dto.quantity });
      }

      const { productId: _productId, ...sale } = dto;
      const sellingPrice = dto.channel === 'inventory'
        ? (dto.sellingPrice ?? dto.unitPrice)
        : dto.sellingPrice;
      const unitPrice = dto.unitPrice ?? sellingPrice;
      return tx.orm.public.Sale.create({
        ...sale,
        tenantId,
        saleDate: new Date(dto.saleDate),
        status: dto.status ?? 'completed',
        unitPrice: unitPrice ?? null,
        sellingPrice: sellingPrice ?? null,
        profit: dto.amountPaid - dto.deliveryOrPartnerCost - costOfGoods,
      });
    });
  }
}
