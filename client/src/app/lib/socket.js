import { io } from 'socket.io-client';
import { auth } from '@/lib/firebase';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
let socket = null;

// 🔌 Connect and authenticate socket
export const connectSocket = async () => {
  if (socket) return socket; // Reuse existing

  const user = auth.currentUser;
  if (!user) {
    console.warn('User not authenticated');
    return null;
  }

  const token = await user.getIdToken();

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
  });

  socket.connect();

  socket.on('connect', () => {
    console.log('🟢 Socket connected:', socket.id);
    socket.emit('authenticate', { token });
  });

  socket.on('authenticated', ({ success }) => {
    if (!success) {
      console.error('❌ Socket auth failed');
      socket.disconnect();
    } else {
      console.log('✅ Socket authenticated');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected');
  });

  socket.on('reconnect', () => {
    console.log('🔄 Socket reconnected');
    // Emit custom event to notify components
    window.dispatchEvent(new CustomEvent('socketReconnected'));
  });

  // Game event listeners
  socket.on('start_game', ({ questionId }) => {
    console.log('🎮 Game started with question:', questionId);
    // You can emit a custom event to notify components
    window.dispatchEvent(new CustomEvent('gameStarted', { detail: { questionId } }));
  });

  socket.on('tick', ({ timeLeft }) => {
    console.log('⏰ Time left:', timeLeft);
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('timeUpdate', { detail: { timeLeft } }));
  });

  socket.on('match_end', ({ submissions }) => {
    console.log('🏁 Match ended:', submissions);
    window.dispatchEvent(new CustomEvent('matchEnded', { detail: { submissions } }));
  });

  socket.on('winner', ({ winner }) => {
    console.log('🏆 Winner:', winner);
    window.dispatchEvent(new CustomEvent('winnerDeclared', { detail: { winner } }));
  });

  socket.on('player_joined', ({ playerId, username, totalPlayers }) => {
    console.log('👤 Player joined:', username, 'ID:', playerId, 'Total players:', totalPlayers);
    window.dispatchEvent(new CustomEvent('playerJoined', { 
      detail: { playerId, username, totalPlayers } 
    }));
  });

  socket.on('room_ended', ({ reason, disconnectedPlayer }) => {
    console.log('🏁 Room ended:', reason, 'Disconnected player:', disconnectedPlayer);
    window.dispatchEvent(new CustomEvent('roomEnded', { 
      detail: { reason, disconnectedPlayer } 
    }));
  });

  socket.on('receive_message', ({ username, id, message }) => {
    console.log('💬 Message received:', username, id, message);
    window.dispatchEvent(new CustomEvent('receiveMessage', { 
      detail: { username, id, message } 
    }));
  });

  socket.on('show_players' , ({players}) => {
    console.log("players are socket ids : " , players);
    window.dispatchEvent(new CustomEvent('showPlayers' , {
      detail: {players}
    }))
  }) 

  socket.on('room_ready' , ({owner}) => {
    console.log("owner id is : " , owner);
    window.dispatchEvent(new CustomEvent('roomReady' , {
      detail: {owner}
    }));
  });

  return socket;
};

// 📦 Getter to reuse socket instance
export const getSocket = () => socket;
