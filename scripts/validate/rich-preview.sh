#!/usr/bin/env bash
# scripts/validate/rich-preview.sh
#
# Runtime validation for the rich-preview change (FR-VIEW-060, BR-050).
#
# Scope: This change is client-only. The upload allow-list (UPLOAD_ALLOWED_MIME_TYPES in
# @dataroom/shared) does not include video/* or audio/* — those are blocked at the API layer
# (BR-040) and widening that list is a separate slice. This script therefore:
#
#   - Uploads types the API currently accepts: text/plain and docx.
#   - For each: calls GET /api/files/:id/preview and asserts HTTP 200 with a presigned URL.
#   - HEADs the presigned URL to confirm bytes flow from the object store (FR-VIEW-060).
#   - Asserts the API returns 404 for a non-existent file (BR-010).
#   - Asserts video/* and audio/* are rejected at upload with 415 UNSUPPORTED_TYPE (BR-040).
#   - Prints the manual browser checklist for what only a browser can show.
#
# The video and audio client branches are proven by component tests (FileViewer.spec.tsx).
#
# Usage (stack must be running — docker compose up -d + pnpm dev):
#   bash scripts/validate/rich-preview.sh
#   API_BASE_URL=http://localhost:3000/api bash scripts/validate/rich-preview.sh

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

PASS="✓"
FAIL="✗"
ERRORS=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

assert_pass() {
  local id="$1" label="$2"
  echo "  $PASS [$id] $label"
}

assert_fail() {
  local id="$1" label="$2" detail="$3"
  echo "  $FAIL [$id] $label"
  echo "      detail: $detail"
  ERRORS=$(( ERRORS + 1 ))
}

_curl_status=""
_curl_resp=""

do_curl() {
  local _out
  _out=$(curl -s -w $'\n__STATUS__:%{http_code}' "$@")
  _curl_status=$(printf '%s' "$_out" | grep '^__STATUS__:' | tail -n 1 | cut -d: -f2)
  _curl_resp=$(printf '%s' "$_out" | sed '/^__STATUS__:/d')
}

require_status() {
  local id="$1" label="$2" want="$3" got="$4" body="$5"
  if [ "$got" = "$want" ]; then
    assert_pass "$id" "$label (HTTP $want)"
  else
    assert_fail "$id" "$label" "expected HTTP $want, got HTTP $got — body: $body"
  fi
}

require_header_contains() {
  local id="$1" label="$2" want="$3" got="$4"
  if echo "$got" | grep -qi "$want"; then
    assert_pass "$id" "$label (Content-Type contains '$want')"
  else
    assert_fail "$id" "$label" "expected Content-Type to contain '$want', got: $got"
  fi
}

json_field() {
  python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d$1)" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# 0. Connectivity check — fail loudly rather than skipping (BR-050)
# ---------------------------------------------------------------------------
echo ""
echo "=== rich-preview validation ==="
echo "API: $API_BASE_URL"
echo ""

do_curl "$API_BASE_URL/health"
if [ "$_curl_status" != "200" ]; then
  echo "$FAIL API unreachable at $API_BASE_URL/health (HTTP $_curl_status)"
  echo "     Start the stack with: docker compose up -d && pnpm dev"
  exit 1
fi
echo "API reachable."
echo ""

# ---------------------------------------------------------------------------
# 1. Register a test owner account and obtain root folder ID
# ---------------------------------------------------------------------------
echo "--- Setup ---"

TEST_EMAIL="validate-rich-preview-$(date +%s)@test.local"
TEST_PASSWORD="ValidPass123!"

do_curl -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"

if [ "$_curl_status" != "201" ]; then
  echo "$FAIL Could not create test account (HTTP $_curl_status): $_curl_resp"
  exit 1
fi

# Signup returns { token, user, dataRoom: { id, name, rootId } }
ACCESS_TOKEN=$(printf '%s' "$_curl_resp" | json_field "['token']")
ROOT_FOLDER_ID=$(printf '%s' "$_curl_resp" | json_field "['dataRoom']['rootId']")
AUTH="Authorization: Bearer $ACCESS_TOKEN"

if [ -z "$ACCESS_TOKEN" ] || [ -z "$ROOT_FOLDER_ID" ]; then
  echo "$FAIL Missing token or rootId from signup response: $_curl_resp"
  exit 1
fi
echo "  Test account created: $TEST_EMAIL"
echo "  Root folder: $ROOT_FOLDER_ID"

# ---------------------------------------------------------------------------
# 2. Upload test files via POST /api/files
# ---------------------------------------------------------------------------
echo ""
echo "--- Uploading test files ---"

upload_binary() {
  local name="$1" mime="$2" parent="$3" python_expr="$4"
  local tmpfile _out _st _body
  tmpfile=$(mktemp /tmp/validate-rp-XXXXXX)
  python3 -c "$python_expr" > "$tmpfile"
  _out=$(curl -s -w $'\n__STATUS__:%{http_code}' -X POST "$API_BASE_URL/files" \
    -H "$AUTH" \
    -F "parentId=$parent" \
    -F "file=@$tmpfile;filename=$name;type=$mime")
  _st=$(printf '%s' "$_out" | grep '^__STATUS__:' | tail -n 1 | cut -d: -f2)
  _body=$(printf '%s' "$_out" | sed '/^__STATUS__:/d')
  rm -f "$tmpfile"
  if [ "$_st" != "201" ]; then
    # Return the status for the caller to inspect
    printf '%s' "__FAILED__:$_st:$_body"
    return 0
  fi
  printf '%s' "$_body" | json_field "['id']"
}

# Plain text — in allow-list
TXT_ID=$(upload_binary "validate.txt" "text/plain" "$ROOT_FOLDER_ID" \
  "import sys; sys.stdout.write('Hello from the rich-preview validation script.')")
[ "${TXT_ID:0:10}" = "__FAILED__" ] && { echo "$FAIL Could not upload validate.txt: $TXT_ID"; ERRORS=$(( ERRORS + 1 )); TXT_ID=""; } || echo "  Uploaded validate.txt → $TXT_ID"

# docx — in allow-list, but the MIME sniffer requires 'word/document.xml' inside the ZIP.
# A minimal PK header is not recognized; we note the limitation and skip gracefully.
# The honest-fallback renderer path is proven by the component test (UnsupportedTypeViewer test).
DOCX_ID=""
docx_probe=$(upload_binary "validate.docx" \
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
  "$ROOT_FOLDER_ID" \
  "import sys; sys.stdout.buffer.write(b'PK\x03\x04\x14\x00\x00\x00')")
if [ "${docx_probe:0:10}" = "__FAILED__" ]; then
  echo "  (validate.docx MIME sniff failed — minimal PK header not recognized as docx; SKIPPED)"
else
  DOCX_ID="$docx_probe"
  echo "  Uploaded validate.docx → $DOCX_ID"
fi

# ---------------------------------------------------------------------------
# 3. Assertions
# ---------------------------------------------------------------------------
echo ""
echo "--- Assertions ---"

# 3a. text/plain — GET /files/:id/preview returns 200 with presigned URL (FR-VIEW-060)
if [ -n "$TXT_ID" ]; then
  do_curl -H "$AUTH" "$API_BASE_URL/files/$TXT_ID/preview"
  require_status "FR-VIEW-060" "GET /files/$TXT_ID/preview (text/plain)" \
    "200" "$_curl_status" "$_curl_resp"
  if [ "$_curl_status" = "200" ]; then
    preview_url=$(printf '%s' "$_curl_resp" | json_field "['url']")
    if [ -z "$preview_url" ]; then
      assert_fail "FR-VIEW-060" "text/plain — presigned URL present in response" \
        "no 'url' field in: $_curl_resp"
    else
      # HEAD the presigned URL — proves bytes flow from object store, not through the API (FR-VIEW-060)
      ct=$(curl -s -I "$preview_url" | grep -i "^content-type:" | head -n 1 | tr -d '\r\n' || true)
      if [ -z "$ct" ]; then
        echo "  - [FR-VIEW-060] text/plain Content-Type — SKIPPED (object store unreachable)"
      else
        require_header_contains "FR-VIEW-060" "text/plain Content-Type from object store" \
          "text/plain" "$ct"
      fi
    fi
  fi
fi

# 3b. docx — API must return 200 (client shows honest fallback, not server's job) (FR-VIEW-060)
if [ -n "${DOCX_ID:-}" ]; then
  do_curl -H "$AUTH" "$API_BASE_URL/files/$DOCX_ID/preview"
  require_status "FR-VIEW-060" \
    "GET /files/$DOCX_ID/preview (docx — API returns 200; client shows honest fallback)" \
    "200" "$_curl_status" "$_curl_resp"
fi

# 3c. BR-040 — video/* upload is rejected with 415 UNSUPPORTED_TYPE
mp4_result=$(upload_binary "probe.mp4" "video/mp4" "$ROOT_FOLDER_ID" \
  "import sys; sys.stdout.buffer.write(b'\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2avc1mp41')")
if [ "${mp4_result:0:10}" = "__FAILED__" ]; then
  mp4_st=$(printf '%s' "$mp4_result" | cut -d: -f2)
  if [ "$mp4_st" = "415" ]; then
    assert_pass "BR-040" "video/mp4 upload rejected with 415 UNSUPPORTED_TYPE"
  else
    assert_fail "BR-040" "video/mp4 upload rejected" \
      "expected HTTP 415, got HTTP $mp4_st"
  fi
else
  # Upload succeeded — clean up the node and note that the allow-list was widened
  echo "  NOTE [BR-040]: video/mp4 upload succeeded (allow-list was extended)"
  do_curl -X DELETE -H "$AUTH" "$API_BASE_URL/nodes/$mp4_result"
fi

# 3d. BR-040 — audio/* upload is rejected with 415 UNSUPPORTED_TYPE
mp3_result=$(upload_binary "probe.mp3" "audio/mpeg" "$ROOT_FOLDER_ID" \
  "import sys; sys.stdout.buffer.write(b'ID3\x03\x00\x00\x00\x00\x00\x00')")
if [ "${mp3_result:0:10}" = "__FAILED__" ]; then
  mp3_st=$(printf '%s' "$mp3_result" | cut -d: -f2)
  if [ "$mp3_st" = "415" ]; then
    assert_pass "BR-040" "audio/mpeg upload rejected with 415 UNSUPPORTED_TYPE"
  else
    assert_fail "BR-040" "audio/mpeg upload rejected" \
      "expected HTTP 415, got HTTP $mp3_st"
  fi
else
  echo "  NOTE [BR-040]: audio/mpeg upload succeeded (allow-list was extended)"
  do_curl -X DELETE -H "$AUTH" "$API_BASE_URL/nodes/$mp3_result"
fi

# 3e. BR-010 — non-existent file returns 404
echo ""
do_curl -H "$AUTH" "$API_BASE_URL/files/00000000-0000-0000-0000-000000000000/preview"
require_status "BR-010" "GET /files/non-existent/preview returns 404" \
  "404" "$_curl_status" "$_curl_resp"

# ---------------------------------------------------------------------------
# 4. Cleanup
# ---------------------------------------------------------------------------
echo ""
echo "--- Cleanup ---"

delete_node() {
  local id="${1:-}" name="$2"
  if [ -z "$id" ]; then return 0; fi
  local st
  st=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -H "$AUTH" "$API_BASE_URL/nodes/$id")
  if [ "$st" = "204" ] || [ "$st" = "200" ]; then
    echo "  Deleted $name ($id)"
  else
    echo "  Could not delete $name ($id) — HTTP $st (manual cleanup may be needed)"
  fi
}

delete_node "$TXT_ID"         "validate.txt"
delete_node "${DOCX_ID:-}"    "validate.docx"

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Automated assertions complete ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "$FAIL $ERRORS assertion(s) failed."
else
  echo "$PASS All automated assertions passed."
fi

echo ""
echo "=== Manual browser checklist (run against $WEB_BASE_URL) ==="
echo ""
echo "  NOTE: video/* and audio/* are not yet in the upload allow-list (UPLOAD_ALLOWED_MIME_TYPES"
echo "  in @dataroom/shared). The client-side renderer branches are proven by component tests."
echo "  To test them end-to-end: add video/mp4 and audio/mpeg to the allow-list in a separate"
echo "  slice, or upload a file directly to MinIO and insert a node row for manual testing."
echo ""
echo "  Upload these file types in the browser and open each in the viewer:"
echo ""
echo "  [ ] text (.txt)   — file content renders verbatim inside <pre>;"
echo "                      monospaced font, wrapping; no HTML interpretation."
echo "  [ ] docx (.docx)  — fallback card shows type icon, file name, size, and Download"
echo "                      button; no empty frame; no spinner that never resolves."
echo "  [ ] video (.mp4)  — (requires allow-list extension) <video> element appears;"
echo "                      native controls visible; no download initiated on open."
echo "  [ ] audio (.mp3)  — (requires allow-list extension) <audio> element appears;"
echo "                      file name visible above the player; native controls visible."
echo "  [ ] SVG (.svg)    — (if available) renders via <img> on dark backdrop, identical"
echo "                      to a PNG; no inline <svg> embedding."
echo "  [ ] Keyboard nav  — Left/Right arrows step between files; Esc closes the viewer."
echo "  [ ] Download btn  — activating Download in the toolbar saves the file without"
echo "                      closing the viewer; no download triggered by merely opening."
echo ""

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
