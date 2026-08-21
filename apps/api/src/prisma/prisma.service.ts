import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { readEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

/**
 * The Prisma client as an injectable provider.
 *
 * Prisma 7 has no Rust query engine, so the connection is handed to the client through the pg
 * driver adapter. The runtime uses DATABASE_URL (pooled in production); the CLI uses DIRECT_URL
 * from prisma.config.ts, because migrations cannot run through a pooler.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const { databaseUrl } = readEnv();
    super({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      // `$connect()` is lazy with a driver adapter — it opens no socket, so on its own it would
      // report success against a stopped database. One round trip is what actually proves reach.
      await this.$queryRaw`SELECT 1`;
    } catch (cause) {
      // Naming the variable is the whole point: a wrong DATABASE_URL and a stopped container
      // look identical in Prisma's own message.
      throw new Error(
        'Cannot connect to Postgres using DATABASE_URL. Is `docker compose up -d` running?',
        { cause },
      );
    }

    this.logger.log('Connected to Postgres');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
