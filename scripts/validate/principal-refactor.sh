#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

echo "Validating against API: $API_BASE_URL"

if ! curl -s -f "$API_BASE_URL/health" >/dev/null; then
  echo "FAIL: API is unreachable at $API_BASE_URL"
  exit 1
fi

echo "API is reachable."

# 1. Setup Owner
OWNER_EMAIL="owner-$$@example.com"
PASSWORD="Password123!"

echo "Setting up owner user..."
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" > /dev/null

OWNER_TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ -z "$OWNER_TOKEN" ] || [ "$OWNER_TOKEN" == "null" ]; then
  echo "FAIL: Could not log in owner."
  exit 1
fi

ROOM_ID=$(curl -s -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $OWNER_TOKEN" | jq -r '.dataRoom.rootId')

echo "Creating test folder..."
FOLDER_RES=$(curl -s -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$ROOM_ID\",\"name\":\"Shared Folder $$\"}")
FOLDER_ID=$(echo "$FOLDER_RES" | jq -r '.id')

# 2. Setup PUBLIC Share
PUBLIC_SHARE_RES=$(curl -s -X POST "$API_BASE_URL/shares" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"$FOLDER_ID\",\"mode\":\"PUBLIC\"}")
PUBLIC_TOKEN=$(echo "$PUBLIC_SHARE_RES" | jq -r '.token')

# 3. Setup RESTRICTED Share
GRANTEE_EMAIL="grantee-$$@example.com"
RESTRICTED_SHARE_RES=$(curl -s -X POST "$API_BASE_URL/shares" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"$FOLDER_ID\",\"mode\":\"RESTRICTED\",\"granteeEmail\":\"$GRANTEE_EMAIL\"}")
RESTRICTED_TOKEN=$(echo "$RESTRICTED_SHARE_RES" | jq -r '.token')

echo "Starting assertions..."

# 4. Assert FR-SHARE-020: PUBLIC admitted without JWT
echo "Testing FR-SHARE-020 (PUBLIC share without JWT)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/nodes/$FOLDER_ID/path" \
  -H "Authorization: Share $PUBLIC_TOKEN")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "FAIL (FR-SHARE-020): Expected 200, got $HTTP_STATUS"
  exit 1
fi
echo "PASS (FR-SHARE-020): PUBLIC share admitted without JWT"

# 5. Assert BR-070: anonymous caller on RESTRICTED -> 401 SIGN_IN_REQUIRED
echo "Testing BR-070 (anonymous on RESTRICTED)"
RES=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/nodes/$FOLDER_ID/path" \
  -H "Authorization: Share $RESTRICTED_TOKEN")

HTTP_STATUS=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$BODY" | jq -r '.code')

if [ "$HTTP_STATUS" != "401" ] || [ "$CODE" != "SIGN_IN_REQUIRED" ]; then
  echo "FAIL (BR-070): Expected 401 SIGN_IN_REQUIRED, got $HTTP_STATUS $CODE"
  exit 1
fi
echo "PASS (BR-070): RESTRICTED share without JWT is SIGN_IN_REQUIRED"

# 6. Assert BR-070: signed-in wrong email -> 404 NOT_FOUND
echo "Testing BR-070 (wrong email on RESTRICTED)"
WRONG_EMAIL="wrong-$$@example.com"
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$WRONG_EMAIL\",\"password\":\"$PASSWORD\"}" > /dev/null

WRONG_TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$WRONG_EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

RES=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/nodes/$FOLDER_ID/path" \
  -H "Authorization: Share $RESTRICTED_TOKEN, Bearer $WRONG_TOKEN")

HTTP_STATUS=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$BODY" | jq -r '.code')

if [ "$HTTP_STATUS" != "404" ] || [ "$CODE" != "NOT_FOUND" ]; then
  echo "FAIL (BR-070): Expected 404 NOT_FOUND, got $HTTP_STATUS $CODE"
  exit 1
fi
echo "PASS (BR-070): RESTRICTED share with wrong email is NOT_FOUND"

# 7. Assert BR-070: 403 READ_ONLY on mutating routes
echo "Testing BR-070 (403 READ_ONLY on mutating routes)"
curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$GRANTEE_EMAIL\",\"password\":\"$PASSWORD\"}" > /dev/null

GRANTEE_TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$GRANTEE_EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

RES=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/nodes/folders" \
  -H "Authorization: Share $RESTRICTED_TOKEN, Bearer $GRANTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$FOLDER_ID\",\"name\":\"Hacked Folder\"}")

HTTP_STATUS=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$BODY" | jq -r '.code')

if [ "$HTTP_STATUS" != "403" ] || [ "$CODE" != "READ_ONLY" ]; then
  echo "FAIL (BR-070): Expected 403 READ_ONLY, got $HTTP_STATUS $CODE"
  exit 1
fi
echo "PASS (BR-070): RESTRICTED share (admitted) is refused 403 READ_ONLY on mutating route"

# 8. Cleanup
echo "Cleaning up..."
# Cascade through the owner deletes all nodes and shares in that room
curl -s -X DELETE "$API_BASE_URL/nodes/$FOLDER_ID" -H "Authorization: Bearer $OWNER_TOKEN" > /dev/null
# Delete test user accounts via the Prisma-backed DB isn't exposed; they'll be cleaned by next run's DB reset
# (The script creates ephemeral accounts using $$ PID in the email, which is unique per run)

echo ""
echo "--- ALL AUTOMATED TESTS PASSED ---"
echo ""
echo "Manual Validation Checklist:"
echo "[ ] Web: The manual checklist for what only a browser can show is not applicable here as the change is entirely backend."
echo ""
