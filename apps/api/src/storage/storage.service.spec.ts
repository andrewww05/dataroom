import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    await service.onModuleInit();
  });

  describe('file operations', () => {
    it('can put, presign, and delete objects in the MinIO bucket', async () => {
      const key = `test-room/test-node-${Date.now()}`;
      const body = Buffer.from('test content');

      // Put
      await service.putObject(key, body, 'text/plain');

      // Presign
      const presigned = await service.presignDownload(key, 'test.txt');
      expect(presigned.url).toContain(key);
      expect(presigned.url).toContain('response-content-disposition=attachment');
      expect(presigned.expiresAt).toBeDefined();

      // Fetch the presigned URL to verify the PUT worked and URL works
      const response = await fetch(presigned.url);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('test content');

      // Delete
      await service.deleteObjects([key]);

      // Fetch again to verify delete
      const fetchAfterDelete = await fetch(presigned.url);
      expect(fetchAfterDelete.status).toBe(404);
    });
    it('can copy objects and fails on missing source', async () => {
      const srcKey = `test-room/src-node-${Date.now()}`;
      const destKey = `test-room/dest-node-${Date.now()}`;
      const body = Buffer.from('test copy content');

      // Put source
      await service.putObject(srcKey, body, 'text/plain');

      // Copy
      await service.copyObject(srcKey, destKey);

      // Verify copied object has same content
      const presigned = await service.presignDownload(destKey, 'test.txt');
      const response = await fetch(presigned.url);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('test copy content');

      // Verify missing source surfaces as a failure
      const missingSrc = `test-room/missing-node-${Date.now()}`;
      await expect(service.copyObject(missingSrc, destKey)).rejects.toThrow();

      // Clean up
      await service.deleteObjects([srcKey, destKey]);
    });
  });
});
