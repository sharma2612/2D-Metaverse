#!/bin/bash
# Confirms the LiveKit URL the browser will actually receive is a valid,
# inlined wss:// string rather than undefined.
set -u
echo "=== VITE_LIVEKIT_URL baked into the served bundle? ==="
docker run --rm --entrypoint sh 2d-metaverse:local -c '
  entry=$(ls /app/dist/assets | grep -E "^index-.*\.js$" | head -1)
  echo "entry chunk: $entry"
  if grep -q "videoserve-h5g2fyz6.livekit.cloud" "/app/dist/assets/$entry"; then
    echo "RESULT: livekit host string FOUND in bundle"
  else
    echo "RESULT: livekit host string MISSING from bundle"
  fi
  echo "--- occurrences ---"
  grep -o "wss://videoserve-h5g2fyz6.livekit.cloud" "/app/dist/assets/$entry" | wc -l
  echo "--- guard message present? ---"
  grep -c "VITE_LIVEKIT_URL is not set" "/app/dist/assets/$entry"
'