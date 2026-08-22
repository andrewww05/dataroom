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

4. **Validation script** (mandatory artifact — see AGENTS.md § Testing Strategy)

   ```bash
   ls scripts/validate/"$CHANGE_NAME".sh
   ```

   - **Missing** — report it as a gap, naming the rule: every change ships
     `scripts/validate/<change-name>.sh`. Without a change name, list every change under
     `openspec/changes/` that has no script.
   - **Present** — run it only if the stack is up (`curl -sf "${API_BASE_URL:-http://localhost:3000/api}/health"`).
     Report its exit code and any failed assertion verbatim. If the API is not reachable, say the
     script was not run and why — do not report it as passing.

5. **Report** — present all four results in one summary:
   - Structural: pass or list issues
   - Build + tests: pass or paste failures
   - Coverage scorecard: covered vs missing scenarios
   - Validation script: present/missing, and its exit code or why it was not run
   - List any missing IDs (advisory, not blocking)

**Guardrails**
- Read-only on repo files: do not modify them. The validation script does write through the API —
  that is its job, and it cleans up after itself
- Advisory: exit cleanly even when coverage gaps exist
- Run all four steps even if one fails
- UI-only scenarios may intentionally lack tests — that is expected, and it is exactly what the
  validation script's printed manual checklist is for
