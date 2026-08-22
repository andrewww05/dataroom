---
name: openspec-verify
description: Verify spec-to-code-to-test alignment for an OpenSpec change or the whole project. Use when the user wants to check that specs have matching tests, that the build passes, and that structural validation is clean.
license: MIT
metadata:
  author: dataroom
  version: '1.0'
---

Verify the quality of an OpenSpec change or the entire project. This is an **advisory** check — it reports gaps but does not block archive or apply.

**Input**: Optionally specify a change name (e.g., "verify add-auth"). If omitted, verify all specs. Also accepts `--json` for machine-readable output.

**Steps**

1. **Structural validation**

   Run `openspec validate --all --strict` (or `--change "<name>"` if scoped to one change).
   Report any structural issues found. If validation fails, list the errors but continue.

2. **Build and test**

   Run:

   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```

   Report any failures verbatim. This step confirms the code compiles, lints clean, and all existing tests pass.

3. **Spec ↔ Test mapping**

   Run the coverage mapping script:

   ```bash
   scripts/verify-spec-coverage.sh
   ```

   Or, if scoped to a change:

   ```bash
   scripts/verify-spec-coverage.sh --change "<name>"
   ```

   This extracts every `#### Scenario: FR-XXX-NNN ...` / `#### Scenario: BR-NNN ...` from the specs and searches test files (`*.spec.ts`, `*.e2e-spec.ts`, `*.test.ts`, `*.test.tsx`) for matching references.

4. **Present the scorecard**

   Display:
   - Structural validation result (pass/fail + issues)
   - Build + test result (pass/fail + failures)
   - Spec ↔ Test scorecard:
     - Total scenarios
     - Covered (ID appears in at least one test)
     - Missing (ID not found in any test) — **advisory, not a blocker**
   - List of missing scenario IDs with their spec source

**Output**

```
## Verification Report

### Structural Validation
✓ All specs valid (or list issues)

### Build & Tests
✓ typecheck passed
✓ lint passed
✓ tests passed (N suites, M tests)

### Spec ↔ Test Coverage
| Status | Scenarios |
|--------|-----------|
| ✅ Covered | 42 |
| ⚠️  Missing | 3 |
| **Total** | **45** |

#### ⚠️ Scenarios Without Test Coverage
- **FR-NAV-020** — Breadcrumbs rendering
  Source: `openspec/specs/navigation/spec.md`
- ...

---
*Advisory report — does not block archive or apply.*
```

**Guardrails**

- This is advisory only — it reports gaps but never blocks a workflow step
- Always run all three checks (structural, build, coverage) even if one fails
- Do not modify any files — this is a read-only verification
- UI-only scenarios (e.g., "the layout renders the three-pane shell") may intentionally lack test coverage — that is expected, not a bug
- The spec coverage script uses `grep` and needs no extra dependencies
