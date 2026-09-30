#!/bin/bash
# Confirm RoomView's guard survived into the image, matching on an unambiguous
# fragment (spaces in grep patterns are unreliable through nested quoting).
docker run --rm --entrypoint sh 2d-metaverse:local -c '
  echo "--- RoomView identity (No Camera Available) ---"
  grep -lc "No Camera Available" /app/dist/assets/*.js 2>/dev/null
  echo "--- guard fragment: rebuild ---"
  for f in /app/dist/assets/*.js; do
    c=$(grep -c "deploy.env and rebuild" "$f" 2>/dev/null)
    c=${c:-0}
    if [ "$c" != "0" ]; then echo "$(basename "$f"): $c"; fi
  done
  echo "--- guard fragment: is.not.configured ---"
  for f in /app/dist/assets/*.js; do
    c=$(grep -c "is.not.configured" "$f" 2>/dev/null)
    c=${c:-0}
    if [ "$c" != "0" ]; then echo "$(basename "$f"): $c"; fi
  done
'