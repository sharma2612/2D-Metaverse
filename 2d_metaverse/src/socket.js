import { io } from 'socket.io-client';

const socket = io(import.meta.env.MODE === "development" ? "http://localhost:5000/api/v1/" :"/", {
  transports: ["websocket"],
});

// STUN only discovers public candidates, which is not enough to traverse
// symmetric NAT (most mobile carriers). TURN relays traffic when a direct path
// cannot be found, so it is appended whenever credentials are configured in
// deploy.env. Without it, calls fail to connect for a large share of mobile
// users rather than erroring loudly.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const turnUrl = import.meta.env.VITE_TURN_URL;
if (turnUrl) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  });
}

function createPeer() {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
}

export let peer = createPeer();


export const createOffer = async () => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async (offer) => {
  if (!offer || !offer.sdp || !offer.type) {
    console.error("Invalid offer:", offer);
    return;
  }

  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  return answer;
};

export const setRemoteAns = async (answer) => {
  if (!answer || !answer.sdp || !answer.type) {
    console.error("Invalid answer:", answer);
    return;
  }

  await peer.setRemoteDescription(new RTCSessionDescription(answer));
};


export const resetPeer = ()=>{
  peer = createPeer();
}


export default socket;
