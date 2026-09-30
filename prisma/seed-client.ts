import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnv } from '../src/config/env.schema.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

export function createSeedClient(): PrismaClient {
  const { DATABASE_URL } = validateEnv(process.env);

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });
}
