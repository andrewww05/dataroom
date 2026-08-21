# Data Room — spec

Acme Corp is negotiating an acquisition and wants the diligence documents in one place: a virtual
Data Room. So this is a web file manager with an owner — sign in, upload documents, organise them in
nested folders, read them in the browser, and hand the other side a read-only link, public or
restricted, that can be revoked. Built as a take-home exercise, so the spec is scoped to a working
*and deployed* core rather than an enterprise product.

Work is tiered rather than phased. **Core** is everything the brief asks for, including the two
things it asks for that are not features — both apps deployed and publicly reachable, and a README
that answers its three scaling questions. **Polish** is the Drive-like affordances on top.
**Extra credit** is the brief's own optional list: name search, then versioning on name conflicts.
Nothing outside those three tiers is in the plan; see [01 § Cut](./01-scope.md#cut) for what was
dropped and why.

| File | What it holds |
| --- | --- |
| [01-scope.md](./01-scope.md) | The tiers, what was cut, and a traceability table against every line of the brief |
| [02-requirements.md](./02-requirements.md) | Numbered functional requirements and business rules |
| [03-domain-and-api.md](./03-domain-and-api.md) | ERD, data model, storage, REST surface, errors, deployment, "How it scales" |
| [04-ux.md](./04-ux.md) | Screen layout, interactions, keyboard, component inventory, state ownership |
| [05-build-order.md](./05-build-order.md) | Slices in build order with a cut line |

## Ground rules

1. **The server enforces.** Hiding a button is not access control. Every handler resolves a
   principal and asks it for a capability (BR-010, BR-070).
2. **Deployed or it does not count.** Slice 2 deploys an empty app; after that a slice is finished
   when it works on the public URL, not on `localhost` (BR-100).
3. **Testable or it does not count.** Each requirement can be checked by hand in the running app.
4. **One owner per fact.** Limits and rules live in [02](./02-requirements.md); field names,
   endpoints, error codes, hosting and the scaling answers in [03](./03-domain-and-api.md).
   Everything else cites them, and the root README is generated from them (FR-OPS-020).
5. **Cuts are written down, not silently dropped**, and nothing ships disabled — an unimplemented
   feature is removed from the UI, not greyed out.

## Stack

Fixed by the repo (see the root [README](../README.md)): Turborepo, Vite + React 19 in `apps/web`,
NestJS 11 in `apps/api`, shared types in `packages/shared`. That is genuinely all of it —
`apps/web` currently depends on `react` and `react-dom` and nothing else, so every UI choice below
is a decision, not an inheritance.

Added by this spec: Postgres + Prisma, Tailwind v4 + shadcn/ui, TanStack Router + Query, Zustand,
Passport JWT, and an S3-compatible bucket — MinIO locally, Cloudflare R2 in production, one code
path. `docker compose up` starts Postgres and MinIO; nothing else is containerised for local work.

Deployed: `apps/web` on Vercel, `apps/api` on Railway (a persistent process, because uploads stream
through it), Postgres on Neon, blobs on R2. The reasoning is in
[03 § Deployment](./03-domain-and-api.md#deployment).
