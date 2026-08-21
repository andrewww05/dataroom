import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { readEnv } from '../config/env';

/**
 * The S3-compatible client and its bucket.
 *
 * One code path everywhere: MinIO from `docker compose` locally, any S3-compatible store wherever
 * this ends up hosted. Only the endpoint, the credentials and path-style addressing differ, and no
 * vendor is named here — that choice belongs to whoever deploys it.
 *
 * The bucket is created on boot if it is missing, so a clean clone needs no console visit. Object
 * keys will be `{dataRoomId}/{nodeId}`; nothing writes one yet.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly env = readEnv().s3;
  readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: this.env.endpoint,
      region: this.env.region,
      forcePathStyle: this.env.forcePathStyle,
      credentials: { accessKeyId: this.env.accessKey, secretAccessKey: this.env.secretKey },
    });
  }

  get bucket(): string {
    return this.env.bucket;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /**
   * `HeadBucket` then `CreateBucket` on a 404. Private by default: no ACL is sent, so the bucket
   * is owner-only and every read is a presigned URL.
   */
  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" is present`);
      return;
    } catch (error) {
      if (!isMissingBucket(error)) {
        throw new Error(
          `Cannot reach the object store at S3_ENDPOINT=${this.env.endpoint}. ` +
            'Is `docker compose up -d` running?',
          { cause: error },
        );
      }
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created bucket "${this.bucket}"`);
    } catch (cause) {
      throw new Error(
        `Cannot create bucket "${this.bucket}" at S3_ENDPOINT=${this.env.endpoint}.`,
        { cause },
      );
    }
  }
}

/** A missing bucket is a 404 / NotFound / NoSuchBucket; anything else is an unreachable store. */
function isMissingBucket(error: unknown): boolean {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    candidate?.$metadata?.httpStatusCode === 404 ||
    candidate?.name === 'NotFound' ||
    candidate?.name === 'NoSuchBucket'
  );
}
