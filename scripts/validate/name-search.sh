#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

echo "Validating name-search..."

# Ensure API is reachable
if ! curl -s -f "$API_BASE_URL/health" > /dev/null; then
  echo "  ❌ API is unreachable at $API_BASE_URL"
  echo "     Start the API and try again."
  exit 1
fi

# ---------------------------------------------------------------------------
# Setup: create a fresh user for this run
# ---------------------------------------------------------------------------
EMAIL="test_search_$(date +%s)@example.com"
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
# Create fixtures: folder_abc (parent), folder_def (child), file_xyz (child)
# ---------------------------------------------------------------------------
RESP_ABC=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_abc\",\"parentId\":\"$ROOT_ID\"}")
ID_ABC=$(echo "$RESP_ABC" | sed '$d' | jq -r '.id')

RESP_DEF=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"folder_def\",\"parentId\":\"$ID_ABC\"}")
ID_DEF=$(echo "$RESP_DEF" | sed '$d' | jq -r '.id')

# We can only create folders easily via API without S3 uploads, but we can search them.

# ---------------------------------------------------------------------------
# Search scenario
# ---------------------------------------------------------------------------
RESP_SEARCH=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/search?q=def" \
  -H "Authorization: Bearer $TOKEN")
CODE_SEARCH=$(echo "$RESP_SEARCH" | tail -n1)
BODY_SEARCH=$(echo "$RESP_SEARCH" | sed '$d')

expect_status 200 "$CODE_SEARCH" "Search for 'def'"

COUNT=$(echo "$BODY_SEARCH" | jq '.items | length')
if [ "$COUNT" -ne 1 ]; then
  echo "❌ Search for 'def' expected 1 result, got $COUNT"
  exit 1
fi
echo "✅ Search result count is correct"

# Check authorization rejection for shares
# Create a share first to get a token
RESP_SHARE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/shares" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"$ID_DEF\",\"mode\":\"PUBLIC\"}")
SHARE_TOKEN=$(echo "$RESP_SHARE" | sed '$d' | jq -r '.token')

RESP_SHARE_SEARCH=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/search?q=def" \
  -H "Authorization: Share $SHARE_TOKEN")
CODE_SHARE_SEARCH=$(echo "$RESP_SHARE_SEARCH" | tail -n1)
BODY_SHARE_SEARCH=$(echo "$RESP_SHARE_SEARCH" | sed '$d')

expect_status 403 "$CODE_SHARE_SEARCH" "Share principal cannot search"
expect_code "READ_ONLY" "$BODY_SHARE_SEARCH" "Share principal gets READ_ONLY code"


echo ""
echo "✅ All API scenarios passed!"

echo ""
echo "=== Manual UI Verification Checklist ==="
echo "Sign in at $WEB_BASE_URL as: $EMAIL"
echo ""
echo "1. Search Input"
echo "   a. Type in the search box in the header."
echo "   b. The dropdown should appear."
echo "   c. Less than 3 characters should not trigger a request."
echo "   d. Typing 'def' should show 'folder_def' in the results."
echo "   e. The results should show the path 'folder_abc'."
echo ""
echo "2. Navigation"
echo "   a. Click on the search result."
echo "   b. The UI should navigate to the folder's parent for files, or the folder itself."
echo "   c. The search box should close and clear."
echo "========================================"
