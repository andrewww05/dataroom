API_BASE_URL="http://localhost:3000/api"
OWNER_EMAIL="multer-$$@example.com"
PASSWORD="Password123!"

curl -s -X POST "$API_BASE_URL/auth/signup" -H "Content-Type: application/json" -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" > /dev/null
TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')
ROOM_ID=$(curl -s -X GET "$API_BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN" | jq -r '.dataRoom.rootId')

echo "hello" > file1.txt
echo "world" > file2.txt

curl -s -X POST "$API_BASE_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "parentId=$ROOM_ID" \
  -F "file=@file1.txt" \
  -F "file=@file2.txt"

rm file1.txt file2.txt
