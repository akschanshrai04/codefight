"use client"

import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [diffList, setDiffList] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('#include <bits/stdc++.h>\n\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const pulseVariants = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // All your existing useEffect hooks remain the same...
  useEffect(() => {
    const waitForAuth = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          await connectSocket();
          setStatus('Connected');
          const socket = getSocket();
          socket.emit('show_players', { roomId }, (res) => {
            console.log(res.players);
            if (res) {
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
    // All your existing event listeners remain the same...
    const handleTimeUpdate = (event) => {
      setTimeLeft(event.detail.timeLeft);
    };

    const handleGameStart = (event) => {
      setGameStarted(true);
      setQuestionId(event.detail.questionId);
      setStatus('🎮 Game in progress!');
    };

    const handleMatchEnd = (event) => {
      console.log("match end kar rha hu :)")
      setGameStarted(false);
      setTimeLeft(null);
      setStatus('🏁 Game ended');
    };

    const handleWinner = (event) => {
      setTimeLeft(null);
      setStatus(`🏆 ${event.detail.winner} won!`);
    };

    const handlePlayerJoined = async (event) => {
      const { playerId, username, totalPlayers } = event.detail;
      setPlayers(prev => {
        if (prev.find(p => p.id === playerId)) return prev;
        return [...prev, { id: playerId, username }];
      });
      setNotifications(prev => [...prev, `${username} (${playerId}) joined the room`]);
      const socket = await getSocket();
      socket.emit('show_players', { roomId }, (res) => {
        console.log("updated players list ", res);
        if (res) setDiffList(res.players);
      })

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== `${username} (${playerId}) joined the room`));
      }, 5000);
    };

    const handleRoomEnded = (event) => {
      const { reason, disconnectedPlayer } = event.detail;
      setRoomEnded(true);
      setEndReason(`${disconnectedPlayer} disconnected`);
      setStatus('🏁 Room ended');
      setGameStarted(false);
      setTimeLeft(null);
    };

    const handleReceiveMessage = (event) => {
      const { username, message } = event.detail;
      setMessages(prev => [...prev, { username, message, timestamp: new Date() }]);
    };

    const handleBeforeUnload = () => {
      const socket = getSocket();
      if (socket) {
        socket.emit('leave_room', { roomId });
      }
    };

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

  // All your existing functions remain the same...
  const handleSubmitCode = async () => {
    try {
      setIsExecuting(true);
      setOutput('Executing code...');

      const socket = await getSocket();

      const requestBody = {
        "language": "c++",
        "version": "*",
        "files": [
          {
            "name": "solution.cpp",
            "content": code
          }
        ],
        "stdin": "",
        "compile_timeout": 10000,
        "run_timeout": 3000,
        "compile_memory_limit": -1,
        "run_memory_limit": -1
      };

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Piston API response:', result);

      if (result.compile && result.compile.code === 0) {
        const stdout = result.run?.stdout || '';
        const outputText = stdout.trim();
        const passed = outputText === "akschansh";
        setOutput(`Output: ${outputText}\nStatus: ${passed ? '✅ Correct!' : '❌ Incorrect'}`);
        socket.emit('submit_code', { roomId, output: outputText, passed }, (res) => {
          console.log("submitted successfully: ", res.success);
        });
      } else {
        const errorOutput = result.compile?.stderr || 'Compilation failed';
        setOutput(`Compilation Error:\n${errorOutput}`);
        socket.emit('submit_code', { roomId, output: errorOutput, passed: false }, (res) => {
          console.log("submitted with error: ", res.success);
        });
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput(`Execution Error:\n${error.message}`);
      const socket = await getSocket();
      socket.emit('submit_code', { roomId, output: 'Execution error', passed: false }, (res) => {
        console.log("submitted with execution error: ", res.success);
      });
    } finally {
      setIsExecuting(false);
    }
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F7FFF7 0%, #4ECDC4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            background: '#FFFFFF',
            padding: '3rem',
            borderRadius: '24px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(26, 26, 46, 0.1)',
            maxWidth: '500px',
            width: '100%'
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
          >
            🏁
          </motion.div>
          <h1 style={{ 
            color: '#1A1A1A', 
            fontSize: '2rem', 
            marginBottom: '1rem',
            fontWeight: '700'
          }}>
            Room Ended
          </h1>
          <p style={{ 
            color: '#FF6B6B', 
            fontSize: '1.2rem',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            {endReason}
          </p>
          <p style={{ 
            color: '#1A1A1A', 
            marginBottom: '2rem',
            opacity: 0.8
          }}>
            The room has been closed because a player disconnected.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(78, 205, 196, 0.3)'
            }}
          >
            Back to Home
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7FFF7 0%, #E8F8F7 100%)',
        padding: '2rem'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              cursor: 'pointer',
              color: '#4ECDC4',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            ← Back to Home
          </motion.button>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)'
          }}>
            <h1 style={{
              color: '#1A1A1A',
              fontSize: '2.5rem',
              margin: '0 0 0.5rem 0',
              fontWeight: '700'
            }}>
              Room: {roomId}
            </h1>
            <p style={{
              color: '#4ECDC4',
              fontSize: '1.2rem',
              margin: 0,
              fontWeight: '600'
            }}>
              {status}
            </p>
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              variants={itemVariants}
              style={{
                background: 'linear-gradient(135deg, #FFE66D 0%, #FDD835 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 8px 25px rgba(255, 230, 109, 0.3)'
              }}
            >
              <h4 style={{ 
                color: '#1A1A1A', 
                margin: '0 0 1rem 0',
                fontWeight: '700'
              }}>
                🎉 Recent Activity
              </h4>
              {notifications.map((notification, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    margin: '0.5rem 0',
                    color: '#1A1A1A',
                    fontWeight: '500'
                  }}
                >
                  {notification}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        <AnimatePresence>
          {timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              variants={itemVariants}
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)',
                padding: '1rem 2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
                maxWidth: '300px',
                margin: '0 auto 2rem auto'
              }}
            >
              <motion.h2
                animate={pulseVariants}
                style={{
                  margin: '0 0 0.5rem 0',
                  color: '#FFFFFF',
                  fontSize: '1.8rem',
                  fontWeight: '700'
                }}
              >
                ⏰ {formatTime(timeLeft)}
              </motion.h2>
              {questionId && (
                <p style={{
                  margin: 0,
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  opacity: 0.9
                }}>
                  Question: {questionId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: gameStarted ? '1fr 1fr' : '1fr',
          gap: '2rem',
          alignItems: 'start',
          minHeight: gameStarted ? '700px' : 'auto'
        }}>
          {/* Left Column - Problem Statement and Chat */}
          {gameStarted ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Problem Statement */}
              <motion.div
                variants={itemVariants}
                style={{
                  background: '#FFFFFF',
                  padding: '2rem',
                  borderRadius: '20px',
                  marginBottom: '2rem',
                  boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)'
                }}
              >
                <h3 style={{
                  color: '#1A1A1A',
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  📝 Problem Statement
                </h3>
                <div style={{
                  color: '#1A1A1A',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>Problem:</strong> Print &quot;akschansh&quot; to the console.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>Input:</strong> No input required.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>Output:</strong> Print exactly &quot;akschansh&quot; (without quotes) to stdout.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>Example:</strong>
                  </p>
                  <div style={{
                    background: '#F7FFF7',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    border: '1px solid #E6E6E6'
                  }}>
                    <div><strong>Input:</strong> (none)</div>
                    <div><strong>Output:</strong> akschansh</div>
                  </div>
                </div>
              </motion.div>

              {/* Chat */}
              <motion.div
                variants={itemVariants}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  flex: 1,
                  boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)',
                  padding: '1.5rem',
                  color: '#FFFFFF'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontWeight: '700'
                  }}>
                    💬 Chat
                  </h3>
                </div>

                {/* Messages Display */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem'
                }}>
                  <AnimatePresence>
                    {messages.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          color: '#1A1A1A',
                          textAlign: 'center',
                          marginTop: '6rem',
                          opacity: 0.5
                        }}
                      >
                        No messages yet. Start the conversation!
                      </motion.p>
                    ) : (
                      messages.map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: msg.username === 'You' 
                              ? 'linear-gradient(135deg, #FFE66D 0%, #FDD835 100%)'
                              : '#F7FFF7',
                            borderRadius: '12px',
                            borderLeft: `4px solid ${msg.username === 'You' ? '#FFE66D' : '#4ECDC4'}`
                          }}
                        >
                          <div style={{
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            color: '#1A1A1A',
                            marginBottom: '0.5rem'
                          }}>
                            {msg.username}
                          </div>
                          <div style={{
                            fontSize: '1rem',
                            color: '#1A1A1A'
                          }}>
                            {msg.message}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#1A1A1A',
                            opacity: 0.6,
                            marginTop: '0.5rem'
                          }}>
                            {msg.timestamp.toLocaleTimeString()}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #E6E6E6',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '2px solid #E6E6E6',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4ECDC4'}
                    onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      background: newMessage.trim() 
                        ? 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)'
                        : '#E6E6E6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: newMessage.trim() 
                        ? '0 4px 15px rgba(78, 205, 196, 0.3)'
                        : 'none'
                    }}
                  >
                    Send
                  </motion.button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div>
              {/* Players */}
              {diffList.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: '#FFFFFF',
                    padding: '2rem',
                    borderRadius: '20px',
                    marginBottom: '2rem',
                    boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)'
                  }}
                >
                  <h3 style={{
                    color: '#1A1A1A',
                    margin: '0 0 1.5rem 0',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    👥 Players ({diffList.length}/2)
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    {diffList.map((player, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        style={{
                          background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)',
                          padding: '1.5rem',
                          borderRadius: '16px',
                          textAlign: 'center',
                          color: '#FFFFFF',
                          fontWeight: '600',
                          boxShadow: '0 8px 25px rgba(78, 205, 196, 0.3)'
                        }}
                      >
                        👤 {player}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Waiting for Players */}
              {!gameStarted && diffList.length < 2 && (
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: '#FFFFFF',
                    padding: '3rem',
                    borderRadius: '20px',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)'
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: '4rem', marginBottom: '1rem', width: '4.5rem', height: '4.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'transform' }}
                  >
                    ⏳
                  </motion.div>
                  <h3 style={{
                    color: '#1A1A1A',
                    margin: '0 0 1rem 0',
                    fontSize: '1.8rem',
                    fontWeight: '700'
                  }}>
                    Waiting for players...
                  </h3>
                  <p style={{
                    color: '#1A1A1A',
                    marginBottom: '2rem',
                    opacity: 0.7
                  }}>
                    Share the room ID with your opponent to start the game.
                  </p>
                  <div style={{
                    background: 'linear-gradient(135deg, #FFE66D 0%, #FDD835 100%)',
                    padding: '2rem',
                    borderRadius: '16px',
                    margin: '2rem 0',
                    boxShadow: '0 8px 25px rgba(255, 230, 109, 0.3)'
                  }}>
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      fontWeight: '700',
                      color: '#1A1A1A'
                    }}>
                      Room ID:
                    </p>
                    <code style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#1A1A1A',
                      letterSpacing: '2px'
                    }}>
                      {roomId}
                    </code>
                  </div>
                </motion.div>
              )}

                          {/* Start Game Button */}
            {roomReady && isOwner && !gameStarted && (
              <motion.div
                variants={itemVariants}
                style={{ textAlign: 'center', marginBottom: '2rem' }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const socket = getSocket();
                    socket.emit('start_game', { roomId });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '1.5rem 3rem',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 15px 40px rgba(78, 205, 196, 0.4)'
                  }}
                >
                  🚀 Start Game
                </motion.button>
                <p style={{
                  color: '#4ECDC4',
                  marginTop: '1rem',
                  fontWeight: '600'
                }}>
                  Both players are ready! Click to start the game.
                </p>
              </motion.div>
            )}

            {/* Leave Room Button - When Game Ended */}
            {gameStarted && timeLeft === null && (
              <motion.div
                variants={itemVariants}
                style={{ textAlign: 'center', marginBottom: '2rem' }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '1.5rem 3rem',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 15px 40px rgba(255, 107, 107, 0.4)'
                  }}
                >
                  🚪 Leave Room
                </motion.button>
                <p style={{
                  color: '#FF6B6B',
                  marginTop: '1rem',
                  fontWeight: '600'
                }}>
                  Game has ended. Click to leave the room.
                </p>
              </motion.div>
            )}

              {roomReady && !isOwner && !gameStarted && (
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: '#FFFFFF',
                    padding: '2rem',
                    borderRadius: '20px',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)'
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: '3rem', marginBottom: '1rem' }}
                  >
                    ⏰
                  </motion.div>
                  <p style={{
                    color: '#FFE66D',
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    margin: 0
                  }}>
                    Waiting for the room owner to start the game...
                  </p>
                </motion.div>
              )}

              {/* Game Active */}
              {gameStarted && (
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'linear-gradient(135deg, #4ECDC4 0%, #44B3AC 100%)',
                    padding: '2rem',
                    borderRadius: '20px',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 15px 40px rgba(78, 205, 196, 0.3)'
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: '3rem', marginBottom: '1rem' }}
                  >
                    🎮
                  </motion.div>
                  <h3 style={{
                    color: '#FFFFFF',
                    margin: '0 0 1rem 0',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    Game is Active!
                  </h3>
                  <p style={{
                    color: '#FFFFFF',
                    margin: '0.5rem 0',
                    opacity: 0.9
                  }}>
                    Both players are in the room and the timer is running.
                  </p>
                  <p style={{
                    color: '#FFFFFF',
                    margin: 0,
                    opacity: 0.9
                  }}>
                    Work on your solution and submit when ready!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Right Column - Code Editor and Output */}
          {gameStarted && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Code Editor */}
              <motion.div
                variants={itemVariants}
                style={{
                  background: '#FFFFFF',
                  padding: '2rem',
                  borderRadius: '20px',
                  marginBottom: '2rem',
                  boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <h3 style={{
                  color: '#1A1A1A',
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  💻 Code Editor
                </h3>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 25px rgba(26, 26, 46, 0.1)',
                  flex: 1
                }}>
                  <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on'
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitCode}
                  disabled={isExecuting}
                  style={{
                    background: isExecuting 
                      ? 'linear-gradient(135deg, #E6E6E6 0%, #CCCCCC 100%)'
                      : 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    cursor: isExecuting ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    boxShadow: isExecuting 
                      ? 'none' 
                      : '0 8px 25px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  {isExecuting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTop: '2px solid transparent', borderRadius: '50%' }}
                      />
                      Executing...
                    </span>
                  ) : (
                    '🚀 Submit Solution'
                  )}
                </motion.button>
              </motion.div>

              {/* Output Display */}
              <motion.div
                variants={itemVariants}
                style={{
                  background: '#FFFFFF',
                  padding: '2rem',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(26, 26, 46, 0.08)',
                  backgroundColor: output.includes('Error') ? '#FFE6E6' : 
                                 output.includes('Correct') ? '#E8F5E8' : '#F5F5F5',
                  border: `2px solid ${output.includes('Error') ? '#FF6B6B' : 
                                      output.includes('Correct') ? '#4ECDC4' : '#E6E6E6'}`,
                  height: '200px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <h4 style={{
                  margin: '0 0 1rem 0',
                  color: '#1A1A1A',
                  fontWeight: '700'
                }}>
                  Output:
                </h4>
                <div style={{
                  color: output.includes('Error') ? '#FF6B6B' :
                         output.includes('Correct') ? '#4ECDC4' : '#1A1A1A',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  flex: 1,
                  overflowY: 'auto'
                }}>
                  {output || 'No output yet. Run your code to see the results!'}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}