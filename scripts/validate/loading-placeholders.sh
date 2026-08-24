#!/bin/bash
set -euo pipefail

# scripts/validate/loading-placeholders.sh
# Proves FR-VIEW-070: Boot placeholder is shipped in index.html

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"

echo "Validating loading placeholders..."

echo "Checking API reachability..."
if ! curl -s -f "${API_BASE_URL}/health" >/dev/null; then
  echo "FAIL: API is unreachable at ${API_BASE_URL} (BR-050)"
  exit 1
fi

echo "Checking Web reachability..."
if ! curl -s "${WEB_BASE_URL}" >/dev/null; then
  echo "FAIL: Web is unreachable at ${WEB_BASE_URL} (BR-050)"
  exit 1
fi

echo "Proving FR-VIEW-070: Boot placeholder is in index.html..."
HTML=$(curl -s "${WEB_BASE_URL}")

if ! echo "$HTML" | grep -q 'id="root"'; then
  echo "FAIL [FR-VIEW-070]: #root container missing from index.html"
  exit 1
fi

if ! echo "$HTML" | grep -q 'style="'; then
  echo "FAIL [FR-VIEW-070]: Inline style block missing from #root"
  exit 1
fi

if ! echo "$HTML" | grep -q 'oklch(1 0 0)' && ! echo "$HTML" | grep -q 'oklch(0.145 0 0)'; then
  echo "FAIL [FR-VIEW-070]: oklch theme variables missing from boot placeholder"
  exit 1
fi

echo "PASS [FR-VIEW-070]: Boot placeholder found in index.html"

echo ""
echo "--- MANUAL VERIFICATION CHECKLIST ---"
echo "To fully verify FR-VIEW-070 and BR-050, test the following in a browser:"
echo "1. Network throttle: Refresh the page with 'Fast 3G' — the shell outline should appear immediately before React mounts."
echo "2. Folder transition: Click a folder in the sidebar — ListingToolbar should remain visible, with ListingSkeleton underneath."
echo "3. Dialogs: Open Move dialog — FolderPicker should show FolderTreeSkeleton while loading."
echo "4. Details pane: Select a folder — Details pane should show skeleton bars for stats."
echo "5. Storage footer: Empty the cache and reload — Storage footer should show skeleton bar."
echo "6. File viewer PDF: Open a PDF — skeleton should overlay the frame until the PDF fully paints."
echo "7. File viewer Error: Use network blocking on the preview URL — FileViewer should swap to the 'Could not load preview' state."
echo "8. Shared link: Open a folder shared link with network throttled — the shell should load first without revealing the owner email, then populate."
echo "-------------------------------------"

exit 0
