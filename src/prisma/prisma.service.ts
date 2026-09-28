import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.schema.js';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
      log:
        config.get('NODE_ENV', { infer: true }) === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    // With a driver adapter $connect() is lazy and resolves even when the
    // database is unreachable, so run a real query to fail fast on startup.
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      const code =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? ` (${error.code})`
          : '';
      throw new Error(`Cannot connect to the database at startup${code}`, {
        cause: error,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
