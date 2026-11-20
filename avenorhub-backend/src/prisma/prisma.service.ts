import 'dotenv/config';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from '../../prisma/schema';
import contractJson from '../../prisma/schema.json';

const contract = contractFromJson<Contract>(contractJson);

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly db = postgres({ contract, url: process.env.DATABASE_URL });

  async onModuleDestroy(): Promise<void> {
    await this.db.close();
  }
}
