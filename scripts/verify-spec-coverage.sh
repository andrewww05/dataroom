#!/usr/bin/env bash
# verify-spec-coverage.sh — Spec ↔ Test mapping report
#
# Scans OpenSpec specs (and optionally a change's delta specs) for Scenario lines,
# extracts FR-/BR- IDs, and searches test files for matching references.
# Produces a markdown-formatted advisory scorecard. Exit 0 always (advisory).
#
# Usage:
#   scripts/verify-spec-coverage.sh                     # scan openspec/specs/
#   scripts/verify-spec-coverage.sh --change <name>     # also scan the change's delta specs
#   scripts/verify-spec-coverage.sh --json              # JSON output instead of markdown

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPECS_DIR="$ROOT/openspec/specs"
CHANGE_NAME=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change)
      CHANGE_NAME="$2"
      shift 2
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Build a temp directory for intermediate files
TMPDIR_VERIFY="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_VERIFY"' EXIT

# Collect scenario lines: "ID|title|source_file"
SCENARIOS_FILE="$TMPDIR_VERIFY/scenarios.tsv"
: > "$SCENARIOS_FILE"

extract_scenarios() {
  local spec_file="$1"
  local rel_path="${spec_file#"$ROOT/"}"
  grep '^#### Scenario:' "$spec_file" 2>/dev/null | while IFS= read -r line; do
    local id
    id=$(echo "$line" | grep -oE '(FR-[A-Z]+-[0-9]+|BR-[0-9]+)' | head -1 || true)
    if [[ -n "$id" ]]; then
      local title="${line#*Scenario: }"
      printf '%s\t%s\t%s\n' "$id" "$title" "$rel_path"
    fi
  done
}

# Scan main specs
find "$SPECS_DIR" -name 'spec.md' -print 2>/dev/null | while IFS= read -r f; do
  extract_scenarios "$f"
done >> "$SCENARIOS_FILE"

# If a change is specified, also scan its delta specs
if [[ -n "$CHANGE_NAME" ]]; then
  CHANGE_DIR="$ROOT/openspec/changes/$CHANGE_NAME"
  if [[ -d "$CHANGE_DIR/specs" ]]; then
    find "$CHANGE_DIR/specs" -name 'spec.md' -print 2>/dev/null | while IFS= read -r f; do
      extract_scenarios "$f"
    done >> "$SCENARIOS_FILE"
  fi
fi

if [[ ! -s "$SCENARIOS_FILE" ]]; then
  echo "No spec scenarios found." >&2
  exit 0
fi

# Deduplicate by ID (keep first occurrence), sort
UNIQUE_FILE="$TMPDIR_VERIFY/unique.tsv"
sort -t$'\t' -k1,1 -u "$SCENARIOS_FILE" > "$UNIQUE_FILE"

# Search test files for each ID
RESULTS_FILE="$TMPDIR_VERIFY/results.tsv"
: > "$RESULTS_FILE"

covered=0
missing=0
total=0

while IFS=$'\t' read -r id title source; do
  total=$((total + 1))
  # Search across all test file patterns
  match_file=$(grep -rl "$id" "$ROOT/apps" \
    --include='*.spec.ts' \
    --include='*.spec.tsx' \
    --include='*.e2e-spec.ts' \
    --include='*.test.ts' \
    --include='*.test.tsx' \
    2>/dev/null | head -1 || true)

  if [[ -n "$match_file" ]]; then
    rel_match="${match_file#"$ROOT/"}"
    printf '%s\t%s\t%s\t%s\t%s\n' "$id" "covered" "$title" "$source" "$rel_match" >> "$RESULTS_FILE"
    covered=$((covered + 1))
  else
    printf '%s\t%s\t%s\t%s\t%s\n' "$id" "missing" "$title" "$source" "" >> "$RESULTS_FILE"
    missing=$((missing + 1))
  fi
done < "$UNIQUE_FILE"

# Output
if $JSON_OUTPUT; then
  echo "{"
  echo "  \"total\": $total,"
  echo "  \"covered\": $covered,"
  echo "  \"missing\": $missing,"
  echo "  \"scenarios\": ["
  first=true
  while IFS=$'\t' read -r id status title source test_file; do
    if $first; then first=false; else echo ","; fi
    # Escape quotes in title
    title="${title//\"/\\\"}"
    printf '    {"id": "%s", "status": "%s", "title": "%s", "source": "%s", "testFile": "%s"}' \
      "$id" "$status" "$title" "$source" "$test_file"
  done < "$RESULTS_FILE"
  echo ""
  echo "  ]"
  echo "}"
else
  echo "# Spec ↔ Test Coverage Report"
  echo ""
  echo "| Status | Scenarios |"
  echo "|--------|-----------|"
  echo "| ✅ Covered | $covered |"
  echo "| ⚠️  Missing | $missing |"
  echo "| **Total** | **$total** |"
  echo ""

  if [[ $missing -gt 0 ]]; then
    echo "## ⚠️ Scenarios Without Test Coverage"
    echo ""
    while IFS=$'\t' read -r id status title source _test_file; do
      if [[ "$status" == "missing" ]]; then
        echo "- **$id** — $title"
        echo "  Source: \`$source\`"
      fi
    done < "$RESULTS_FILE"
    echo ""
  fi

  if [[ $covered -gt 0 ]]; then
    echo "## ✅ Covered Scenarios"
    echo ""
    while IFS=$'\t' read -r id status title _source test_file; do
      if [[ "$status" == "covered" ]]; then
        echo "- **$id** — $title"
        echo "  Test: \`$test_file\`"
      fi
    done < "$RESULTS_FILE"
    echo ""
  fi

  echo "---"
  echo "*Advisory report — does not block archive or apply.*"
fi
