import { useEffect, useRef, useState } from 'react';
import {
  Room,
  Track,
  createLocalTracks,
  LocalVideoTrack,
  ConnectionState,
} from 'livekit-client';
import { axiosToInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { MicrophoneIcon, MicrophoneSlashIcon } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const RoomView = () => {
  const { videoChatRomm,endVideoCall } = useChatStore();
  const { authUser } = useAuthStore();
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const localVideoRef = useRef(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [speakingMap, setSpeakingMap] = useState({});
  const [speaking,setSpeaking] = useState(true);
  const createFallbackVideoTrack = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('No Camera Available', 150, 250);
    setInterval(() => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillText('No Camera Available', 150, 250);
    }, 1000 / 30);
    const stream = canvas.captureStream(30);
    return new LocalVideoTrack(stream.getVideoTracks()[0]);
  };

  const attachTrack = (track, participant) => {
    if (track.kind === Track.Kind.Video) {
      const el = track.attach();
      el.autoplay = true;
      el.playsInline = true;
      el.classList.add('rounded-lg');
      const tryAttach = () => {
        const container = document.getElementById(`remote-${participant.identity}`);
        if (container) {
          container.innerHTML = '';
          container.appendChild(el);
        } else {
          setTimeout(tryAttach, 100);
        }
      };
      tryAttach();
    } else if (track.kind === Track.Kind.Audio) {
      const el = track.attach();
      document.body.appendChild(el);
    }
  };

  const joinRoom = async () => {
    if (room && room.connectionState === ConnectionState.Connected) return;

    // Room.connect() builds a URL out of this value, so an unset
    // VITE_LIVEKIT_URL surfaces as an opaque "Invalid URL" TypeError deep inside
    // the SDK. Fail with an actionable message instead.
    const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;
    if (!LIVEKIT_URL) {
      console.error(
        'VITE_LIVEKIT_URL is not set. Add it to deploy.env and rebuild the image.'
      );
      toast.error('Video is not configured: VITE_LIVEKIT_URL is missing');
      return;
    }

    try {
      const tokenRes = await axiosToInstance.get(
        `/live/get-token?room=${videoChatRomm}&name=${authUser.username}`
      );
      const token = tokenRes.data.token;

      const newRoom = new Room();
      setRoom(newRoom);

      newRoom.on('connectionStateChanged', async (state) => {
        if (state === 'connected') {
          setConnected(true);

          // Existing remote participants
          for (const participant of newRoom.remoteParticipants.values()) {
            setParticipants((prev) => [...prev, participant]);

            participant.on('trackSubscribed', (track) => {
              attachTrack(track, participant);
            });

            // 🔊 Detect speaking
            participant.on('isSpeakingChanged', () => {
              setSpeakingMap((prev) => ({
                ...prev,
                [participant.identity]: participant.isSpeaking,
              }));
            });
          }

          let localTracks;
          try {
            localTracks = await createLocalTracks({
              video: { width: 250, height: 150, frameRate: 60 },
              audio: true,
            });
          } catch (err) {
            localTracks = [createFallbackVideoTrack()];
          }

          for (const track of localTracks) {
            await newRoom.localParticipant.publishTrack(track);

            if (track.kind === Track.Kind.Audio) {
              setLocalAudioTrack(track);
            }

            if (track.kind === Track.Kind.Video && localVideoRef.current) {
              const el = track.attach();
              el.muted = true;
              el.autoplay = true;
              el.playsInline = true;
              el.classList.add('rounded-lg');
              localVideoRef.current.innerHTML = '';
              localVideoRef.current.appendChild(el);
              await el.play().catch(console.warn);
            }
          }

          // 🔊 Local speaking detection
          newRoom.localParticipant.on('isSpeakingChanged', () => {
            setLocalSpeaking(newRoom.localParticipant.isSpeaking);
          });
        }
      });

      newRoom.on('participantConnected', (participant) => {
        setParticipants((prev) => [...prev, participant]);

        participant.on('trackSubscribed', (track) => {
          attachTrack(track, participant);
        });

        participant.on('isSpeakingChanged', () => {
          setSpeakingMap((prev) => ({
            ...prev,
            [participant.identity]: participant.isSpeaking,
          }));
        });
      });

      newRoom.on('participantDisconnected', (participant) => {
        setParticipants((prev) =>
          prev.filter((p) => p.identity !== participant.identity)
        );
      });
      await newRoom.connect(LIVEKIT_URL, token);

      newRoom.on('connected', (participant) => {
        setParticipants((prev) => [...prev, participant]);

        participant.on('trackSubscribed', (track) => {
          attachTrack(track, participant);
        });

        participant.on('isSpeakingChanged', () => {
          setSpeakingMap((prev) => ({
            ...prev,
            [participant.identity]: participant.isSpeaking,
          }));
        });
      });

    } catch (err) {
      console.error('❌ Could not join room:', err);
    }
  };

  const handleCallEnd = (e) =>{
      e.preventDefault();
      const confirm = window.confirm("Do you want to end the call");

      if(confirm)
      {
        room.disconnect();
        setParticipants({});
        endVideoCall();
      }
  }
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
        room.removeAllListeners();
      }
      setRoom(null);
      setParticipants([]);
    };
  }, []);

  return (
    <div className="bg-transparent absolute top-0.5 left-170 rounded-lg z-500">
      {!connected ? (
        <button
          onClick={joinRoom}
          className="bg-base text-center mt-1 btn btn-active  z-400 ml-30"
        >
          Join Room
        </button>
      ) : (
        <div>
          <div className='flex flex-row gap-5 bg-base-200 rounded-lg py-2 justify-center w-100 mt-0.5'>
            <div className="text-base-content text-center">Room: {videoChatRomm} </div>
            <div className="text-base-content text-center">Connected as: {authUser.username}</div>
            <button
              onClick={() => {
                if (localAudioTrack) {
                  room.localParticipant.setMicrophoneEnabled(
                    !room.localParticipant.isMicrophoneEnabled
                  );
                  setSpeaking(!speaking);
                }
              }}
              className="rounded cursor-pointer"
            >
              {!speaking ? (
                <MicrophoneSlashIcon size={20} />
              ) : (
                <MicrophoneIcon size={20} />
              )}
            </button>
              <button className='btn btn-error btn-xs' onClick={handleCallEnd}>End</button>
          </div>
          <div className="flex flex-wrap gap-4 ">
            {/* Local User */}
            <div className="flex flex-col items-center">
              <div ref={localVideoRef} className="rounded-lg overflow-hidden bg-transparent w-48 h-32 pt-3" />
              <div className='flex flex-row gap-3'>
                <span className=" text-sm text-center font-medium text-white">You</span>
                <div>
                  {localSpeaking ? (
                    <MicrophoneSlashIcon size={20} weight="fill" className="text-green-500" />
                  ) : (
                    <MicrophoneIcon size={20} weight="fill" className="text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Remote Participants */}
            {participants.map((p) => (
              <div key={p.identity} className="flex flex-col items-center">
                <div
                  id={`remote-${p.identity}`}
                  className=" rounded-lg overflow-hidden w-48 h-32 pt-3 bg-transparent"
                />
                <div className='flex flex-row gap-3'>
                  <span className=" text-sm text-center font-medium text-white">{p.identity}</span>
                  <div>
                    {speakingMap[p.identity] ? (
                      <MicrophoneSlashIcon size={20} weight="fill" className="text-green-500" />
                    ) : (
                      <MicrophoneIcon size={20} weight="fill" className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomView;
