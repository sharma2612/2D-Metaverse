import { AccessToken, RoomServiceClient, } from 'livekit-server-sdk';
import express from 'express';

const router = express.Router();

// Built on first use rather than at import time: the constructor throws on an
// undefined URL, which would otherwise stop the whole server from starting.
let livekit;
const getLivekit = () => {
  if (!livekit) {
    livekit = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }
  return livekit;
};

const requireLivekit = (res) => {
  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    res.status(503).send({ error: 'LiveKit is not configured on this server' });
    return false;
  }
  return true;
};
router.get('/get-token', async(req, res) => {
  if (!requireLivekit(res)) return;
  const { room, name } = req.query;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: name,
  });
  at.addGrant({ roomJoin: true, room });

  const token = await at.toJwt();
  console.log(token);
  res.json({ token });
});

router.get('/create-room', async (req, res) => {
  if (!requireLivekit(res)) return;
  const { name } = req.query;
  try {
    await getLivekit().createRoom({ name });
    res.send({ message: 'Room created' });
  } catch (err) {
    if (err.message.includes('exists')) {
      res.send({ message: 'Room already exists' });
    } else {
      res.status(500).send({ error: err.message });
    }
  }
});

router.get('/rooms', async (req, res) => {
  if (!requireLivekit(res)) return;
  try {
    const rooms = await getLivekit().listRooms();
    res.send({ rooms });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export default router;