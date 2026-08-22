#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

echo "Validating file-and-folder-operations..."

# Ensure API is reachable
if ! curl -s -f "$API_BASE_URL/health" > /dev/null; then
  echo "  ❌ API is unreachable at $API_BASE_URL"
  echo "     Start the API and try again."
  exit 1
fi

# ---------------------------------------------------------------------------
# Setup: create a fresh user for this run
# ---------------------------------------------------------------------------
EMAIL="test_ops_$(date +%s)@example.com"
PASSWORD="Password!1"

echo "Creating test user $EMAIL..."
AUTH_RESP=$(curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESP" | jq -r '.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Signup failed. Response: $AUTH_RESP"
  exit 1
fi

ME_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/auth/me")
ROOT_ID=$(echo "$ME_RESP" | jq -r '.dataRoom.rootId')
if [ "$ROOT_ID" = "null" ] || [ -z "$ROOT_ID" ]; then
  echo "❌ Failed to get rootId from: $ME_RESP"
  exit 1
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
expect_status() {
  local expected=$1
  local actual=$2
  local scenario=$3
  if [ "$expected" != "$actual" ]; then
    echo "❌ $scenario: Expected HTTP $expected, got $actual"
    exit 1
  fi
  echo "✅ $scenario"
}

expect_code() {
  local expected=$1
  local body=$2
  local scenario=$3
  local actual
  actual=$(echo "$body" | jq -r '.code')
  if [ "$actual" != "$expected" ]; then
    echo "❌ $scenario: Expected error code $expected, got $actual"
    echo "   Body: $body"
    exit 1
  fi
}

echo "Running scenarios..."

# ---------------------------------------------------------------------------
# Create fixtures: folder_a (parent), folder_b (will be moved inside folder_a)
# ---------------------------------------------------------------------------
RESP_A=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_a\",\"parentId\":\"$ROOT_ID\"}")
CODE_A=$(echo "$RESP_A" | tail -n1); BODY_A=$(echo "$RESP_A" | sed '$d')
expect_status 201 "$CODE_A" "Setup: create folder_a"
ID_A=$(echo "$BODY_A" | jq -r '.id')

RESP_B=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_b\",\"parentId\":\"$ROOT_ID\"}")
CODE_B=$(echo "$RESP_B" | tail -n1); BODY_B=$(echo "$RESP_B" | sed '$d')
expect_status 201 "$CODE_B" "Setup: create folder_b"
ID_B=$(echo "$BODY_B" | jq -r '.id')

# ---------------------------------------------------------------------------
# FR-FLDR-020 Rename folder — happy path
# ---------------------------------------------------------------------------
RESP_REN=$(curl -s -w "\n%{http_code}" -X PATCH "$API_BASE_URL/nodes/$ID_A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_a_v2\"}")
CODE_REN=$(echo "$RESP_REN" | tail -n1)
expect_status 200 "$CODE_REN" "FR-FLDR-020: Rename folder happy path"

# ---------------------------------------------------------------------------
# BR-020 INVALID_NAME on empty name
# ---------------------------------------------------------------------------
RESP_EMPTY=$(curl -s -w "\n%{http_code}" -X PATCH "$API_BASE_URL/nodes/$ID_A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"\"}")
CODE_EMPTY=$(echo "$RESP_EMPTY" | tail -n1); BODY_EMPTY=$(echo "$RESP_EMPTY" | sed '$d')
expect_status 400 "$CODE_EMPTY" "BR-020: Rename with empty name → 400"

# ---------------------------------------------------------------------------
# FR-FLDR-040 Move folder_b into folder_a — happy path
# ---------------------------------------------------------------------------
RESP_MOV=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"$ID_B\"],\"targetId\":\"$ID_A\"}")
CODE_MOV=$(echo "$RESP_MOV" | tail -n1)
expect_status 201 "$CODE_MOV" "FR-FLDR-040: Move folder_b into folder_a"

# ---------------------------------------------------------------------------
# BR-060 Cycle prevention — move folder_a into folder_b (now a child of folder_a)
# ---------------------------------------------------------------------------
RESP_CYC=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"$ID_A\"],\"targetId\":\"$ID_B\"}")
CODE_CYC=$(echo "$RESP_CYC" | tail -n1); BODY_CYC=$(echo "$RESP_CYC" | sed '$d')
expect_status 400 "$CODE_CYC" "BR-060: Descendant-move → 400 INVALID_MOVE"
expect_code "INVALID_MOVE" "$BODY_CYC" "BR-060: error code is INVALID_MOVE"

# BR-060 Self-move
RESP_SELF=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"$ID_A\"],\"targetId\":\"$ID_A\"}")
CODE_SELF=$(echo "$RESP_SELF" | tail -n1); BODY_SELF=$(echo "$RESP_SELF" | sed '$d')
expect_status 400 "$CODE_SELF" "BR-060: Self-move → 400 INVALID_MOVE"
expect_code "INVALID_MOVE" "$BODY_SELF" "BR-060: self-move code is INVALID_MOVE"

# ---------------------------------------------------------------------------
# Create folder_c inside folder_a to test move-to-root and delete
# ---------------------------------------------------------------------------
RESP_C=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_c\",\"parentId\":\"$ID_A\"}")
CODE_C=$(echo "$RESP_C" | tail -n1); BODY_C=$(echo "$RESP_C" | sed '$d')
expect_status 201 "$CODE_C" "Setup: create folder_c inside folder_a"
ID_C=$(echo "$BODY_C" | jq -r '.id')

# ---------------------------------------------------------------------------
# FR-FILE-050 Move item to a different folder (root)
# ---------------------------------------------------------------------------
RESP_MOV2=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"$ID_C\"],\"targetId\":\"$ROOT_ID\"}")
CODE_MOV2=$(echo "$RESP_MOV2" | tail -n1)
expect_status 201 "$CODE_MOV2" "FR-FILE-050: Move folder_c to root"

# ---------------------------------------------------------------------------
# FR-FILE-040 Delete item
# ---------------------------------------------------------------------------
RESP_DEL=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE_URL/nodes/$ID_C" \
  -H "Authorization: Bearer $TOKEN")
CODE_DEL=$(echo "$RESP_DEL" | tail -n1)
expect_status 204 "$CODE_DEL" "FR-FILE-040: Delete item → 204"

# ---------------------------------------------------------------------------
# FR-FLDR-030 Recursive delete — deleting folder_a should cascade folder_b
# ---------------------------------------------------------------------------
RESP_DEL2=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE_URL/nodes/$ID_A" \
  -H "Authorization: Bearer $TOKEN")
CODE_DEL2=$(echo "$RESP_DEL2" | tail -n1)
expect_status 204 "$CODE_DEL2" "FR-FLDR-030: Recursive delete folder_a → 204"

# Verify folder_b is no longer accessible
RESP_B_CHK=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" \
  "$API_BASE_URL/nodes/$ID_B")
CODE_B_CHK=$(echo "$RESP_B_CHK" | tail -n1)
expect_status 404 "$CODE_B_CHK" "FR-FLDR-030: folder_b no longer accessible after cascade"

echo ""
echo "✅ All API scenarios passed!"

echo ""
echo "=== Manual UI Verification Checklist ==="
echo "Sign in at $WEB_BASE_URL as: $EMAIL"
echo ""
echo "1. Inline rename (FR-FILE-030 / FR-FLDR-020)"
echo "   a. Click a selected row's name or press F2 — input appears."
echo "   b. For a file, the extension is stripped from the editable stem."
echo "   c. Press Esc → name reverts without saving."
echo "   d. Press Enter (or blur) → name saves; toast shows actual name used."
echo ""
echo "2. Collision rename (BR-020)"
echo "   a. Rename a folder to the same name as an existing sibling."
echo "   b. Server returns a suffixed name (e.g. 'folder (1)'); toast shows that name."
echo ""
echo "3. DeleteDialog (FR-FILE-040 / FR-FLDR-030 / BR-030)"
echo "   a. Select a folder; click Delete."
echo "   b. Confirm button is disabled while stats + shares load."
echo "   c. Stats string correctly counts descendant folders and files."
echo "   d. If the node has shares, 'This also revokes N links' appears."
echo ""
echo "4. MoveDialog (FR-FILE-050 / FR-FLDR-040)"
echo "   a. Select an item; click Move in toolbar."
echo "   b. FolderPicker expands lazily — current parent is labelled and disabled."
echo "   c. Moving a folder disables itself and its loaded descendants in the picker."
echo "   d. Move button disabled until a valid target is selected."
echo ""
echo "5. Drag-onto-folder (FR-FILE-050)"
echo "   a. Drag a row over another folder in the listing — target highlights."
echo "   b. Drop the item → it disappears from current listing and appears in target."
echo "   c. Drag a row and drop it onto a folder in the sidebar tree."
echo "========================================"
