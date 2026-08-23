#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
API="${API_BASE_URL:-http://localhost:3000/api}"

# Verify API is reachable (BR-050).
if ! curl -sf "${API}/health" >/dev/null 2>&1; then
  echo "ERROR: API unreachable at ${API}"
  exit 1
fi

echo "=== Rich Link Previews validation script ==="
echo "API: ${API}"
echo

# ── Helpers ────────────────────────────────────────────────────────────────────
RUN="$(openssl rand -hex 4)"
OWNER_EMAIL="preview-val-owner-${RUN}@example.test"
PASS="ValidPass123!"

pass()  { echo "  PASS  $1"; }
fail()  { echo "  FAIL  $1 — expected $2, got $3"; exit 1; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label" "$expected" "$actual"
  fi
}

# ── Setup: create account and folder ──────────────────────────────────────────
echo "--- Setup ---"
OWNER_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"password\":\"${PASS}\"}")
OWNER_TOKEN=$(echo "$OWNER_RES" | jq -r '.token')
ROOT_ID=$(echo "$OWNER_RES" | jq -r '.dataRoom.rootId')

FOLDER_RES=$(curl -sf -X POST "${API}/nodes/folders" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${ROOT_ID}\",\"name\":\"rich-preview-test-${RUN}\"}")
FOLDER_ID=$(echo "$FOLDER_RES" | jq -r '.id')

# Create a public share
SHARE_RES=$(curl -s -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"PUBLIC\"}")
PUB_TOKEN=$(echo "$SHARE_RES" | jq -r '.token')

echo "  Owner: ${OWNER_EMAIL}"
echo "  Folder: ${FOLDER_ID}"
echo

# ── FR-SHARE-090: Valid token returns 200 with OG tags ────────────────────────
echo "--- FR-SHARE-090: Valid token returns OG tags ---"
HTTP_CODE=$(curl -s -o /tmp/preview_ok.html -w '%{http_code}' \
  "${API}/shares/preview/${PUB_TOKEN}")

assert_status "FR-SHARE-090 preview valid token" "200" "$HTTP_CODE"

HTML=$(cat /tmp/preview_ok.html)
if echo "$HTML" | grep -q "<title>rich-preview-test-${RUN} - Dataroom</title>" && \
   echo "$HTML" | grep -q "<meta property=\"og:title\" content=\"rich-preview-test-${RUN}\">" && \
   echo "$HTML" | grep -q "<meta property=\"og:site_name\" content=\"Dataroom\">"; then
  pass "FR-SHARE-090 HTML contains expected OG tags"
else
  fail "FR-SHARE-090 HTML OG tags missing" "expected tags" "$HTML"
fi

# ── FR-SHARE-090: Invalid token returns 404 ───────────────────────────────────
echo "--- FR-SHARE-090: Invalid token returns 404 ---"
HTTP_CODE=$(curl -s -o /tmp/preview_404.json -w '%{http_code}' \
  "${API}/shares/preview/invalid-token-123")

assert_status "FR-SHARE-090 preview invalid token" "404" "$HTTP_CODE"

# ── Cleanup ──────────────────────────────────────────────────────────────────
echo
echo "--- Cleanup ---"
curl -sf -X DELETE "${API}/nodes/${FOLDER_ID}" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" >/dev/null 2>&1 || true

rm -f /tmp/preview_ok.html /tmp/preview_404.json

echo
echo "=== All assertions passed ==="
echo
echo "=== Manual checklist (browser-only) ==="
echo "  [ ] Test with Twitter Card Validator or Slack to ensure the bot fetches the OG tags via reverse proxy configuration"
