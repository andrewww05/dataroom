#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
API="${API_BASE_URL:-http://localhost:3000/api}"

if ! curl -sf "${API}/health" >/dev/null 2>&1; then
  echo "ERROR: API unreachable at ${API}"
  exit 1
fi

echo "=== Share View File Preview validation script ==="
echo "API: ${API}"
echo

# ── Helpers ────────────────────────────────────────────────────────────────────
RUN="$(openssl rand -hex 4)"
OWNER_EMAIL="share-view-owner-${RUN}@example.test"
OTHER_EMAIL="share-view-other-${RUN}@example.test"
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
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label" "$expected" "$actual"
  fi
}

# ── Setup ──────────────────────────────────────────────────────────────────────
echo "--- Setup ---"
OWNER_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"password\":\"${PASS}\"}")
OWNER_TOKEN=$(echo "$OWNER_RES" | jq -r '.token')
ROOT_ID=$(echo "$OWNER_RES" | jq -r '.dataRoom.rootId')

OTHER_RES=$(curl -sf -X POST "${API}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${OTHER_EMAIL}\",\"password\":\"${PASS}\"}")
OTHER_TOKEN=$(echo "$OTHER_RES" | jq -r '.token')

FOLDER_A_RES=$(curl -sf -X POST "${API}/nodes/folders" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${ROOT_ID}\",\"name\":\"folderA-${RUN}\"}")
FOLDER_A_ID=$(echo "$FOLDER_A_RES" | jq -r '.id')

FILE_A_CONTENT="Hello, world"
echo -n "$FILE_A_CONTENT" > /tmp/test-file-${RUN}.txt
FILE_A_RES=$(curl -sf -X POST "${API}/files" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -F "parentId=${FOLDER_A_ID}" \
  -F "file=@/tmp/test-file-${RUN}.txt;type=text/plain")
FILE_A_ID=$(echo "$FILE_A_RES" | jq -r '.id')

FOLDER_B_RES=$(curl -sf -X POST "${API}/nodes/folders" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"parentId\":\"${ROOT_ID}\",\"name\":\"folderB-${RUN}\"}")
FOLDER_B_ID=$(echo "$FOLDER_B_RES" | jq -r '.id')

PUB_SHARE_RES=$(curl -s -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FOLDER_A_ID}\",\"mode\":\"PUBLIC\"}")
PUB_TOKEN=$(echo "$PUB_SHARE_RES" | jq -r '.token')

RES_SHARE_RES=$(curl -s -X POST "${API}/shares" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"nodeId\":\"${FILE_A_ID}\",\"mode\":\"RESTRICTED\",\"granteeEmail\":\"${OTHER_EMAIL}\"}")
RES_TOKEN=$(echo "$RES_SHARE_RES" | jq -r '.token')

echo "  Owner: ${OWNER_EMAIL}"
echo "  Other: ${OTHER_EMAIL}"
echo

# ── FR-SHARE-020: Anonymous Share token preview → 200, inline URL ──────────────
echo "--- FR-SHARE-020: Anonymous preview ---"
HTTP_CODE=$(curl -s -o /tmp/preview.json -w '%{http_code}' \
  -H "Authorization: Share ${PUB_TOKEN}" \
  "${API}/files/${FILE_A_ID}/preview")

assert_status "FR-SHARE-020 anonymous preview status" "200" "$HTTP_CODE"

PREVIEW_URL=$(cat /tmp/preview.json | jq -r '.url')
S3_HTTP_CODE=$(curl -s -I -o /dev/null -w '%{http_code}' "$PREVIEW_URL")
assert_status "FR-SHARE-020 presigned URL is reachable" "200" "$S3_HTTP_CODE"

CONTENT_DISP=$(curl -s -I "$PREVIEW_URL" | grep -i '^Content-Disposition:' || true)
CONTENT_TYPE=$(curl -s -I "$PREVIEW_URL" | grep -i '^Content-Type:' || true)
if echo "$CONTENT_DISP" | grep -qi 'inline'; then
  pass "FR-SHARE-020 inline Content-Disposition"
else
  fail "FR-SHARE-020 inline Content-Disposition" "inline" "$CONTENT_DISP"
fi

if echo "$CONTENT_TYPE" | grep -qi 'text/plain'; then
  pass "FR-SHARE-020 correct Content-Type"
else
  fail "FR-SHARE-020 correct Content-Type" "text/plain" "$CONTENT_TYPE"
fi

# ── Download over share token → 200 with attachment ───────────────────────────
echo "--- Download over share token ---"
HTTP_CODE=$(curl -s -o /tmp/download.json -w '%{http_code}' \
  -H "Authorization: Share ${PUB_TOKEN}" \
  "${API}/files/${FILE_A_ID}/download")

assert_status "Download over share token status" "200" "$HTTP_CODE"
DOWNLOAD_URL=$(cat /tmp/download.json | jq -r '.url')
CONTENT_DISP=$(curl -s -I "$DOWNLOAD_URL" | grep -i '^Content-Disposition:' || true)
if echo "$CONTENT_DISP" | grep -qi 'attachment'; then
  pass "Download over share token attachment Content-Disposition"
else
  fail "Download over share token attachment Content-Disposition" "attachment" "$CONTENT_DISP"
fi

# ── BR-010: Preview outside shared subtree → 404 ──────────────────────────────
echo "--- BR-010: Outside subtree ---"
FILE_B_RES=$(curl -sf -X POST "${API}/files" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" \
  -F "parentId=${FOLDER_B_ID}" \
  -F "file=@/tmp/test-file-${RUN}.txt;type=text/plain")
FILE_B_ID=$(echo "$FILE_B_RES" | jq -r '.id')

HTTP_CODE=$(curl -s -o /tmp/preview_404.json -w '%{http_code}' \
  -H "Authorization: Share ${PUB_TOKEN}" \
  "${API}/files/${FILE_B_ID}/preview")

assert_status "BR-010 outside subtree status" "404" "$HTTP_CODE"
CODE=$(cat /tmp/preview_404.json | jq -r '.code')
assert_code "BR-010 outside subtree code" "NOT_FOUND" "$CODE"

# ── FR-SHARE-020: RESTRICTED without JWT → 401 ────────────────────────────────
echo "--- FR-SHARE-020: RESTRICTED without JWT ---"
HTTP_CODE=$(curl -s -o /tmp/res_401.json -w '%{http_code}' \
  -H "Authorization: Share ${RES_TOKEN}" \
  "${API}/files/${FILE_A_ID}/preview")

assert_status "FR-SHARE-020 restricted without JWT status" "401" "$HTTP_CODE"
CODE=$(cat /tmp/res_401.json | jq -r '.code')
assert_code "FR-SHARE-020 restricted without JWT code" "SIGN_IN_REQUIRED" "$CODE"

# ── FR-SHARE-020: RESTRICTED wrong grantee → 404 ──────────────────────────────
echo "--- FR-SHARE-020: RESTRICTED wrong grantee ---"
HTTP_CODE=$(curl -s -o /tmp/res_404.json -w '%{http_code}' \
  -H "Authorization: Share ${RES_TOKEN}, Bearer ${OWNER_TOKEN}" \
  "${API}/files/${FILE_A_ID}/preview")

assert_status "FR-SHARE-020 restricted wrong grantee status" "404" "$HTTP_CODE"
CODE=$(cat /tmp/res_404.json | jq -r '.code')
assert_code "FR-SHARE-020 restricted wrong grantee code" "NOT_FOUND" "$CODE"

# ── FR-SHARE-050: Revoked token → 401 ─────────────────────────────────────────
echo "--- FR-SHARE-050: Revoked token ---"
curl -s -X DELETE "${API}/shares/${PUB_TOKEN}" \
  -H "Authorization: Bearer ${OWNER_TOKEN}" > /dev/null

HTTP_CODE=$(curl -s -o /tmp/revoked.json -w '%{http_code}' \
  -H "Authorization: Share ${PUB_TOKEN}" \
  "${API}/files/${FILE_A_ID}/preview")

assert_status "FR-SHARE-050 revoked token status" "401" "$HTTP_CODE"
CODE=$(cat /tmp/revoked.json | jq -r '.code')
assert_code "FR-SHARE-050 revoked token code" "UNAUTHENTICATED" "$CODE"

# ── Cleanup ────────────────────────────────────────────────────────────────────
echo
echo "--- Cleanup ---"
curl -s -X DELETE "${API}/nodes/${FOLDER_A_ID}" -H "Authorization: Bearer ${OWNER_TOKEN}" > /dev/null
curl -s -X DELETE "${API}/nodes/${FOLDER_B_ID}" -H "Authorization: Bearer ${OWNER_TOKEN}" > /dev/null

rm -f /tmp/test-file-${RUN}.txt /tmp/preview.json /tmp/download.json /tmp/preview_404.json /tmp/res_401.json /tmp/res_404.json /tmp/revoked.json

echo
echo "=== All assertions passed ==="
echo
echo "=== Manual checklist (browser-only) ==="
echo "  [ ] Double-click opens the viewer"
echo "  [ ] ←/→ step and skip folders and stop at the ends"
echo "  [ ] Esc returns to the same shared folder"
echo "  [ ] A file share shows no close control or arrows"
echo "  [ ] A PNG is fitted and a PDF renders inline for an anonymous visitor"
echo "  [ ] A .docx shows the fallback card"
echo "  [ ] No write affordance is reachable"
echo "  [ ] The address bar still reads the share URL"
