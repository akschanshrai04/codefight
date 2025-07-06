"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: { scale: 0.98 }
  };

  const inputVariants = {
    focus: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7FFF7 0%, #E8F8F5 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ 
          maxWidth: 520, 
          margin: 'auto',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(26, 26, 46, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AA 100%)',
            padding: '30px 32px',
            color: '#FFFFFF'
          }}
        >
          <motion.button 
            onClick={handleBack}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              border: 'none', 
              fontSize: '14px', 
              cursor: 'pointer',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 20,
              marginBottom: 20,
              fontWeight: '500',
              backdropFilter: 'blur(10px)'
            }}
          >
            ← Back to Home
          </motion.button>
          
          <motion.h1 
            variants={itemVariants}
            style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}
          >
            Create a New Room
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            style={{ 
              margin: '8px 0 0 0', 
              opacity: 0.9, 
              fontSize: '16px',
              fontWeight: '400'
            }}
          >
            Set up your coding challenge session
          </motion.p>
        </motion.div>

        {/* Content */}
        <motion.div 
          variants={itemVariants}
          style={{ padding: '32px' }}
        >
          <motion.div 
            variants={itemVariants}
            style={{ 
              background: '#F7FFF7', 
              padding: 28, 
              borderRadius: 16,
              border: '1px solid rgba(78, 205, 196, 0.1)'
            }}
          >
            
            <motion.div 
              variants={itemVariants}
              style={{ marginBottom: 24 }}
            >
              <motion.label 
                variants={itemVariants}
                style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: '600',
                  color: '#1A1A1A',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Question ID
              </motion.label>
              <motion.input
                variants={inputVariants}
                whileFocus="focus"
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="e.g., two_sum, palindrome"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 12,
                  border: '2px solid #E8F8F5',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: '#1A1A1A',
                  background: '#FFFFFF',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4ECDC4'}
                onBlur={(e) => e.target.style.borderColor = '#E8F8F5'}
              />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              style={{ marginBottom: 28 }}
            >
              <motion.label 
                variants={itemVariants}
                style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: '600',
                  color: '#1A1A1A',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Time Limit (seconds)
              </motion.label>
              <motion.input
                variants={inputVariants}
                whileFocus="focus"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="60"
                max="3600"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 12,
                  border: '2px solid #E8F8F5',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: '#1A1A1A',
                  background: '#FFFFFF',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4ECDC4'}
                onBlur={(e) => e.target.style.borderColor = '#E8F8F5'}
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                style={{ 
                  marginTop: 8,
                  padding: '8px 12px',
                  background: 'rgba(255, 230, 109, 0.2)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 230, 109, 0.3)'
                }}
              >
                <small style={{ 
                  color: '#B8860B',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  💡 Recommended: 300 seconds (5 minutes)
                </small>
              </motion.div>
            </motion.div>

            <motion.button 
              variants={buttonVariants}
              initial="idle"
              whileHover={!isCreating ? "hover" : "idle"}
              whileTap={!isCreating ? "tap" : "idle"}
              onClick={handleCreate}
              disabled={isCreating}
              style={{ 
                width: '100%', 
                padding: '16px 24px', 
                background: isCreating 
                  ? 'linear-gradient(135deg, #B0B0B0 0%, #999999 100%)'
                  : 'linear-gradient(135deg, #4ECDC4 0%, #44B3AA 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: '16px',
                fontWeight: '600',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: isCreating 
                  ? 'none'
                  : '0 8px 20px rgba(78, 205, 196, 0.3)',
              }}
            >
              <AnimatePresence mode="wait">
                {isCreating ? (
                  <motion.span 
                    key="creating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #FFFFFF',
                        borderRadius: '50%'
                      }}
                    />
                    Creating Room...
                  </motion.span>
                ) : (
                  <motion.span
                    key="create"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Create Room
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
