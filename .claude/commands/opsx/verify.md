Verify spec-to-code-to-test alignment. Advisory — reports gaps but does not block.

Optionally accepts a change name: `/opsx:verify add-auth`. Without it, verifies all specs.

**Steps**

1. **Structural validation**
   ```bash
   openspec validate --all --strict
   ```
   If a change name is given, also run `openspec validate "$CHANGE_NAME" --strict`.
   Report any issues but continue.

2. **Build and tests**
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```
   Report failures verbatim. Continue to step 3 regardless.

3. **Spec ↔ Test mapping**
   ```bash
   scripts/verify-spec-coverage.sh
   ```
   Or if scoped: `scripts/verify-spec-coverage.sh --change "$CHANGE_NAME"`

   The script extracts every `#### Scenario: FR-XXX-NNN` / `#### Scenario: BR-NNN` from specs,
   searches test files for the ID, and prints a markdown scorecard.

4. **Report** — present all three results in one summary:
   - Structural: pass or list issues
   - Build + tests: pass or paste failures
   - Coverage scorecard: covered vs missing scenarios
   - List any missing IDs (advisory, not blocking)

**Guardrails**
- Read-only: do not modify files
- Advisory: exit cleanly even when coverage gaps exist
- Run all three steps even if one fails
- UI-only scenarios may intentionally lack tests — that is expected
