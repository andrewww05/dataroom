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
EMAIL="validate-$$@example.com"
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

# Create another user to test cross-room access
EMAIL2="validate2-$$@example.com"
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" > /dev/null

TOKEN2=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

# 3. Create a folder and a file
echo "Creating fixtures..."
FOLDER_RES=$(curl -s -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$ROOM_ID\",\"name\":\"Test Folder $$\"}")
FOLDER_ID=$(echo "$FOLDER_RES" | jq -r '.id')

# Upload some content
echo "Hello World!" > test_$$.txt

UPLOAD_RES=$(curl -s -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$ROOM_ID" \
  -F "file=@test_$$.txt")

FILE_ID=$(echo "$UPLOAD_RES" | jq -r '.id')

echo "Starting assertions..."

# 4. Assert FR-VIEW-060
echo "Testing FR-VIEW-060 (Preview File)"
PREVIEW_RES=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/files/$FILE_ID/preview" \
  -H "Authorization: Bearer $TOKEN")

HTTP_STATUS=$(echo "$PREVIEW_RES" | tail -n1)
BODY=$(echo "$PREVIEW_RES" | sed '$d')

if [ "$HTTP_STATUS" != "200" ]; then
  echo "FAIL (FR-VIEW-060): Expected 200, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (FR-VIEW-060): Preview route returned 200"

PREVIEW_URL=$(echo "$BODY" | jq -r '.url')

if [[ "$PREVIEW_URL" == "$API_BASE_URL"* ]]; then
  echo "FAIL (FR-VIEW-060): URL should not be on the API origin"
  exit 1
fi
echo "PASS (FR-VIEW-060): URL is off API origin"

if [[ "$PREVIEW_URL" != *"X-Amz-Expires=300"* ]]; then
  echo "FAIL (FR-VIEW-060): URL is missing X-Amz-Expires=300"
  exit 1
fi
echo "PASS (FR-VIEW-060): URL expires in 300s"

# Download using the URL to check bytes and Content-Disposition
HEADERS_RES=$(curl -s -D - "$PREVIEW_URL" -o /dev/null)
if ! echo "$HEADERS_RES" | grep -iq "content-disposition: inline"; then
  echo "FAIL (FR-VIEW-060): Missing Content-Disposition: inline"
  echo "Headers were: $HEADERS_RES"
  exit 1
fi
echo "PASS (FR-VIEW-060): Content-Disposition is inline"

# Check tampered signature
TAMPERED_URL="${PREVIEW_URL}a"
TAMPERED_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$TAMPERED_URL" || true)
if [ "$TAMPERED_HTTP" == "200" ]; then
  echo "FAIL (FR-VIEW-060): Tampered signature returned 200"
  exit 1
fi
echo "PASS (FR-VIEW-060): Tampered signature refused"

# 5. Assert BR-010 (404 NOT_FOUND)
echo "Testing BR-010 (Access Control)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/files/$FOLDER_ID/preview" -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL (BR-010): Expected 404 for folder ID, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (BR-010): 404 for folder ID"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/files/00000000-0000-0000-0000-000000000000/preview" -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL (BR-010): Expected 404 for unknown ID, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (BR-010): 404 for unknown ID"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/files/$FILE_ID/preview" -H "Authorization: Bearer $TOKEN2")
if [ "$HTTP_STATUS" != "404" ]; then
  echo "FAIL (BR-010): Expected 404 for file in another room, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (BR-010): 404 for file in another data room"

# 6. Assert FR-AUTH-030 (401 UNAUTHENTICATED)
echo "Testing FR-AUTH-030"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/files/$FILE_ID/preview")
if [ "$HTTP_STATUS" != "401" ]; then
  echo "FAIL (FR-AUTH-030): Expected 401 unauthenticated, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (FR-AUTH-030): 401 Unauthenticated"

# 7. Assert 400 VALIDATION_FAILED on junk ID
echo "Testing 400 VALIDATION_FAILED"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/files/junk/preview" -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_STATUS" != "400" ]; then
  echo "FAIL: Expected 400 validation failed for junk ID, got $HTTP_STATUS"
  exit 1
fi
echo "PASS: 400 Validation Failed on junk ID"

# 8. Assert FR-ACCT-020 (folder stats)
echo "Testing FR-ACCT-020"
STATS_RES=$(curl -s -X GET "$API_BASE_URL/nodes/$ROOM_ID/stats" -H "Authorization: Bearer $TOKEN")
if [[ "$STATS_RES" != *"\"files\":1"* ]] || [[ "$STATS_RES" != *"\"folders\":1"* ]]; then
  echo "FAIL (FR-ACCT-020): Expected stats to have files:1 and folders:1, got: $STATS_RES"
  exit 1
fi
echo "PASS (FR-ACCT-020): Folder stats returned correctly"

# 9. Cleanup
echo "Cleaning up..."
curl -s -X DELETE "$API_BASE_URL/nodes/$FILE_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X DELETE "$API_BASE_URL/nodes/$FOLDER_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
rm -f test_$$.txt

echo ""
echo "--- ALL AUTOMATED TESTS PASSED ---"
echo ""
echo "Manual Validation Checklist:"
echo "[ ] Web: Double-click a file and see the viewer with nothing saved to downloads."
echo "[ ] Web: Step through a folder of mixed files and folders using left/right arrows, ensuring folders are skipped."
echo "[ ] Web: Reload a ?file= URL and verify the file opens automatically."
echo "[ ] Web: Select a file and verify the details pane shows preview and metadata."
echo "[ ] Web: Select a folder and verify the details pane shows folder stats."
echo "[ ] Web: Clear selection and verify the details pane shows the current open folder's stats."
echo ""
