## Context

The MVP for the Data Room is feature-complete but requires comprehensive end-to-end (e2e) test coverage across the core user flow (Slice 12). See proposal.md for motivation. Additionally, a known issue with uploading PDFs needs to be resolved before considering the MVP polished.

## Goals / Non-Goals

**Goals:**
- Implement API-level end-to-end tests covering the entire lifecycle of a file (upload, list, move, share, revoke).
- Resolve the PDF upload issue by ensuring the MIME type sniffing correctly identifies and allows `application/pdf` (FR-FILE-010, BR-040).
- Provide a robust validation script for these flows.

**Non-Goals:**
- Implementing browser-based E2E tests (e.g., Playwright) for the web app; we will focus on API E2E tests using `supertest` and Jest, aligning with the existing NestJS testing setup.
- Fixing other file type uploads if they are not explicitly broken.

## Decisions

### 1. E2E Testing Framework
**Decision**: Use `supertest` and Jest within the existing `apps/api/test` infrastructure.
**Rationale**: The NestJS setup already includes Jest and `supertest` for API-level e2e testing. This avoids introducing a new dependency (like Playwright) and ensures that we can programmatically verify BR-020 (name uniqueness), BR-060 (transactional blob/row), and BR-070 (authorization) directly against the API endpoints.
**Alternative Rejected**: Playwright. Rejected because full browser automation adds significant execution time and CI complexity, whereas the API contract is the primary source of truth for the invariants.

### 2. PDF Upload Fix
**Decision**: Ensure the file upload validation pipe and the MIME type sniffer (e.g., `file-type` or similar) explicitly map the PDF magic bytes to `application/pdf` and that `application/pdf` is in the allow list.
**Rationale**: BR-040 dictates that uploads must be validated on sniffed MIME type. If PDFs are failing, it's likely due to either a missing mapping or a mismatch in the accepted types list.
**Alternative Rejected**: Trusting the client's `Content-Type` header. Rejected because BR-040 explicitly forbids relying on the client's declared type.

## Invariants Maintained

- **BR-020**: The E2E tests will explicitly verify that duplicate uploads result in a suffixed name rather than overwriting.
- **BR-040**: The E2E tests will attempt to upload a valid PDF, an invalid SVG, and a file exceeding the maximum size to verify the upload constraints.
- **BR-050**: The E2E tests will verify that rejected uploads do not create a database row or store an orphan blob.
- **BR-060**: The E2E tests will verify that a failed row write (simulated or provoked) leaves no blob in storage.
- **BR-070**: The E2E tests will verify that actions require the appropriate capabilities and fail with 404 otherwise.

## Risks / Trade-offs

- **Risk**: Flaky E2E tests due to asynchronous file uploads.
  **Mitigation**: Use deterministic wait mechanisms and ensure the database and MinIO are cleanly reset between test runs.

## Validation Script

The validation script will prove at runtime:
- **FR-TEST-010**: Upload, list, move, share, revoke flow.
- **BR-020**: Duplicate file suffixing.
- **BR-040**: Acceptance of PDF bytes and rejection of SVG bytes.
- **BR-060**: Row/blob transactionality.
- **BR-070**: 404 NOT_FOUND for unauthorized access.

Manual Checklist:
- Verify file progress indicators in the UI during upload.
- Verify drag-and-drop functionality in the browser.
