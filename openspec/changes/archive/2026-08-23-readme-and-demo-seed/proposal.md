## Why

The brief requires three deliverables beyond the working app: a README carrying design decisions,
the ERD, the three scaling answers, the AI note, setup instructions and the hosting contract
(FR-OPS-020); an app that runs end to end from a clean clone (FR-OPS-010); and a seeded demo
account so a reviewer can assess the Data Room without signing up (FR-OPS-030). Slice 11 of
docs/05-build-order.md.

## What Changes

1. **README.md** — the current boilerplate is replaced with the FR-OPS-020 deliverable: design
   decisions and trade-offs, the mermaid ERD, the three "How it scales" answers, the AI note, setup
   from a clean clone, what any host has to provide, and demo credentials. Content is lifted from
   docs/03-domain-and-api.md as the spec directs.
2. **Demo seed** — a `pnpm db:seed` command that creates a demo account with nested folders, a
   handful of sample files (PDFs, images, a CSV), and one active public share. Idempotent: skips if
   the demo email already exists, refuses to touch data that does not match. Credentials in the
   README and .env.example.
3. **.env.example** — adds `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` with commented defaults.

IDs delivered: FR-OPS-010, FR-OPS-020, FR-OPS-030. BR-100 upheld (nothing hardcoded).

## Non-goals

- **Slice 12 (tests)** — unit and integration tests are a separate change.
- **Slice 10 (sharing)** — already shipped; the seed creates a share but adds no sharing code.
- **Slice 13+ (search, polish, versioning)** — extra credit, untouched.
- **Hosting / deployment** — deliberately cut; the README records the contract, not a vendor.

## Capabilities

### New Capabilities

- `platform/delivery`: Setup from a clean clone, the README deliverable, and the idempotent demo
  seed.

### Modified Capabilities

_None._

## Impact

- `README.md` — full rewrite.
- `apps/api/prisma/seed.ts` — new file.
- `apps/api/package.json` — adds `db:seed` script.
- `apps/api/.env.example` — two new variables.
- `scripts/validate/readme-and-demo-seed.sh` — runtime validation.
