"use client"

import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';

export default function RoomPage() {
  const { roomId } = useParams();
  const [status, setStatus] = useState('Connecting...');
  const [timeLeft, setTimeLeft] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [questionId, setQuestionId] = useState('');
  const [roomEnded, setRoomEnded] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [diffList , setDiffList] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const waitForAuth = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          await connectSocket();
          setStatus('Connected');
          const socket = getSocket();
          socket.emit('show_players' , {roomId} , (res) => {
            console.log(res.players);
            if(res){
              setDiffList(res.players);
            }
          })
        } else {
          setStatus('🔐 Please log in first');
          router.push('/login');
        }
      });
    };
    
    waitForAuth();
  }, []);

  useEffect(() => {
    // Listen for time updates
    const handleTimeUpdate = (event) => {
      setTimeLeft(event.detail.timeLeft);
    };

    // Listen for game start
    const handleGameStart = (event) => {
      setGameStarted(true);
      setQuestionId(event.detail.questionId);
      setStatus('🎮 Game in progress!');
    };

    // Listen for match end
    const handleMatchEnd = (event) => {
      console.log("match end kar rha hu :)")
      setGameStarted(false);
      setTimeLeft(null);
      setStatus('🏁 Game ended');
    };

    // Listen for winner
    const handleWinner = (event) => {
      setStatus(`🏆 ${event.detail.winner} won!`);
    };


    // Listen for player joins
    const handlePlayerJoined = async (event) => {
      const { playerId, username, totalPlayers } = event.detail;
      setPlayers(prev => {
        // Check if player already exists
        if (prev.find(p => p.id === playerId)) return prev;
        return [...prev, { id: playerId, username }];
      });
      setNotifications(prev => [...prev, `${username} (${playerId}) joined the room`]);
      const socket = await getSocket();
      socket.emit('show_players' , {roomId} , (res) => {
        console.log("updated players list " , res);
        if(res) setDiffList(res.players);
      })

      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== `${username} (${playerId}) joined the room`));
      }, 5000);
    };

    // Listen for room ended
    const handleRoomEnded = (event) => {
      const { reason, disconnectedPlayer } = event.detail;
      setRoomEnded(true);
      setEndReason(`${disconnectedPlayer} disconnected`);
      setStatus('🏁 Room ended');
      setGameStarted(false);
      setTimeLeft(null);
    };

    // Listen for incoming messages
    const handleReceiveMessage = (event) => {
      const { username, message } = event.detail;
      setMessages(prev => [...prev, { username, message, timestamp: new Date() }]);
    };

    // Handle browser/tab close or back navigation
    const handleBeforeUnload = () => {
      const socket = getSocket();
      if (socket) {
        socket.emit('leave_room', { roomId });
      }
    };

    // Listen for roomReady event from server (custom event)
    const handleRoomReady = (event) => {
      const { owner } = event.detail;
      setRoomReady(true);
      setIsOwner(owner === userId);
    };

    window.addEventListener('timeUpdate', handleTimeUpdate);
    window.addEventListener('gameStarted', handleGameStart);
    window.addEventListener('matchEnded', handleMatchEnd);
    window.addEventListener('winnerDeclared', handleWinner);
    window.addEventListener('playerJoined', handlePlayerJoined);
    window.addEventListener('roomEnded', handleRoomEnded);
    window.addEventListener('receiveMessage', handleReceiveMessage);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('roomReady', handleRoomReady);


    return () => {
      window.removeEventListener('timeUpdate', handleTimeUpdate);
      window.removeEventListener('gameStarted', handleGameStart);
      window.removeEventListener('matchEnded', handleMatchEnd);
      window.removeEventListener('winnerDeclared', handleWinner);
      window.removeEventListener('playerJoined', handlePlayerJoined);
      window.removeEventListener('roomEnded', handleRoomEnded);
      window.removeEventListener('receiveMessage', handleReceiveMessage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('roomReady', handleRoomReady);

    };
  }, [roomId, userId]);

  const handleSubmitCode = async () => {
    const socket = await getSocket();
    const output = "const tere maa";
    const passed = true;
    socket.emit('submit_code' , {roomId , output , passed } , (res) => {
      console.log("submitted succesfully : " , res.success);
    })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leave_room', { roomId });
    }
    router.push('/');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { roomId, message: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (roomEnded) {
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: 'auto', textAlign: 'center' }}>
        <h1>Room Ended</h1>
        <p style={{ color: '#f44336', fontSize: '18px' }}>
          {endReason}
        </p>
        <p>The room has been closed because a player disconnected.</p>
        <button 
          onClick={handleBack}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: 'auto' }}>
      <button 
        onClick={handleBack}
        style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '16px', 
          cursor: 'pointer',
          color: '#2196f3',
          marginBottom: 20
        }}
      >
        ← Back to Home
      </button>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1>Room: {roomId}</h1>
        <p>Status: {status}</p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20,
          border: '1px solid #2196f3'
        }}>
          <h4>Recent Activity:</h4>
          {notifications.map((notification, index) => (
            <p key={index} style={{ margin: '5px 0', color: '#1976d2' }}>
              {notification}
            </p>
          ))}
        </div>
      )}

      <div>all player list : </div>
      {diffList.map((player , index) => (
        <p key = {index}>
          {player};
        </p>
      ))}


      {/* Timer */}
      {timeLeft !== null && (
        <div style={{ 
          background: '#fff3e0', 
          padding: 20, 
          borderRadius: 10, 
          marginBottom: 20,
          textAlign: 'center',
          border: '2px solid #ff9800'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#e65100' }}>
            ⏰ Time Left: {formatTime(timeLeft)}
          </h2>
          {questionId && (
            <p style={{ margin: 0, color: '#666' }}>
              Question: {questionId}
            </p>
          )}
        </div>
      )}

      {/* Players */}
      {players.length > 0 && (
        <div style={{ 
          background: '#f3e5f5', 
          padding: 20, 
          borderRadius: 10, 
          marginBottom: 20,
          border: '1px solid #9c27b0'
        }}>
          <h3>Players in Room ({players.length}/2):</h3>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {players.map((player, index) => (
              <div key={index} style={{ 
                background: 'white', 
                padding: 15, 
                borderRadius: 8,
                border: '1px solid #ddd',
                minWidth: 150,
                textAlign: 'center'
              }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#7b1fa2' }}>
                  👤 {player.username}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  ID: {player.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Status */}
      {!gameStarted && players.length < 2 && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: 20, 
          borderRadius: 10, 
          textAlign: 'center',
          border: '1px solid #4caf50'
        }}>
          <h3>Waiting for players...</h3>
          <p>Share the room ID with your opponent to start the game.</p>
          <div style={{ 
            background: 'white', 
            padding: 15, 
            borderRadius: 8, 
            margin: '20px 0',
            border: '1px solid #ccc'
          }}>
            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Room ID:</p>
            <code style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#2196f3',
              letterSpacing: '1px'
            }}>
              {roomId}
            </code>
          </div>
        </div>
      )}

      {roomReady && isOwner && !gameStarted && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={() => {
              const socket = getSocket();
              socket.emit('start_game', { roomId });
            }}
            style={{
              padding: '16px 32px',
              backgroundColor: '#43a047',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: 10
            }}
          >
            Start Game
          </button>
          <p style={{ color: '#43a047', marginTop: 8 }}>
            Both players are ready! Click to start the game.
          </p>
        </div>
      )}
      {roomReady && !isOwner && !gameStarted && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ color: '#ff9800', fontWeight: 'bold' }}>
            Waiting for the room owner to start the game...
          </p>
        </div>
      )}

      {gameStarted && (
        <div style={{ 
          background: '#e1f5fe', 
          padding: 20, 
          borderRadius: 10, 
          textAlign: 'center',
          border: '1px solid #03a9f4'
        }}>
          <h3>🎮 Game is Active!</h3>
          <p>Both players are in the room and the timer is running.</p>
          <p>Work on your solution and submit when ready!</p>
          <button
            onClick={handleSubmitCode}
            style={{
              padding: '12px 32px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: 16
            }}
          >
            Submit
          </button>
        </div>
      )}

      {/* Chat Section */}
      <div style={{ 
        background: '#fafafa', 
        padding: 20, 
        borderRadius: 10, 
        marginTop: 20,
        border: '1px solid #ddd'
      }}>
        <h3>💬 Chat</h3>
        
        {/* Messages Display */}
        <div style={{ 
          height: 200, 
          overflowY: 'auto', 
          border: '1px solid #ccc',
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
          background: 'white'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: 80 }}>
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: 8,
                padding: 8,
                background: msg.username === 'You' ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 8,
                borderLeft: `3px solid ${msg.username === 'You' ? '#2196f3' : '#9e9e9e'}`
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '12px',
                  color: msg.username === 'You' ? '#1976d2' : '#666',
                  marginBottom: 4
                }}>
                  {msg.username}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {msg.message}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#999',
                  marginTop: 4
                }}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{ 
              flex: 1,
              padding: 10,
              borderRadius: 5,
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{ 
              padding: '10px 20px',
              backgroundColor: newMessage.trim() ? '#2196f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 