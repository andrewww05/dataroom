import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

/**
 * A bare client for the schema tests, without Nest's module graph.
 *
 * These tests assert on database behaviour — constraints, cascades, query plans — so they need a
 * real Postgres: `docker compose up -d` and `pnpm --filter @dataroom/api db:migrate`.
 */
export function createTestClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is unset. Copy apps/api/.env.example to apps/api/.env and run ' +
        '`docker compose up -d` from the repo root.',
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
