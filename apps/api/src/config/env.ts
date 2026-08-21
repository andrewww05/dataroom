/**
 * Environment contract for the API. Every variable is listed in apps/api/.env.example with the
 * default that matches the `docker compose up -d` stack in the repo root.
 *
 * A process that cannot reach its database or its bucket must not serve requests, so a missing
 * connection variable aborts boot here rather than surfacing as a 500 on the first request.
 */

/** Variables without a sensible default — boot fails when one is missing. */
const REQUIRED = ['DATABASE_URL', 'S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'];

export interface Env {
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
  };
}

/**
 * Passed to `ConfigModule.forRoot({ validate })`, so Nest refuses to build the module graph when
 * the environment is incomplete. The message names every missing variable at once — finding them
 * one boot at a time is the slow way.
 */
export function validateEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => {
    const value = raw[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy apps/api/.env.example to apps/api/.env — its defaults match `docker compose up -d`.',
    );
  }

  return raw;
}

/** Reads the validated environment into one typed object. */
export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  validateEnv(source as Record<string, unknown>);

  return {
    port: Number(source.PORT ?? 3000),
    corsOrigins: (source.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    databaseUrl: source.DATABASE_URL as string,
    s3: {
      endpoint: source.S3_ENDPOINT as string,
      region: source.S3_REGION ?? 'us-east-1',
      bucket: source.S3_BUCKET as string,
      accessKey: source.S3_ACCESS_KEY as string,
      secretKey: source.S3_SECRET_KEY as string,
      // MinIO needs path-style addressing; most hosted S3 stores do not.
      forcePathStyle: (source.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    },
  };
}
