"use client"

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, getSocket } from '@/lib/socket';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [status, setStatus] = useState('Connecting...');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [username, setUsername] = useState('');
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const statusVariants = {
    connecting: { color: '#FFE66D', scale: 1 },
    ready: { color: '#4ECDC4', scale: 1.05 },
    error: { color: '#FF6B6B', scale: 1 }
  };

  const getStatusVariant = () => {
    if (status === 'Ready') return 'ready';
    if (status.includes('🔐')) return 'error';
    return 'connecting';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7FFF7 0%, #E8F8F5 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ maxWidth: 800, margin: 'auto', textAlign: 'center' }}>
        
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          style={{ marginBottom: 60 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              fontSize: '4rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 16px 0',
              letterSpacing: '-2px'
            }}
          >
            CodeFight
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: '1.5rem',
              color: '#1A1A1A',
              margin: '0 0 32px 0',
              fontWeight: '500',
              opacity: 0.8
            }}
          >
            1v1 Competitive Coding
          </motion.p>

          {/* Status and Logout Section */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              justifyContent: 'center',
              marginBottom: 20,
              flexWrap: 'wrap'
            }}
          >
            {/* Status Card */}
            <motion.div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '20px 32px',
                boxShadow: '0 10px 30px rgba(26, 26, 46, 0.1)',
                display: 'inline-block'
              }}
            >
              <motion.p
                variants={statusVariants}
                animate={getStatusVariant()}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Status: {status}
              </motion.p>
              
              {username && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    margin: '8px 0 0 0',
                    fontWeight: '500'
                  }}
                >
                  Welcome, {username}
                </motion.p>
              )}
            </motion.div>

            {/* Logout Button */}
            {username && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 16,
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🚪</span>
                Logout
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            maxWidth: 800,
            margin: 'auto'
          }}
        >
          {/* Create Room Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 40,
              cursor: 'pointer',
              boxShadow: '0 15px 35px rgba(78, 205, 196, 0.15)',
              border: '2px solid rgba(78, 205, 196, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #4ECDC4 0%, #44B3AA 100%)'
              }}
            />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
              style={{
                fontSize: '3rem',
                marginBottom: 20
              }}
            >
              🏗️
            </motion.div>
            
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1A1A1A',
              margin: '0 0 12px 0'
            }}>
              Create Room
            </h3>
            
            <p style={{
              color: '#666',
              fontSize: '1rem',
              margin: 0,
              lineHeight: 1.5
            }}>
              Start a new coding challenge and invite others to compete
            </p>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 40,
              boxShadow: '0 15px 35px rgba(255, 107, 107, 0.15)',
              border: '2px solid rgba(255, 107, 107, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #FF6B6B 0%, #EE5A5A 100%)'
              }}
            />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, duration: 0.5, type: "spring" }}
              style={{
                fontSize: '3rem',
                marginBottom: 20
              }}
            >
              🚪
            </motion.div>
            
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1A1A1A',
              margin: '0 0 12px 0'
            }}>
              Join Room
            </h3>
            
            <p style={{
              color: '#666',
              fontSize: '1rem',
              margin: '0 0 24px 0',
              lineHeight: 1.5
            }}>
              Enter an existing room to join the battle
            </p>

            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Enter Room ID"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '2px solid #F0F0F0',
                fontSize: '16px',
                fontFamily: 'inherit',
                color: '#1A1A1A',
                background: '#F7FFF7',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 16
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6B6B'}
              onBlur={(e) => e.target.style.borderColor = '#F0F0F0'}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinRoom}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 8px 20px rgba(255, 107, 107, 0.3)'
              }}
            >
              Join Room
            </motion.button>

            <AnimatePresence>
              {joinStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: joinStatus.includes('✅') 
                      ? 'rgba(78, 205, 196, 0.1)' 
                      : 'rgba(255, 107, 107, 0.1)',
                    border: `1px solid ${joinStatus.includes('✅') ? '#4ECDC4' : '#FF6B6B'}`,
                    color: joinStatus.includes('✅') ? '#2E8B7A' : '#D63447',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {joinStatus}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          style={{
            marginTop: 60,
            padding: '24px 0',
            borderTop: '1px solid rgba(26, 26, 26, 0.1)'
          }}
        >
          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            margin: 0,
            opacity: 0.7
          }}>
            Ready to code? Choose your battle mode above! 🚀
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
