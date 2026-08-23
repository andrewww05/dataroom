## Purpose

Setup from a clean clone, the README deliverable carrying design decisions and the scaling answers,
and the idempotent demo seed.

## Requirements

### Requirement: FR-OPS-010 clean-clone setup

The app MUST run end to end from a clean clone with no cloud account: `docker compose up -d`,
`pnpm install`, one migration command, `pnpm dev`. Nothing in the code SHALL name a host or a vendor.

#### Scenario: FR-OPS-010 health endpoint responds after setup
- **WHEN** `GET /api/health` is called after `docker compose up -d` and `pnpm dev`
- **THEN** the response is `200` with `{ status: "ok" }`

#### Scenario: FR-OPS-010 signup works from a clean state
- **WHEN** `POST /api/auth/signup` is called with a valid email and password
- **THEN** the response is `201` with `{ token, user, dataRoom }`

---

### Requirement: FR-OPS-020 README deliverable

The root README MUST carry: design decisions and their trade-offs, setup instructions that work from
a clean clone, the ERD, the three "How it scales" answers, a note on where and how AI was used,
and what any host has to provide. It MUST replace the current boilerplate README.

#### Scenario: FR-OPS-020 README contains setup from a clean clone
- **WHEN** a reviewer reads the README
- **THEN** it contains a step-by-step guide starting with `pnpm install` through to `pnpm dev`

#### Scenario: FR-OPS-020 README contains the ERD
- **WHEN** a reviewer reads the README
- **THEN** it contains a mermaid ERD showing User, DataRoom, Node, Share

#### Scenario: FR-OPS-020 README contains the three scaling answers
- **WHEN** a reviewer reads the README
- **THEN** it contains answers for subtree stats, 100k files, and viewer/editor roles

#### Scenario: FR-OPS-020 README contains the AI note
- **WHEN** a reviewer reads the README
- **THEN** it contains a section on where and how AI was used

#### Scenario: FR-OPS-020 README contains the hosting contract
- **WHEN** a reviewer reads the README
- **THEN** it contains what any host must provide: persistent Node process, Postgres, S3-compatible bucket, static file server

---

### Requirement: FR-OPS-030 idempotent demo seed

A seeded demo account MUST open onto a populated Data Room with nested folders, sample files, and one
active public share. The seed MUST be idempotent and refuse to touch a database where the demo email
already exists with different data.

#### Scenario: FR-OPS-030 seed creates a populated Data Room
- **WHEN** `pnpm --filter @dataroom/api db:seed` is run against an empty database
- **THEN** a user with `SEED_DEMO_EMAIL` exists, their Data Room contains nested folders and files, and one public share is active

#### Scenario: FR-OPS-030 seed is idempotent on a second run
- **WHEN** `pnpm --filter @dataroom/api db:seed` is run a second time
- **THEN** the command exits 0 without creating duplicates or modifying existing data

#### Scenario: FR-OPS-030 seed refuses to touch mismatched data
- **WHEN** `pnpm --filter @dataroom/api db:seed` is run and the demo email exists but belongs to a different user (different password hash or different Data Room structure)
- **THEN** the command exits non-zero and prints a warning naming the email

#### Scenario: FR-OPS-030 seed credentials are documented
- **WHEN** a reviewer reads the README
- **THEN** the demo email and password are visible so the reviewer can sign in immediately
