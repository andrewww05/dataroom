## 1. API Fixes

- [x] 1.1 Fix PDF upload validation. Verify by running `pnpm test --filter @dataroom/api` with a new unit test that sends a mocked PDF buffer and asserts a 201 response.

## 2. Testing & E2E

- [x] 2.1 Set up E2E test data seeding and teardown in the NestJS E2E environment. Verify by running `pnpm test:e2e` with an empty test that successfully connects to the database and MinIO.
- [x] 2.2 Implement E2E test for the core flow (Upload → List → Move → Share → Revoke). Verify by asserting 2xx status codes and checking database state (FR-TEST-010).
- [x] 2.3 Implement E2E tests for duplicate file name handling. Verify by attempting to upload the same file twice and asserting the suffixed name in the 201 response (BR-020).
- [x] 2.4 Implement E2E tests for capability-based authorization. Verify by asserting 404 NOT_FOUND when a principal attempts an unauthorized action (BR-070).
- [x] 2.5 Implement E2E tests for transactional guarantees and upload validation. Verify by asserting 415 UNSUPPORTED_TYPE on SVG upload, 413 FILE_TOO_LARGE on oversized files, and checking that failed uploads leave no blob in MinIO (BR-040, BR-060).

## 3. Validation

- [x] 3.1 Write `scripts/validate/e2e-and-pdf-upload-fix.sh`. Verify by running it against the running stack and ensuring it exits 0 while proving FR-TEST-010, BR-020, BR-040, BR-060, and BR-070.
- [x] 3.2 Update `docs/` if the implementation diverged from the plan. Verify by reading the changes before creating a commit.
