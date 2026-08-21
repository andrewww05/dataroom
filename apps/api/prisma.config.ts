// Prisma 7 reads connection URLs from here rather than from schema.prisma.
// The CLI (migrate, studio) uses DIRECT_URL, because migrations cannot run through a connection
// pooler; the runtime client gets DATABASE_URL through the pg driver adapter in
// src/prisma/prisma.service.ts. Locally the two URLs are identical.
import 'dotenv/config';

import { defineConfig } from 'prisma/config';

// `prisma generate` runs on a clean clone before `.env` exists (see the postinstall script), and
// loading this file eagerly resolves the datasource — so a missing URL is left unset rather than
// thrown here. Commands that actually need a connection fail with Prisma's own message.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(url ? { datasource: { url } } : {}),
});
