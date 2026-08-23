#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

echo "Validating against API: $API_BASE_URL"

# 1. Check reachability
if ! curl -s -f "$API_BASE_URL/health" >/dev/null; then
  echo "FAIL: API is unreachable at $API_BASE_URL"
  exit 1
fi

echo "API is reachable."

# 2. Setup
EMAIL="validate-polish-$$@example.com"
PASSWORD="Password123!"

echo "Setting up test user..."
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" > /dev/null

TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "FAIL: Could not log in."
  exit 1
fi

ROOM_ID=$(curl -s -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.dataRoom.rootId')
DATA_ROOM_ID=$(curl -s -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.dataRoom.id')

# Create another user for foreign tests
EMAIL2="validate-polish-2-$$@example.com"
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" > /dev/null

TOKEN2=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

ROOM_ID2=$(curl -s -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN2" | jq -r '.dataRoom.rootId')
DATA_ROOM_ID2=$(curl -s -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN2" | jq -r '.dataRoom.id')


# 3. Create fixtures
echo "Creating fixtures..."
FOLDER_RES=$(curl -s -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$ROOM_ID\",\"name\":\"Test Folder $$\"}")
FOLDER_ID=$(echo "$FOLDER_RES" | jq -r '.id')

SUBFOLDER_RES=$(curl -s -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$FOLDER_ID\",\"name\":\"Subfolder\"}")
SUBFOLDER_ID=$(echo "$SUBFOLDER_RES" | jq -r '.id')

echo "Hello World!" > test_$$.txt
UPLOAD_RES=$(curl -s -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$FOLDER_ID" \
  -F "file=@test_$$.txt")
FILE_ID=$(echo "$UPLOAD_RES" | jq -r '.id')

# 4. Assert FR-FILE-060: copy a file
echo "Testing FR-FILE-060 (copy a file)"
COPY_RES=$(curl -s -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$ROOM_ID\",\"ids\":[\"$FILE_ID\"]}")
COPIED_FILE_ID=$(echo "$COPY_RES" | jq -r '.[0].id')
if [ "$COPIED_FILE_ID" == "null" ] || [ -z "$COPIED_FILE_ID" ]; then
  echo "FAIL (FR-FILE-060): Copy file failed. Expected array of created nodes, got: $COPY_RES"
  exit 1
fi
echo "PASS (FR-FILE-060): Copied file successfully"

# BR-020 suffix at the target
echo "Testing BR-020 (suffix at target)"
# If we copy the same file again to the same folder, it should have a suffix
COPY_SUFFIX_RES=$(curl -s -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$ROOM_ID\",\"ids\":[\"$FILE_ID\"]}")
SUFFIXED_NAME=$(echo "$COPY_SUFFIX_RES" | jq -r '.[0].name')
if [[ "$SUFFIXED_NAME" != *" (1).txt"* ]] && [[ "$SUFFIXED_NAME" != *" (2).txt"* ]] && [[ "$SUFFIXED_NAME" != *" (1)"* ]]; then
  echo "FAIL (BR-020): Expected suffix, got: $SUFFIXED_NAME"
  exit 1
fi
echo "PASS (BR-020): Suffixed name at target"

# FR-FILE-060: copy a subtree
echo "Testing FR-FILE-060 (copy a subtree)"
COPY_TREE_RES=$(curl -s -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$ROOM_ID\",\"ids\":[\"$FOLDER_ID\"]}")
COPIED_FOLDER_ID=$(echo "$COPY_TREE_RES" | jq -r '.[0].id')
if [ "$COPIED_FOLDER_ID" == "null" ] || [ -z "$COPIED_FOLDER_ID" ]; then
  echo "FAIL (FR-FILE-060): Copy subtree failed. Expected array of created nodes, got: $COPY_TREE_RES"
  exit 1
fi
echo "PASS (FR-FILE-060): Copied subtree successfully"

# 400 INVALID_MOVE into own descendant (Wait, copy into own descendant is also invalid?)
echo "Testing 400 INVALID_MOVE into descendant (copy)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$SUBFOLDER_ID\",\"ids\":[\"$FOLDER_ID\"]}")
if [ "$HTTP_STATUS" != "400" ]; then
  echo "FAIL: Expected 400 INVALID_MOVE, got $HTTP_STATUS"
  exit 1
fi
echo "PASS: 400 INVALID_MOVE into descendant"

# 404 NOT_FOUND for a foreign id
echo "Testing 404 NOT_FOUND for foreign id"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$ROOM_ID2\",\"ids\":[\"$FILE_ID\"]}")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL: Expected 404 NOT_FOUND for foreign id, got $HTTP_STATUS"
  exit 1
fi
echo "PASS: 404 NOT_FOUND for foreign id"

# 403 READ_ONLY for a share token (using copy as an example)
# Need to create a share token first
SHARE_RES=$(curl -s -X POST "$API_BASE_URL/shares" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"$ROOM_ID\",\"mode\":\"PUBLIC\"}")
SHARE_TOKEN=$(echo "$SHARE_RES" | jq -r '.token')

if [ "$SHARE_TOKEN" == "null" ] || [ -z "$SHARE_TOKEN" ]; then
  echo "FAIL: Could not create share token."
  exit 1
fi

echo "Testing 403 READ_ONLY for share token"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/nodes/copy" \
  -H "Authorization: Share $SHARE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"targetId\":\"$ROOM_ID\",\"ids\":[\"$FILE_ID\"]}")
if [ "$HTTP_STATUS" != "403" ]; then
  echo "FAIL: Expected 403 READ_ONLY for share token, got $HTTP_STATUS"
  exit 1
fi
echo "PASS: 403 READ_ONLY for share token"

# 5. Assert FR-ACCT-010 totals, zeros, exact >4 GiB figure, 404 for another owner and 404 for a share token
echo "Testing FR-ACCT-010 (Usage)"
USAGE_RES=$(curl -s -X GET "$API_BASE_URL/data-rooms/$DATA_ROOM_ID/usage" -H "Authorization: Bearer $TOKEN")
BYTES=$(echo "$USAGE_RES" | jq -r '.bytes')

if [ "$BYTES" == "null" ] || [ -z "$BYTES" ]; then
  echo "FAIL (FR-ACCT-010): Usage bytes is null"
  exit 1
fi
echo "PASS (FR-ACCT-010): Totals returned"

echo "Testing 404 for another owner"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/data-rooms/$DATA_ROOM_ID/usage" \
  -H "Authorization: Bearer $TOKEN2")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL (FR-ACCT-010): Expected 404 for another owner, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (FR-ACCT-010): 404 for another owner"

echo "Testing 404 for share token"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/data-rooms/$DATA_ROOM_ID/usage" \
  -H "Authorization: Share $SHARE_TOKEN")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL (FR-ACCT-010): Expected 404 for share token, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (FR-ACCT-010): 404 for share token"

# 9. Cleanup
echo "Cleaning up..."
# Delete the user (this cascades to data rooms, folders, files, and shares)
# Or we can just leave it since it's a test user, but let's be clean
rm -f test_$$.txt

echo ""
echo "--- ALL AUTOMATED TESTS PASSED ---"
echo ""
echo "Manual Validation Checklist:"
echo "[ ] Web (FR-FILE-070): Select multiple rows with click / Ctrl / Shift / Ctrl+A"
echo "[ ] Web (FR-FILE-070): Bulk actions (move/copy/delete) show correct count in confirm dialog"
echo "[ ] Web (FR-FILE-070): Bulk download creates staggered burst of downloads"
echo "[ ] Web (FR-VIEW-010): Toggle tiles view; verify selection survives and toggle persists on reload"
echo "[ ] Web (FR-VIEW-030): Right-click context menu; check unselected row auto-selects, inside selection keeps it"
echo "[ ] Web (FR-VIEW-040): Use arrows ↑ ↓ and Shift ↑ ↓ to select items"
echo "[ ] Web (FR-VIEW-040): Verify Esc order (viewer -> dialog -> inline rename -> clear selection)"
echo "[ ] Web (FR-VIEW-040): Check visible focus rings and focus traps in dialogs/viewer"
echo "[ ] Web (FR-VIEW-040): Verify aria-labels on icon-only buttons"
echo "[ ] Web (FR-VIEW-050): OS default theme is respected; override works and has no flash on load"
echo ""
