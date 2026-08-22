#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
API="${API_BASE_URL:-http://localhost:3000/api}"

# Verify API is reachable (BR-050).
if ! curl -sf "${API}/health" >/dev/null 2>&1; then
  echo "ERROR: API unreachable at ${API}"
  exit 1
fi

echo "=== Sharing validation script ==="
echo "API: ${API}"
echo

# ── Helpers ────────────────────────────────────────────────────────────────────
RUN="$(openssl rand -hex 4)"
OWNER_EMAIL="share-val-owner-${RUN}@example.test"
GRANTEE_EMAIL="share-val-grantee-${RUN}@example.test"
OTHER_EMAIL="share-val-other-${RUN}@example.test"
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

assert_code() {
  local label="$1" expected="$2" body="$3"
  local actual
  actual=$(echo "$body" | jq -r '.code // empty')
  if [[ "$actual" == "$expected" ]]; then
    pass "$label (code=$expected)"
  else
    fail "$label" "code=$expected" "code=$actual"
  fi
}

# ── Setup: create accounts ────────────────────────────────────────────────────
echo "--- Setup ---"
OWNER_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"password\":\"${PASS}\"}")
OWNER_TOKEN=$(echo "$OWNER_RES" | jq -r '.token')
ROOT_ID=$(echo "$OWNER_RES" | jq -r '.dataRoom.rootId')

GRANTEE_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${GRANTEE_EMAIL}\",\"password\":\"${PASS}\"}")
GRANTEE_TOKEN=$(echo "$GRANTEE_RES" | jq -r '.token')

OTHER_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OTHER_EMAIL}\",\"password\":\"${PASS}\"}")
OTHER_TOKEN=$(echo "$OTHER_RES" | jq -r '.token')

# Create a test folder and a child folder
FOLDER_RES=$(curl -sf -X POST "${API}/nodes/folders" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${ROOT_ID}\",\"name\":\"share-test-folder-${RUN}\"}")
FOLDER_ID=$(echo "$FOLDER_RES" | jq -r '.id')

CHILD_RES=$(curl -sf -X POST "${API}/nodes/folders" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${FOLDER_ID}\",\"name\":\"child-folder-${RUN}\"}")
CHILD_ID=$(echo "$CHILD_RES" | jq -r '.id')

echo "  Owner: ${OWNER_EMAIL}"
echo "  Grantee: ${GRANTEE_EMAIL}"
echo "  Folder: ${FOLDER_ID}"
echo

# ── FR-SHARE-010: create PUBLIC share ──────────────────────────────────────────
echo "--- FR-SHARE-010: create PUBLIC share ---"
HTTP_CODE=$(curl -s -o /tmp/share_pub.json -w '%{http_code}' \
  -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"PUBLIC\"}")
assert_status "FR-SHARE-010 create PUBLIC share" "201" "$HTTP_CODE"
PUB_TOKEN=$(jq -r '.token' /tmp/share_pub.json)
PUB_SHARE_ID=$(jq -r '.id' /tmp/share_pub.json)

# ── FR-SHARE-010: create RESTRICTED share ─────────────────────────────────────
echo "--- FR-SHARE-010: create RESTRICTED share ---"
HTTP_CODE=$(curl -s -o /tmp/share_rest.json -w '%{http_code}' \
  -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"RESTRICTED\",\"granteeEmail\":\"${GRANTEE_EMAIL}\"}")
assert_status "FR-SHARE-010 create RESTRICTED share" "201" "$HTTP_CODE"
REST_TOKEN=$(jq -r '.token' /tmp/share_rest.json)
REST_SHARE_ID=$(jq -r '.id' /tmp/share_rest.json)

# ── FR-SHARE-010: RESTRICTED without granteeEmail → 400 ──────────────────────
echo "--- FR-SHARE-010: RESTRICTED without granteeEmail ---"
HTTP_CODE=$(curl -s -o /tmp/share_bad.json -w '%{http_code}' \
  -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"RESTRICTED\"}")
assert_status "FR-SHARE-010 RESTRICTED without granteeEmail" "400" "$HTTP_CODE"
assert_code  "FR-SHARE-010 RESTRICTED without granteeEmail" "VALIDATION_FAILED" "$(cat /tmp/share_bad.json)"

# ── FR-SHARE-020: PUBLIC token resolves without auth ──────────────────────────
echo "--- FR-SHARE-020: PUBLIC token resolves ---"
HTTP_CODE=$(curl -s -o /tmp/resolve_pub.json -w '%{http_code}' \
  "${API}/shares/resolve?token=${PUB_TOKEN}")
assert_status "FR-SHARE-020 PUBLIC token resolves" "200" "$HTTP_CODE"

# ── FR-SHARE-030: share principal cannot create folders ───────────────────────
echo "--- FR-SHARE-030: share principal read-only ---"
HTTP_CODE=$(curl -s -o /tmp/share_readonly.json -w '%{http_code}' \
  -X POST "${API}/nodes/folders" \
  -H "Authorization: Share ${PUB_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${FOLDER_ID}\",\"name\":\"hacked\"}")
assert_status "FR-SHARE-030 share principal write" "403" "$HTTP_CODE"
assert_code  "FR-SHARE-030 share principal write" "READ_ONLY" "$(cat /tmp/share_readonly.json)"

# ── FR-SHARE-060: list shares on node ─────────────────────────────────────────
echo "--- FR-SHARE-060: list shares on node ---"
HTTP_CODE=$(curl -s -o /tmp/node_shares.json -w '%{http_code}' \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  "${API}/nodes/${FOLDER_ID}/shares")
assert_status "FR-SHARE-060 list shares" "200" "$HTTP_CODE"
OWN_COUNT=$(jq '.own | length' /tmp/node_shares.json)
if [[ "$OWN_COUNT" -ge 2 ]]; then
  pass "FR-SHARE-060 own shares count >= 2"
else
  fail "FR-SHARE-060 own shares count" ">= 2" "$OWN_COUNT"
fi

# ── FR-SHARE-060: inherited from ancestor ────────────────────────────────────
echo "--- FR-SHARE-060: inherited from ancestor ---"
HTTP_CODE=$(curl -s -o /tmp/child_shares.json -w '%{http_code}' \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  "${API}/nodes/${CHILD_ID}/shares")
assert_status "FR-SHARE-060 child shares" "200" "$HTTP_CODE"
INHERITED_ID=$(jq -r '.inheritedFrom.id // empty' /tmp/child_shares.json)
if [[ "$INHERITED_ID" == "$FOLDER_ID" ]]; then
  pass "FR-SHARE-060 inheritedFrom points to parent"
else
  fail "FR-SHARE-060 inheritedFrom" "$FOLDER_ID" "$INHERITED_ID"
fi

# ── FR-SHARE-080: received shares ────────────────────────────────────────────
echo "--- FR-SHARE-080: received shares ---"
HTTP_CODE=$(curl -s -o /tmp/received.json -w '%{http_code}' \
  -H "Authorization: Bearer ${GRANTEE_TOKEN}" \
  "${API}/shares/received")
assert_status "FR-SHARE-080 received shares" "200" "$HTTP_CODE"
RECEIVED_TOKENS=$(jq -r '.[].token' /tmp/received.json)
if echo "$RECEIVED_TOKENS" | grep -q "$REST_TOKEN"; then
  pass "FR-SHARE-080 received contains restricted token"
else
  fail "FR-SHARE-080 received contains restricted token" "$REST_TOKEN" "$RECEIVED_TOKENS"
fi

# ── FR-SHARE-040: revoke share ───────────────────────────────────────────────
echo "--- FR-SHARE-040: revoke share ---"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X DELETE "${API}/shares/${PUB_SHARE_ID}" \
  -H "Authorization: Bearer ${OWNER_TOKEN}")
assert_status "FR-SHARE-040 revoke" "204" "$HTTP_CODE"

# FR-SHARE-050: revoked token → 404
HTTP_CODE=$(curl -s -o /tmp/revoked.json -w '%{http_code}' \
  "${API}/shares/resolve?token=${PUB_TOKEN}")
assert_status "FR-SHARE-050 revoked token" "404" "$HTTP_CODE"

# ── BR-010: wrong owner revoke → 404 ─────────────────────────────────────────
echo "--- BR-010: wrong owner revoke ---"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -X DELETE "${API}/shares/${REST_SHARE_ID}" \
  -H "Authorization: Bearer ${OTHER_TOKEN}")
assert_status "BR-010 wrong owner revoke" "404" "$HTTP_CODE"

# ── BR-070: share principal cannot create share ──────────────────────────────
echo "--- BR-070: share principal cannot create share ---"
# Need a new public share since we revoked the old one
HTTP_CODE2=$(curl -s -o /tmp/share_new.json -w '%{http_code}' \
  -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"PUBLIC\"}")
NEW_PUB_TOKEN=$(jq -r '.token' /tmp/share_new.json)
NEW_PUB_ID=$(jq -r '.id' /tmp/share_new.json)

HTTP_CODE=$(curl -s -o /tmp/share_create_fail.json -w '%{http_code}' \
  -X POST "${API}/shares" \
  -H "Authorization: Share ${NEW_PUB_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_ID}\",\"mode\":\"PUBLIC\"}")
assert_status "BR-070 share principal create" "403" "$HTTP_CODE"
assert_code  "BR-070 share principal create" "READ_ONLY" "$(cat /tmp/share_create_fail.json)"

# ── BR-100: Referrer-Policy header on resolve ────────────────────────────────
echo "--- BR-100: Referrer-Policy header ---"
REFERRER=$(curl -sI "${API}/shares/resolve?token=${NEW_PUB_TOKEN}" | grep -i 'referrer-policy' | tr -d '\r' | awk -F': ' '{print $2}')
if [[ "$REFERRER" == "no-referrer" ]]; then
  pass "BR-100 Referrer-Policy: no-referrer"
else
  fail "BR-100 Referrer-Policy" "no-referrer" "$REFERRER"
fi

# ── Cleanup ──────────────────────────────────────────────────────────────────
echo
echo "--- Cleanup ---"
# Delete test data via the API (nodes cascade-delete shares)
curl -sf -X DELETE "${API}/nodes/${FOLDER_ID}" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" >/dev/null 2>&1 || true

# Delete test accounts - we can only do this via prisma in practice,
# but the accounts have unique emails so they don't interfere.
# In a real setup we'd clean via the database. Since we can't call prisma
# from a shell script, just note that these accounts exist with unique emails.
echo "  Test accounts created (unique per run, no interference):"
echo "    ${OWNER_EMAIL}"
echo "    ${GRANTEE_EMAIL}"
echo "    ${OTHER_EMAIL}"

rm -f /tmp/share_pub.json /tmp/share_rest.json /tmp/share_bad.json \
      /tmp/resolve_pub.json /tmp/share_readonly.json /tmp/node_shares.json \
      /tmp/child_shares.json /tmp/received.json /tmp/revoked.json \
      /tmp/share_create_fail.json /tmp/share_new.json

echo
echo "=== All assertions passed ==="
echo
echo "=== Manual checklist (browser-only) ==="
echo "  [ ] ShareDialog: mode tabs switch, email field appears for RESTRICTED, expiry is optional"
echo "  [ ] ShareDialog: existing shares list shows Copy link and Revoke buttons"
echo "  [ ] ShareDialog: Copy link copies to clipboard"
echo "  [ ] ShareDialog: Revoke asks for confirmation: 'Revoke this link? Anyone holding it loses access immediately.'"
echo "  [ ] ShareDialog: header says 'Share this entire Data Room' when sharing the root"
echo "  [ ] /s/:token shared view: breadcrumbs stop at the shared root"
echo "  [ ] /s/:token shared view: no write affordances (no New folder, Upload, Rename, Move, Delete, Share buttons)"
echo "  [ ] /s/:token shared view: banner shows 'Shared by {email} · read only'"
echo "  [ ] ShareRemovedScreen: appears after a share is revoked and the page is focused"
echo "  [ ] SIGN_IN_REQUIRED: screen appears for a RESTRICTED link in an incognito window"
echo "  [ ] Shared with me: sidebar entry appears for restricted shares granted to the user's email"
echo "  [ ] InheritedShareNotice: shows 'A link to [name] also exposes this item' when applicable"
