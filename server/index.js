import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // lock this to your frontend domain in production
    methods: ["GET", "POST"],
  },
});

// Firebase Admin SDK init
import serviceAccount from "./asymmetric-moon-446511-g6-firebase-adminsdk-fbsvc-af340df1b0.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Add this at the top level to store room data
const rooms = {};

// Helper function to clean up room
const cleanupRoom = (roomId) => {
  const room = rooms[roomId];
  if (room && room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  delete rooms[roomId];
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on('authenticate', async ({ token }) => {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.userId = decoded.uid;
      socket.username = decoded.email || 'Anonymous';
      socket.emit('authenticated', { success: true });
      console.log(`✅ Authenticated ${socket.username}`);
    } catch (err) {
      console.log('❌ Auth failed:', err.message);
      socket.emit('authenticated', { success: false });
      socket.disconnect();
    }
  });


  //room creations
  socket.on('create_room', ({ questionId, timeLimit }, callback) => {
    if (!socket.userId){
      console.log("auth kar randi ke");
      return;
    }

    const roomId = Math.random().toString(36).slice(2, 8);
    rooms[roomId] = {
      owner: socket.userId,
      questionId,
      timeLimit,
      players: [socket.userId],
      playerNames: [socket.username],
      submissions: {},
      status: 'waiting',
    };
    socket.join(roomId);
    callback({ roomId });
    console.log(`🆕 Room ${roomId} created by ${socket.username}`);
  });

  socket.on('show_players' , ({roomId} , callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ players: [] });
    }
    callback({players : room.playerNames});
    console.log("players in room : " , roomId , " : " , room.playerNames);
  })

  // ✅ Join Room
  socket.on('join_room', ({ roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }

    if (room.players.length >= 2) {
      return callback({ success: false, message: 'Room is full' });
    }

    room.players.push(socket.userId);
    room.playerNames.push(socket.username);

    room.status = 'active';
    socket.join(roomId);
    callback({ success: true, roomId });

    // Notify all players in the room about the new player
    io.to(roomId).emit('player_joined', { 
      playerId: socket.userId, 
      username: socket.username,
      totalPlayers: room.players.length 
    });

    // Only start the game when there are exactly 2 players
    if (room.players.length === 2) {
      io.to(roomId).emit('room_ready', { owner: room.owner });
    }
    else {
      console.log(`🚪 ${socket.username} joined room ${roomId}, waiting for more players`);
    }
  });

  //start room game
  socket.on('start_game' , ({roomId}) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'active') return;

    // Only allow the owner to start the game (optional)
    if (socket.userId !== room.owner) return;

    if (!room.timerInterval) {
      let timeLeft = room.timeLimit;
      room.currentTime = timeLeft;
      room.timerInterval = setInterval(() => {
        timeLeft -= 1;
        room.currentTime = timeLeft;
        io.to(roomId).emit('tick', { timeLeft });
        if (timeLeft < 0 || room.status === 'finished') {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
          io.to(roomId).emit('match_end', { submissions: room.submissions });
          cleanupRoom(roomId);
        }
      }, 1000);

      io.to(roomId).emit('start_game', { questionId: room.questionId });
      console.log(`Game started in room ${roomId}`);
    }
  })


  // ✅ Submit Code (basic validation only)
  socket.on('submit_code', ({ roomId, output, passed }, callback) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'active') return;

    const timeTaken = room.timeLimit; // Placeholder: track actual time in production
    room.submissions[socket.userId] = {
      username: socket.username,
      passed,
      timeTaken,
      output,
    };

    const passedUsers = Object.values(room.submissions).filter(s => s.passed);
    if (passedUsers.length === 1) {
      console.log("winner decided")
      // Stop the timer when winner is decided
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.status = 'finished';
      io.to(roomId).emit('winner', { winner: socket.username });
    } else if (Object.keys(room.submissions).length === 2) {
      room.status = 'finished';
      console.log("ending match")
      // Stop the timer when both players have submitted
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      io.to(roomId).emit('match_end', { submissions: room.submissions });
    }

    callback({ success: true });
    console.log(`📨 Submission from ${socket.username} in ${roomId}`);
  });

  // ✅ Chat
  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', {
      username: socket.username,
      message,
    });
  });

  socket.on('leave_room' , ({roomId}) => {
    console.log("room ended " , roomId);
    const room = rooms[roomId];
    if (room && room.players.includes(socket.userId)) {
      // Clean up timer if running
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      // Notify all players and end room
      io.to(roomId).emit('room_ended', { 
        reason: 'Player left the room',
        disconnectedPlayer: socket.username 
      });
      // Clean up room
      delete rooms[roomId];
    }
  })

  socket.on("disconnect", () => {
    console.log("🔥 User disconnected:", socket.id);
    
    // End any room this user was in
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      if (room && room.players.includes(socket.userId)) {
        console.log(`🏁 Room ${roomId} ended due to player disconnect`);
        
        // Clean up timer
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
        }
        
        // Notify remaining players and end room
        io.to(roomId).emit('room_ended', { 
          reason: 'Player disconnected',
          disconnectedPlayer: socket.username 
        });
        
        // Clean up room
        delete rooms[roomId];
      }
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Socket.IO Server running on port ${PORT}`));
