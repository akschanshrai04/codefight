"use client"

import { useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export default function CreateRoom() {
  const [questionId, setQuestionId] = useState('two_sum');
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    const socket = getSocket();
    if (!socket) {
      alert('Socket not connected. Please go back and try again.');
      return;
    }

    setIsCreating(true);
    socket.emit('create_room', { questionId, timeLimit }, (res) => {
      setIsCreating(false);
      if (res && res.roomId) {
        setRoomId(res.roomId);
        console.log('🆕 Room created:', res.roomId);
        router.push(`/room/${res.roomId}`);
      } else {
        alert('Failed to create room. Please try again.');
      }
    });
  };
  const handleBack = () => {
    router.push('/');
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: 'auto' }}>
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

      <h1>Create a New Room</h1>
    
      <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 10 }}>
        <h3>Room Settings</h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Question ID:
          </label>
          <input
            type="text"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            placeholder="e.g., two_sum, palindrome"
            style={{ 
              width: '100%', 
              padding: 10, 
              borderRadius: 5,
              border: '1px solid #ccc',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Time Limit (seconds):
          </label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            min="60"
            max="3600"
            style={{ 
              width: '100%', 
              padding: 10, 
              borderRadius: 5,
              border: '1px solid #ccc',
              fontSize: '16px'
            }}
          />
          <small style={{ color: '#666' }}>
            Recommended: 300 seconds (5 minutes)
          </small>
        </div>

        <button 
          onClick={handleCreate}
          disabled={isCreating}
          style={{ 
            width: '100%', 
            padding: 15, 
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            fontSize: '16px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.7 : 1
          }}
        >
          {isCreating ? 'Creating Room...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
} 