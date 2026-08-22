## Why

The MVP is feature-complete but requires comprehensive end-to-end (e2e) tests to ensure stability, particularly for core user flows like uploading, listing, moving, sharing, and revoking access. In addition, there is a known issue with uploading PDF files that needs to be resolved before the MVP is considered fully polished. This change addresses Slice 12 of the build order, delivering BR-020, BR-060, and BR-070.

## What Changes

- Implement full E2E testing coverage for the core MVP user flows (upload -> list -> move -> share -> revoke).
- Fix the issue with PDF uploads to ensure PDF files can be uploaded and processed correctly according to FR-FILE-010 and BR-040.

## Capabilities

### New Capabilities

- `platform/testing`: End-to-end testing of the core user flows to ensure stability and prevent regressions.

### Modified Capabilities

- 

## Impact

- **Affected Code**: E2E test suites (Cypress/Playwright or NestJS E2E), file upload controllers, and validation logic.
- **Dependencies**: No new production dependencies, but test runner configurations may be updated.
- **Systems**: CI/CD pipelines will run the new E2E tests to prevent regressions.
