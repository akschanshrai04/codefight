"use client"

import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [status, setStatus] = useState('Connecting...');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [username , setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const waitForAuth = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log(user);
          setUsername(user.email);
          await connectSocket();
          setStatus('Ready');
        } else {
          setStatus('🔐 Please log in first');
          router.push('/login');
        }
      });
    };
    
    waitForAuth();
  }, []);

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    const socket = getSocket();
    if (!socket || !joinRoomId.trim()) {
      setJoinStatus('❌ Please enter a room ID');
      return;
    }

    setJoinStatus('Joining...');
    socket.emit('join_room', { roomId: joinRoomId.trim() }, (res) => {
      if (res.success) {
        setJoinStatus('✅ Joined room successfully!');
        router.push(`/room/${res.roomId}`);
      } else {
        setJoinStatus('❌ ' + res.message);
      }
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: 'auto', textAlign: 'center' }}>
      <h1>CodeFight</h1>
      <p>1v1 Competitive Coding</p>
      <p>Status: {status}</p>
      <p>username : {username}</p>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 40 }}>
        <div style={{ 
          border: '2px solid #2196f3', 
          borderRadius: 10, 
          padding: 30, 
          width: 200,
          cursor: 'pointer',
          transition: 'all 0.3s'
        }} 
        onClick={handleCreateRoom}
        onMouseOver={(e) => e.target.style.backgroundColor = '#e3f2fd'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <h3>🏗️ Create Room</h3>
          <p>Start a new coding challenge</p>
        </div>

        <div style={{ 
          border: '2px solid #4caf50', 
          borderRadius: 10, 
          padding: 30, 
          width: 200,
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#e8f5e8'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <h3>🚪 Join Room</h3>
          <p>Enter an existing room</p>
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            style={{ 
              width: '100%', 
              padding: 8, 
              marginTop: 10, 
              borderRadius: 5,
              border: '1px solid #ccc'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            onClick={handleJoinRoom}
            style={{ 
              width: '100%', 
              padding: 10, 
              marginTop: 10, 
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Join
          </button>
          {joinStatus && (
            <p style={{ 
              marginTop: 10, 
              color: joinStatus.includes('✅') ? 'green' : 'red',
              fontSize: '14px'
            }}>
              {joinStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
