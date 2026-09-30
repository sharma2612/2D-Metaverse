#!/bin/bash
# Confirms the published container port is reachable from Windows via localhost.
set -u
NAME=2d-metaverse
echo "=== container ==="
docker inspect -f 'name={{.Name}} status={{.State.Status}} ports={{json .NetworkSettings.Ports}}' "$NAME"
echo
echo "=== listening inside the container ==="
docker exec "$NAME" node -e "
  fetch('http://127.0.0.1:5000/')
    .then(async r => console.log('inside container ->', r.status, (await r.text()).length, 'bytes'))
    .catch(e => console.log('inside container -> ERR', e.message))
"
sleep 2
echo
echo "=== logs ==="
docker logs "$NAME" 2>&1 | head -5