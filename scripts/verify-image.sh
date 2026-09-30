#!/bin/bash
# Runs the built image and exercises it over HTTP + a live WebSocket.
set -u
NAME=mm-verify
docker rm -f "$NAME" >/dev/null 2>&1

docker run -d --name "$NAME" -p 5080:5000 2d-metaverse:local >/dev/null || exit 1

echo "waiting for boot..."
for i in $(seq 1 40); do
  code=$(docker exec "$NAME" node -e "fetch('http://127.0.0.1:5000/').then(r=>console.log(r.status)).catch(()=>console.log('down'))" 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 3
done
echo "boot status: ${code:-never}"

echo
echo "=== container user / workdir ==="
docker exec "$NAME" sh -c 'id -un; pwd'
docker inspect -f 'user={{.Config.User}} health={{json .Config.Healthcheck.Test}}' "$NAME" | head -c 300

echo
echo "=== firebase key baked into served bundle? ==="
ENTRY=$(docker exec "$NAME" sh -c 'ls /app/dist/assets | grep -E "^index-.*\.js$" | head -1')
echo "entry chunk: $ENTRY"
docker exec "$NAME" sh -c "grep -c 'AIzaSyCzb6aTyuOq5FSIuN7CJ-sBIgPvpmHRVic' /app/dist/assets/$ENTRY" || echo "key NOT found"

echo
echo "=== livekit secret present in /app/api/.env? ==="
docker exec "$NAME" sh -c 'grep -c "^LIVEKIT_API_SECRET=" /app/api/.env'

echo
echo "=== JIRA/GROQ/HF/GOOGLE keys leaked into image? ==="
docker exec "$NAME" sh -c 'grep -rl "ATATT3xFf\|gsk_TjEo\|hf_ELLh\|AIzaSyDmEB" /app 2>/dev/null | head -5' || true
echo "(empty above = clean)"

echo
echo "=== HTTP routes ==="
for p in / /map /room2/abc /api/v1/live/get-token /assets/does-not-exist.js; do
  out=$(docker exec "$NAME" node -e "
    fetch('http://127.0.0.1:5000$p')
      .then(r=>r.text().then(t=>console.log(r.status+' cc='+(r.headers.get('cache-control')||'-')+' len='+t.length)))
      .catch(e=>console.log('ERR'))
  " 2>/dev/null)
  printf '%-28s %s\n' "$p" "$out"
done

echo
echo "=== image size ==="
docker images 2d-metaverse:local --format '{{.Size}}'

docker rm -f "$NAME" >/dev/null 2>&1