import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Get base connection URL
    const baseUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;

    // Add pgbouncer parameter to disable prepared statements
    // This fixes: PostgresError 42P05: prepared statement "s0" already exists
    const url = baseUrl?.includes('?')
      ? `${baseUrl}&pgbouncer=true`
      : `${baseUrl}?pgbouncer=true`;

    console.log('🆕 Initializing Prisma with pgbouncer mode (prepared statements disabled)');

    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma client connected successfully');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Prisma client disconnected');
  }
}
