#!/bin/bash
# The guard message may land in any chunk, not just the entry.
docker run --rm --entrypoint sh 2d-metaverse:local -c '
  echo "--- which chunk holds the guard? ---"
  for f in /app/dist/assets/*.js; do
    n=$(grep -c "VITE_LIVEKIT_URL is not set" "$f" 2>/dev/null || echo 0)
    [ "$n" != "0" ] && echo "$(basename $f): $n match(es)"
  done
  echo "--- toast import resolved (react-hot-toast bundled)? ---"
  grep -l "HotToaster\|hot-toast" /app/dist/assets/*.js 2>/dev/null | head -3
'