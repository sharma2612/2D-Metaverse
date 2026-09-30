import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
const app = express();
const server = http.createServer(app);


const allowedOrigin = process.env.CLIENT_ORIGIN || '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin === '*' ? true : allowedOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST'],
    credentials: allowedOrigin !== '*',
  },
});

let userSocketMap = {};
const groupMessages = [];
export function getReceiverId(userId) {
  return userSocketMap[userId];
}

io.on('connection', (socket) => {

  socket.on("connected", ({userId})=>{
  

  socket.join('global-room');
  socket.emit("load-group-messages", groupMessages);

  if (userId) {
    console.log("user connected");
    if(!userSocketMap[userId]) userSocketMap[userId] = socket.id;
    console.log(`New user: ${userId} (${socket.id})`);

    socket.broadcast.emit('new-user-connected', { id1: userId });

    io.emit("getOnlineUser", Object.keys(userSocketMap));
    io.emit('existing_users', Object.keys(userSocketMap));
  }
});

  socket.on('player-position', (data) => {
    socket.broadcast.emit('player-position', data);
  });


  socket.on("proximity", ({ player1, player2 }) => {
  const socketId1 = getReceiverId(player1);
  const socketId2 = getReceiverId(player2);
  if (socketId1) io.to(socketId1).emit("showInteraction", player2);
  if (socketId2) io.to(socketId2).emit("showInteraction", player1);
  });


  socket.on("non_proximity", ({ player1, player2 }) => {
  const socketId1 = getReceiverId(player1);
  const socketId2 = getReceiverId(player2);

  if (socketId1) setTimeout(()=>{io.to(socketId1).emit("hideInteraction", player2)},3000);
  if (socketId2) setTimeout(()=>{io.to(socketId2).emit("hideInteraction", player1)},3000);
  });

  socket.on("group-message", ({message }) => {
  groupMessages.push(message);
  io.emit("group-message", message);
});



  socket.on('disconnect', () => {
    const disconnectedUserId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      socket.broadcast.emit('user-disconnected', { id: disconnectedUserId });
      io.emit("getOnlineUser", Object.keys(userSocketMap));
      io.emit('user:offline', socket.id); 

      console.log(`User disconnected: ${disconnectedUserId}`);
    }
    if (Object.keys(userSocketMap).length === 0) {
    groupMessages.length = 0;
    console.log("All users disconnected — chat buffer cleared.");
  }
  });

  socket.on("join room",(data)=>{
    const {username,room} = data;
    socket.join(room);
    io.to(room).emit("user:joined",{username,id:socket.id});
    io.to(socket.id).emit("Joined",data);

  })
    socket.on("call-user",({remoteSocketId,offer,username})=>{
      console.log(remoteSocketId);
          io.to(remoteSocketId).emit('incoming-call',{from:username,offer:offer,id:socket.id});
    })

    socket.on("call-accepted",(data) =>{
      const {username,answer,id} = data;
      console.log(username);
      io.to(id).emit("call-accepted",{answer});
    })

    socket.on('nego',({to,offer})=>{
      io.to(to).emit("nego",{from:socket.id,offer});
    })
    socket.on('nego_done',({to,ans})=>{
      io.to(to).emit("nego_final",{ans});
    })
    
    socket.on("join_peer",(data)=>{
      console.log("getcall");
      const {from,to,room} = data;
      const toId = getReceiverId(to);
      io.to(toId).emit("join_peer",{from,room});
    });
    socket.on("accept_call", (data)=>{
      const {from,to} = data;
      const reId = getReceiverId(to);
      io.to(reId).emit("call_accepted",{from});
    }
  );
    socket.on("reject_call", (data)=>{
      const {from,to} = data;
      const reId = getReceiverId(to);
      io.to(reId).emit("call_rejected",{from});
    });
    socket.on('end-call', ({to})=>{
      io.to(to).emit('end-call');
    })
});


export { io, server, app };