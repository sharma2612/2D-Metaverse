#!/bin/bash
# Boots the image and runs the socket.io handshake + relay checks against it.
set -u
NAME=mm-sock
docker rm -f "$NAME" >/dev/null 2>&1
docker run -d --name "$NAME" -p 5081:5000 2d-metaverse:local >/dev/null || exit 1

for i in $(seq 1 40); do
  code=$(docker exec "$NAME" node -e "fetch('http://127.0.0.1:5000/').then(r=>console.log(r.status)).catch(()=>console.log('down'))" 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 3
done
echo "boot: ${code:-never}"

# Run the socket client from the host WSL side, pointed at the published port.
cat > /tmp/socktest.cjs <<'EOF'
const { io } = require('/mnt/c/Users/sumit/projec/2d-metaverse/2d_metaverse/node_modules/socket.io-client');
const URL = 'ws://127.0.0.1:5081';
const a = io(URL, { transports: ['websocket'] });
const b = io(URL, { transports: ['websocket'] });
let ok = false;
a.on('connect', () => a.emit('connected', { userId: 'u1' }));
b.on('connect', () => b.emit('connected', { userId: 'u2' }));
b.on('new-user-connected', () => { console.log('connect relay: ok'); ok = true; });
b.on('player-position', (d) => console.log('position relay:', JSON.stringify(d)));
a.on('showInteraction', (w) => console.log('proximity relay:', w));
setTimeout(() => {
  a.emit('player-position', { x: 11, y: 22 });
  a.emit('proximity', { player1: 'u1', player2: 'u2' });
  setTimeout(() => {
    console.log(ok ? 'SOCKET PASS' : 'SOCKET FAIL');
    process.exit(ok ? 0 : 1);
  }, 1500);
}, 2000);
EOF

apt-get install -y -qq nodejs >/dev/null 2>&1 || true
node /tmp/socktest.cjs
rc=$?

echo
echo "=== livekit token with params (inside container) ==="
docker exec "$NAME" node -e "
fetch('http://127.0.0.1:5000/api/v1/live/get-token?room=SmokeRoom&name=smokeuser')
  .then(async r => { const j = await r.json(); console.log('status', r.status, '| token len', (j.token||'').length); })
  .catch(e => console.log('ERR', e.message))
"

docker rm -f "$NAME" >/dev/null 2>&1
exit $rc