## 1. Demo seed script

- [x] 1.1 Create `apps/api/prisma/seed.ts`: standalone TypeScript script using `PrismaClient` and
  `argon2.hash`. Reads `SEED_DEMO_EMAIL` (default `demo@example.com`) and `SEED_DEMO_PASSWORD`
  (default `demodemo1`) from environment. Creates: User → DataRoom ("Demo's Data Room") → root
  Node → folders (`Q3 Diligence`, `Q3 Diligence/Legal`, `Logos`) → files (`Financial Summary.pdf`,
  `Revenue Forecast.csv`, `NDA Draft.pdf`, `acme-logo.png`) with zero-byte S3 stubs via
  `PutObject` → one public Share on `Q3 Diligence`. Idempotent: skips if email exists and Data
  Room name matches, exits 1 if name does not match. All writes in one `$transaction`.

- [x] 1.2 Add `"db:seed": "tsx prisma/seed.ts"` to `apps/api/package.json`. Add `tsx` as a dev
  dependency if not already present.

## 2. Environment configuration

- [x] 2.1 Add `SEED_DEMO_EMAIL` and `SEED_DEMO_PASSWORD` to `apps/api/.env.example`, commented out
  with defaults (`demo@example.com`, `demodemo1`).

## 3. README

- [x] 3.1 Rewrite `README.md` (FR-OPS-020): product description, setup from a clean clone, demo
  account credentials, design decisions table, mermaid ERD (from docs/03 § ERD), the three "How it
  scales" answers (from docs/03 § How it scales), "Running it somewhere else" table (from docs/03),
  AI usage note, configuration table, and commands. Remove the current boilerplate including the
  `/api/documents` demo section.

## 4. Validation script

- [x] 4.1 Write `scripts/validate/readme-and-demo-seed.sh`. Asserts: FR-OPS-010 (health returns
  200), FR-OPS-030 (login with demo credentials returns 200, listing contains at least one folder),
  FR-OPS-020 (README.md contains `How it scales`, `ERD`, `Running it somewhere else`, `AI`). Prints
  manual checklist: mermaid renders on GitHub, clean-clone setup verified by hand.

## 5. Documentation sync

- [x] 5.1 Update `docs/` if the implementation diverged from the plan — drop this task if it did
  not.
