#!/usr/bin/env bash
set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Validating change: e2e-and-pdf-upload-fix"
echo "Target API: $API_BASE_URL"

# Preflight: Check if API is reachable
if ! curl -s -f "$API_BASE_URL/health" >/dev/null; then
  echo -e "${RED}Error: API is unreachable at $API_BASE_URL${NC}"
  echo "Make sure you ran: docker compose up -d && pnpm dev"
  exit 1
fi

echo -e "${GREEN}API is reachable.${NC}"

# Variables
TEST_EMAIL="validation-$(date +%s)@test.com"
TEST_PASSWORD="password123!"

# Helper to assert HTTP status
assert_status() {
  local expected=$1
  local actual=$2
  local code=$3
  local test_name=$4
  local req_id=$5

  if [ "$actual" -ne "$expected" ]; then
    echo -e "${RED}FAIL${NC} [$req_id] $test_name (expected $expected, got $actual)"
    echo "Error code: $code"
    exit 1
  fi
  echo -e "${GREEN}PASS${NC} [$req_id] $test_name"
}

# 1. Sign up
echo -n "Signing up... "
SIGNUP_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_STATUS=$(echo "$SIGNUP_RES" | tail -n1)
BODY=$(echo "$SIGNUP_RES" | sed '$ d')

assert_status 201 "$HTTP_STATUS" "" "Sign up new user" "FR-AUTH-010"

TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
ROOT_ID=$(echo "$BODY" | grep -o '"rootId":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ] || [ -z "$ROOT_ID" ]; then
  echo -e "${RED}Failed to extract token or rootId${NC}"
  exit 1
fi

# 2. Upload valid PDF
echo -n "Uploading valid PDF... "
PDF_FILE=$(mktemp)
echo "%PDF-1.4 mock content" > "$PDF_FILE"
UPLOAD_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$ROOT_ID" \
  -F "file=@$PDF_FILE;filename=doc.pdf;type=application/pdf")

HTTP_STATUS=$(echo "$UPLOAD_RES" | tail -n1)
BODY=$(echo "$UPLOAD_RES" | sed '$ d')
FILE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

assert_status 201 "$HTTP_STATUS" "" "Valid PDF upload" "FR-FILE-010"

# 3. Upload same PDF again (Duplicate name check)
echo -n "Uploading duplicate PDF... "
DUP_UPLOAD_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$ROOT_ID" \
  -F "file=@$PDF_FILE;filename=doc.pdf;type=application/pdf")

HTTP_STATUS=$(echo "$DUP_UPLOAD_RES" | tail -n1)
DUP_BODY=$(echo "$DUP_UPLOAD_RES" | sed '$ d')
DUP_NAME=$(echo "$DUP_BODY" | grep -o '"name":"[^"]*' | grep -o '[^"]*$')
ERROR_CODE=$(echo "$DUP_BODY" | grep -o '"code":"[^"]*' | grep -o '[^"]*$' || echo "")

assert_status 201 "$HTTP_STATUS" "$ERROR_CODE" "Duplicate PDF upload gets suffixed name" "BR-020"

if [[ ! "$DUP_NAME" =~ \([0-9]+\)\.pdf$ ]]; then
  echo -e "${RED}FAIL${NC} [BR-020] Duplicate PDF name not suffixed correctly (got $DUP_NAME)"
  exit 1
fi

# 4. Upload SVG (Unsupported Media Type)
echo -n "Uploading SVG... "
SVG_FILE=$(mktemp)
echo "<svg></svg>" > "$SVG_FILE"
SVG_UPLOAD_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$ROOT_ID" \
  -F "file=@$SVG_FILE;type=image/svg+xml")

HTTP_STATUS=$(echo "$SVG_UPLOAD_RES" | tail -n1)
SVG_BODY=$(echo "$SVG_UPLOAD_RES" | sed '$ d')
ERROR_CODE=$(echo "$SVG_BODY" | grep -o '"code":"[^"]*' | grep -o '[^"]*$' || echo "")

assert_status 415 "$HTTP_STATUS" "$ERROR_CODE" "SVG upload rejected" "BR-040"

# 5. Create Target Folder
echo -n "Creating target folder... "
FOLDER_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$ROOT_ID\",\"name\":\"Target Folder\"}")

HTTP_STATUS=$(echo "$FOLDER_RES" | tail -n1)
FOLDER_BODY=$(echo "$FOLDER_RES" | sed '$ d')
FOLDER_ID=$(echo "$FOLDER_BODY" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

assert_status 201 "$HTTP_STATUS" "" "Create folder" "FR-FLDR-010"

# 6. Move File
echo -n "Moving file... "
MOVE_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ids\":[\"$FILE_ID\"],\"targetId\":\"$FOLDER_ID\"}")

HTTP_STATUS=$(echo "$MOVE_RES" | tail -n1)
assert_status 201 "$HTTP_STATUS" "" "Move file" "FR-FLDR-040"

# 7. Share Folder
echo -n "Sharing folder... "
SHARE_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/shares" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"$FOLDER_ID\",\"mode\":\"PUBLIC\"}")

HTTP_STATUS=$(echo "$SHARE_RES" | tail -n1)
SHARE_BODY=$(echo "$SHARE_RES" | sed '$ d')
SHARE_TOKEN=$(echo "$SHARE_BODY" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
SHARE_ID=$(echo "$SHARE_BODY" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

assert_status 201 "$HTTP_STATUS" "" "Share folder" "FR-SHARE-010"

# 8. Try to mutate folder with Share token
echo -n "Mutating with share token... "
MUTATE_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Share $SHARE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$FOLDER_ID\",\"name\":\"Subfolder\"}")

HTTP_STATUS=$(echo "$MUTATE_RES" | tail -n1)
MUTATE_BODY=$(echo "$MUTATE_RES" | sed '$ d')
ERROR_CODE=$(echo "$MUTATE_BODY" | grep -o '"code":"[^"]*' | grep -o '[^"]*$' || echo "")

assert_status 403 "$HTTP_STATUS" "$ERROR_CODE" "Mutate with VIEWER share fails" "BR-070"

# Cleanup
echo "Cleaning up temp files..."
rm "$PDF_FILE"
rm "$SVG_FILE"
# Note: we are not deleting the user here as the teardown script in e2e tests handles DB cleanup,
# but for manual verification scripts, we don't necessarily truncate the whole DB. 
# We could delete the root folder to cascade delete, but deleting root is not allowed by API.
# So we just leave the test user.

echo ""
echo "========================================="
echo "MANUAL VERIFICATION CHECKLIST (UI)"
echo "========================================="
echo "1. Log into the web app at $WEB_BASE_URL with:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo "2. Upload a valid PDF via the drag-drop UI and verify it uploads successfully."
echo "3. Upload an unsupported file (like SVG) and verify the optimistic UI shows an error and removes it."
echo "4. Try to upload a duplicate file and verify it gets suffixed with (1)."
echo "5. Create a folder, move the uploaded file into it."
echo "6. Share the folder and verify the public link works in an Incognito window."
echo "========================================="
