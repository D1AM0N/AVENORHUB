import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.db.orm.public.Product
      .where({ tenantId })
      .orderBy((product) => product.name.asc())
      .all();
  }

  async create(dto: CreateProductDto, tenantId: string) {
    if (!(await this.prisma.db.orm.public.Tenant.first({ id: tenantId }))) {
      throw new NotFoundException('Tenant not found');
    }
    const sku = dto.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    return this.prisma.db.orm.public.Product.create({
      tenantId,
      name: dto.name,
      sku,
      location: dto.location?.trim() || null,
      category: dto.category,
      sellingPrice: dto.sellingPrice,
      costPrice: dto.costPrice,
      stock: dto.stock,
      threshold: dto.threshold,
    });
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    const product = await this.prisma.db.orm.public.Product.first({ id, tenantId });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.db.orm.public.Product.where({ id, tenantId }).update(dto);
  }
}
