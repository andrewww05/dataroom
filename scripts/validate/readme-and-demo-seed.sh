#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"
DEMO_EMAIL="${SEED_DEMO_EMAIL:-demo@example.com}"
DEMO_PASSWORD="${SEED_DEMO_PASSWORD:-demodemo1}"

echo "Validating readme-and-demo-seed change..."

# 1. Assert API is reachable (FR-OPS-010)
if ! curl -s -o /dev/null -f "$API_BASE_URL/health"; then
  echo "❌ FR-OPS-010 (health returns 200) - FAILED: Could not reach $API_BASE_URL/health"
  exit 1
fi
echo "✅ FR-OPS-010 (health returns 200) - PASSED"

# 2. Login with demo credentials and verify listing (FR-OPS-030)
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ FR-OPS-030 (login with demo credentials) - FAILED: Expected 200, got $HTTP_STATUS"
  echo "Response body: $BODY"
  exit 1
fi

TOKEN=$(echo "$BODY" | jq -r '.token')
ROOT_ID=$(echo "$BODY" | jq -r '.dataRoom.rootId')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ FR-OPS-030 (login with demo credentials) - FAILED: Missing token in response"
  exit 1
fi

LISTING_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/nodes/$ROOT_ID/children" \
  -H "Authorization: Bearer $TOKEN")

LISTING_STATUS=$(echo "$LISTING_RESPONSE" | tail -n1)
LISTING_BODY=$(echo "$LISTING_RESPONSE" | sed '$d')

if [ "$LISTING_STATUS" != "200" ]; then
  echo "❌ FR-OPS-030 (demo listing) - FAILED: Expected 200, got $LISTING_STATUS"
  echo "Response body: $LISTING_BODY"
  exit 1
fi

FOLDER_COUNT=$(echo "$LISTING_BODY" | jq '.items | length')
if [ "$FOLDER_COUNT" -eq 0 ]; then
  echo "❌ FR-OPS-030 (demo listing) - FAILED: Listing contains 0 items, expected at least one folder"
  exit 1
fi
echo "✅ FR-OPS-030 (login + listing contains at least one folder) - PASSED"

# 3. Assert README contains required sections (FR-OPS-020)
if ! grep -q "How it scales" README.md; then
  echo "❌ FR-OPS-020 (README.md sections) - FAILED: Missing 'How it scales'"
  exit 1
fi
if ! grep -q "ERD" README.md; then
  echo "❌ FR-OPS-020 (README.md sections) - FAILED: Missing 'ERD'"
  exit 1
fi
if ! grep -q "Running it somewhere else" README.md; then
  echo "❌ FR-OPS-020 (README.md sections) - FAILED: Missing 'Running it somewhere else'"
  exit 1
fi
if ! grep -q "AI" README.md; then
  echo "❌ FR-OPS-020 (README.md sections) - FAILED: Missing 'AI'"
  exit 1
fi
echo "✅ FR-OPS-020 (README.md contains required sections) - PASSED"

echo ""
echo "--- Manual Verification Checklist ---"
echo "[ ] The mermaid ERD renders correctly on GitHub."
echo "[ ] Setup from a clean clone has been verified by hand."
