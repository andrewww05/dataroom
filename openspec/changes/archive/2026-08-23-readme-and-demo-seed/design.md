## Context

Slices 1–10 are shipped: auth, navigation, folders, files, viewing and sharing all work. The
current README is boilerplate from the repo scaffold. FR-OPS-020 requires replacing it with the
deliverable the brief grades: design decisions, ERD, scaling answers, AI note, setup, hosting
contract. FR-OPS-030 requires a seeded demo account.

## Goals / Non-Goals

**Goals:** Replace the README, ship a `db:seed` command, document demo credentials.

**Non-Goals:** No hosting, no tests beyond the validation script, no new API routes.

## Decisions

### README structure

The README is authored in the repo root as `README.md`. Content is lifted verbatim from
`docs/03-domain-and-api.md` for the ERD, the scaling answers and the hosting contract, as the
spec directs. Sections:

1. One-paragraph product description
2. Setup from a clean clone (`pnpm install`, `cp .env.example .env`, `docker compose up -d`,
   `pnpm --filter @dataroom/api db:migrate`, `pnpm dev`)
3. Demo account — email `demo@example.com`, password `demodemo1` (from env vars
   `SEED_DEMO_EMAIL`, `SEED_DEMO_PASSWORD`)
4. Design decisions (one table: decision → trade-off)
5. ERD — the mermaid block from `docs/03 § ERD`
6. How it scales — the three answers, each as a subsection
7. Running it somewhere else — the four-row table from `docs/03 § Running it somewhere else`
8. AI usage note
9. Configuration — the env var table from `docs/03 § Configuration`
10. Commands — carried from the current README

**Rejected alternative:** generating the README from `docs/` at build time. The brief grades a
file a human reads in a GitHub repo, not a CI artifact; and a templated README cannot carry prose
that adapts its voice to a reader who has not seen the spec.

### Demo seed (`apps/api/prisma/seed.ts`)

A standalone TypeScript script run via `tsx`. Uses `PrismaClient` directly (no Nest, no HTTP) and
the existing `argon2.hash` for the password. Reads `SEED_DEMO_EMAIL` (default
`demo@example.com`) and `SEED_DEMO_PASSWORD` (default `demodemo1`) from the environment.

Structure created:

- User + DataRoom (`"Demo's Data Room"`)
- Root folder (exists from signup-style creation)
- `Q3 Diligence/` — subfolder containing `Financial Summary.pdf`, `Revenue Forecast.csv`
- `Q3 Diligence/Legal/` — subfolder containing `NDA Draft.pdf`
- `Logos/` — subfolder containing `acme-logo.png`
- One public share on `Q3 Diligence/`

Sample files are zero-byte stubs uploaded via `PutObject` — the seed does not bundle real PDFs.
`mimeType` and `sizeBytes` are set to realistic values so the UI renders correctly. Storage keys
follow the existing pattern: `{dataRoomId}/{nodeId}`.

**Idempotency:** the seed queries for the demo email first. If found, it verifies the Data Room
name matches and exits 0. If the name does not match, it exits 1 with a message naming the email.
If not found, it creates everything in one Prisma `$transaction`.

**Env vars added to `.env.example`:**

```
# SEED_DEMO_EMAIL=demo@example.com
# SEED_DEMO_PASSWORD=demodemo1
```

Commented out: the seed reads them with defaults, so they are optional.

### BR-* invariants touched

- **BR-100** — no host, port or credential is hardcoded. `SEED_DEMO_EMAIL` and
  `SEED_DEMO_PASSWORD` are env vars with defaults. The README documents them.

### Validation script

`scripts/validate/readme-and-demo-seed.sh` asserts at runtime:

- **FR-OPS-010** — `GET $API_BASE_URL/health` returns 200.
- **FR-OPS-030** — login with demo credentials returns 200; the Data Room listing contains at
  least one folder.
- **FR-OPS-020** — `README.md` contains the strings `How it scales`, `ERD`, `Running it somewhere
else`, and `AI`.

**Cannot prove at runtime (manual checklist the script prints):**

- The ERD renders correctly on GitHub (mermaid).
- Setup from a truly clean clone (the validation runs against an already-running stack).

## Risks / Trade-offs

- **Zero-byte stubs** — the viewer will show the download button but not render content. This is
  acceptable: the seed is for navigating the structure, not for reading PDFs. Real files can be
  uploaded manually.
- **No cleanup in seed** — the seed is idempotent-create, not idempotent-update. If the demo
  structure needs changing, `pnpm db:reset` followed by `pnpm db:seed` is the path.
