const { io } = require('/mnt/c/Users/sumit/projec/2d-metaverse/2d_metaverse/node_modules/socket.io-client');
const URL = 'ws://127.0.0.1:5000';
const a = io(URL, { transports: ['websocket'] });
const b = io(URL, { transports: ['websocket'] });
let ok = false;
a.on('connect', () => { console.log('client A connected'); a.emit('connected', { userId: 'u1' }); });
b.on('connect', () => { console.log('client B connected'); b.emit('connected', { userId: 'u2' }); });
b.on('new-user-connected', (d) => { console.log('relay ok', JSON.stringify(d)); ok = true; });
b.on('player-position', (d) => console.log('position relay:', JSON.stringify(d)));
a.on('showInteraction', (w) => console.log('proximity relay:', w));
setTimeout(() => {
  a.emit('player-position', { x: 5, y: 6 });
  a.emit('proximity', { player1: 'u1', player2: 'u2' });
  setTimeout(() => { console.log(ok ? 'SOCKET PASS' : 'SOCKET FAIL'); process.exit(ok ? 0 : 1); }, 1500);
}, 3000);