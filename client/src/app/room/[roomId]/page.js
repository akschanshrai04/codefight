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
  const [leftTab, setLeftTab] = useState('statement');
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
            if (res && res.players && res.players.length > 0) {
              setDiffList(res.players);
            } else {
              setRoomEnded(true);
              setEndReason('Room no longer exists or you were disconnected');
              setStatus('🏁 Room ended');
            }
          });
        } else {
          setStatus('🔐 Please log in first');
          router.push('/login');
        }
      });
    };

    waitForAuth();
  }, []);

  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
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
      const { username, message, id } = event.detail;
      const socket = getSocket();
      setMessages(prev => [...prev, { 
        username, 
        message, 
        timestamp: new Date(),
        socketId: id 
      }]);
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

      const response = await fetch(process.env.NEXT_PUBLIC_PISTON_API_URL , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setOutput(`Network Error:\nUnable to connect to code execution server.\nPlease check if the server is running on localhost:2000`);
      } else {
        setOutput(`Execution Error:\n${error.message}`);
      }
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
      const messageText = newMessage.trim();
      socket.emit('send_message', { roomId, message: messageText });
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
        className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6 flex items-center justify-center"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-slate-800/90 backdrop-blur-xl p-12 rounded-3xl text-center shadow-2xl max-w-md w-full border border-slate-700/50"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-6xl mb-6"
          >
            🏁
          </motion.div>
          <h1 className="text-slate-100 text-3xl mb-4 font-bold">
            Room Ended
          </h1>
          <p className="text-rose-400 text-xl mb-4 font-semibold">
            {endReason}
          </p>
          <p className="text-slate-300 mb-8 leading-relaxed">
            The room has been closed because a player disconnected.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none rounded-xl px-8 py-4 text-lg font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
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
      className="min-h-screen bg-[#18181b] p-4 overflow-x-hidden"
    >
      <div className="w-full mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative flex items-center justify-between w-full gap-4 min-h-[56px]">
            {/* Left: Back to Home */}
            <motion.button
              whileHover={{ x: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-lg cursor-pointer text-blue-400 font-semibold flex items-center gap-3 px-4 py-3 rounded-xl hover:text-cyan-400 hover:bg-slate-700/50 transition-all duration-300"
            >
              ← Back to Home
            </motion.button>
            {/* Center: Status */}
            {gameStarted && status && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-[#23272f] border border-slate-700/60 text-lg font-bold text-cyan-400 flex items-center gap-2 shadow z-10">
                {status}
              </div>
            )}
            {/* Right: Timer */}
            {typeof timeLeft === 'number' && gameStarted ? (
              <div className="px-4 py-2 rounded-xl bg-[#23272f] border border-slate-700/60 text-lg font-bold text-cyan-400 flex items-center gap-2 shadow ml-auto">
                ⏰ {formatTime(timeLeft)}
              </div>
            ) : <div className="w-[120px]" />} {/* Spacer to keep layout consistent */}
          </div>
          {!gameStarted && (
            <div className="bg-[#23272f] rounded-2xl p-8 text-center shadow-xl border border-slate-700/60 mt-6">
              <h1 className="text-slate-100 text-4xl mb-3 font-bold">
                 Room: {roomId}
              </h1>
              <p className="text-cyan-400 text-xl font-semibold">
                 {status}
              </p>
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              variants={itemVariants}
              className="bg-[#23272f] p-6 rounded-2xl mb-8 shadow-lg border border-slate-700/60"
            >
              <h4 className="text-slate-100 mb-3 font-bold text-lg flex items-center gap-2">
                🎉 Recent Activity
              </h4>
              {notifications.map((notification, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="my-2 text-slate-300 font-semibold text-sm"
                >
                  {notification}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className={`grid gap-2 items-start ${gameStarted ? 'lg:grid-cols-[minmax(0,40%)_minmax(0,60%)]' : 'grid-cols-1'} ${gameStarted ? 'min-h-[800px]' : ''} w-full max-w-full`}>
          {/* Left Column - Problem Statement and Chat */}
          {gameStarted ? (
            <div className="flex flex-col h-full min-h-0 w-full max-w-full">
              <motion.div
                variants={itemVariants}
                className="bg-[#23272f] p-0 rounded-2xl shadow-xl border border-slate-700/60 h-full flex-1 min-h-0 flex flex-col"
              >
                {/* Tabs */}
                <div className="flex gap-2 p-4 border-b border-slate-700/60">
                  <button
                    onClick={() => setLeftTab('statement')}
                    className={`px-6 py-2 rounded-xl font-bold cursor-pointer transition-all duration-300 ${
                      leftTab === 'statement' 
                        ? 'border-2 border-cyan-400 bg-[#23272f] text-cyan-400 shadow-lg' 
                        : 'border border-slate-700/60 bg-[#18181b] text-slate-400 hover:text-slate-200 hover:bg-[#23272f]'
                    }`}
                  >
                    📝 Problem
                  </button>
                  <button
                    onClick={() => setLeftTab('chat')}
                    className={`px-6 py-2 rounded-xl font-bold cursor-pointer transition-all duration-300 ${
                      leftTab === 'chat' 
                        ? 'border-2 border-cyan-400 bg-[#23272f] text-cyan-400 shadow-lg' 
                        : 'border border-slate-700/60 bg-[#18181b] text-slate-400 hover:text-slate-200 hover:bg-[#23272f]'
                    }`}
                  >
                    💬 Chat
                  </button>
                </div>
                {/* Tab Content */}
                <div className="flex-1 min-h-0 p-6">
                  {leftTab === 'statement' ? (
                    <div>
                      {/* <h3 className="text-slate-100 mb-6 text-2xl font-bold flex items-center gap-2">
                        📝 Problem Statement
                      </h3> */}
                      <div className="text-slate-300 leading-relaxed text-base space-y-4">
                        <p>
                          <strong className="text-cyan-400">Problem:</strong> Print &#34;akschansh&#34; to the console.
                        </p>
                        <p>
                          <strong className="text-cyan-400">Input:</strong> No input required.
                        </p>
                        <p>
                          <strong className="text-cyan-400">Output:</strong> Print exactly &#34;akschansh&#34; (without quotes) to stdout.
                        </p>
                        <p>
                          <strong className="text-cyan-400">Example:</strong>
                        </p>
                        <div className="bg-[#18181b] p-4 rounded-xl font-mono border border-slate-700/60 text-sm space-y-2">
                          <div className="text-slate-300"><strong className="text-cyan-400">Input:</strong> (none)</div>
                          <div className="text-emerald-400"><strong className="text-cyan-400">Output:</strong> akschansh</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-0">
                      {/* Messages Display */}
                      <div 
                        className="messages-container overflow-y-auto flex-1 space-y-4 bg-transparent"
                      >
                        <AnimatePresence>
                          {messages.length === 0 ? (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-slate-400 text-center mt-20 text-sm"
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
                                className={`flex ${msg.socketId === getSocket()?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className="max-w-[75%] p-4 bg-[#18181b] rounded-2xl border border-slate-700/60 text-slate-100">
                                  <div className="font-bold text-xs text-blue-400 mb-2">
                                    {msg.username}
                                  </div>
                                  <div className="text-sm leading-relaxed">
                                    {msg.message}
                                  </div>
                                  <div className={`text-xs opacity-70 mt-2 ${msg.socketId === getSocket()?.id ? 'text-right' : 'text-left'}`}> 
                                    {msg.timestamp.toLocaleTimeString()}
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Message Input */}
                      <div className="pt-6 flex gap-3 bg-transparent">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="flex-1 p-3 rounded-xl border border-slate-700/60 text-sm bg-[#18181b] text-slate-100 placeholder-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            newMessage.trim() 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white cursor-pointer shadow-lg hover:shadow-xl' 
                              : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Send
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Players */}
              {diffList.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="bg-[#23272f] p-8 rounded-2xl shadow-xl border border-slate-700/60"
                >
                  <h3 className="text-slate-100 mb-6 text-2xl font-bold flex items-center gap-2">
                    👥 Players ({diffList.length}/2)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {diffList.map((player, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 p-5 rounded-xl text-center text-white font-bold shadow-lg text-base"
                      >
                        👤 {player}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Waiting for Players */}
              {!gameStarted && isOwner && diffList.length < 2 && (
                <motion.div
                  variants={itemVariants}
                  className="bg-[#23272f] p-10 rounded-2xl text-center shadow-xl border border-slate-700/60"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-6xl mb-6 inline-block text-cyan-400"
                  >
                    ⏳
                  </motion.div>
                  <h3 className="text-slate-100 mb-4 text-3xl font-bold">
                    Waiting for players...
                  </h3>
                  <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                    Share the room ID with your opponent to start the game.
                  </p>
                  <div className="bg-[#18181b] p-8 rounded-2xl shadow-xl border border-slate-700/60">
                    <p className="mb-3 font-bold text-slate-100 text-base">
                      Room ID:
                    </p>
                    <code className="text-3xl font-bold text-cyan-400 tracking-wider">
                      {roomId}
                    </code>
                  </div>
                </motion.div>
              )}

              {/* Waiting for Owner to Start Game (for non-owners) */}
              {!gameStarted && !isOwner && (
                <motion.div
                  variants={itemVariants}
                  className="bg-[#23272f] p-8 rounded-2xl text-center shadow-xl border border-slate-700/60"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-5xl mb-4 text-cyan-400"
                  >
                    ⏰
                  </motion.div>
                  <p className="text-cyan-400 font-bold text-xl">
                    Waiting for the room owner to start the game...
                  </p>
                </motion.div>
              )}

              {/* Start Game Button */}
              {roomReady && isOwner && !gameStarted && (
                <motion.div
                  variants={itemVariants}
                  className="text-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const socket = getSocket();
                      socket.emit('start_game', { roomId });
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none rounded-2xl px-12 py-5 text-xl cursor-pointer font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    🚀 Start Game
                  </motion.button>
                  <p className="text-cyan-400 mt-4 font-semibold text-base">
                    Both players are ready! Click to start the game.
                  </p>
                </motion.div>
              )}

              {/* Leave Room Button - When Game Ended */}
              {gameStarted && timeLeft === null && (
                <motion.div
                  variants={itemVariants}
                  className="text-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(244, 143, 177, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBack}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-none rounded-2xl px-12 py-5 text-xl cursor-pointer font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    🚪 Leave Room
                  </motion.button>
                  <p className="text-rose-400 mt-4 font-semibold text-base">
                    Game has ended. Click to leave the room.
                  </p>
                </motion.div>
              )}

              {roomReady && !isOwner && !gameStarted && (
                <motion.div
                  variants={itemVariants}
                  className="bg-[#23272f] p-8 rounded-2xl text-center shadow-xl border border-slate-700/60"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-5xl mb-4 text-cyan-400"
                  >
                    ⏰
                  </motion.div>
                  <p className="text-cyan-400 font-bold text-xl">
                    Waiting for the room owner to start the game...
                  </p>
                </motion.div>
              )}

              {/* Game Active */}
              {gameStarted && (
                <motion.div
                  variants={itemVariants}
                  className="bg-[#23272f] p-8 rounded-2xl text-center shadow-2xl border border-slate-700/60"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="text-5xl mb-4 text-cyan-400"
                  >
                    🎮
                  </motion.div>
                  <h3 className="text-slate-100 mb-3 text-2xl font-bold">
                    Game is Active!
                  </h3>
                  <p className="text-slate-400 my-2 opacity-90 text-base">
                    Both players are in the room and the timer is running.
                  </p>
                  <p className="text-slate-400 opacity-90 text-base">
                    Work on your solution and submit when ready!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Right Column - Code Editor and Output */}
          {gameStarted && (
            <div className="flex flex-col h-full w-full max-w-full space-y-2">
              {/* Code Editor */}
              <motion.div
                variants={itemVariants}
                className="bg-[#23272f] p-6 rounded-2xl shadow-xl flex-1 flex flex-col border border-slate-700/60 mb-2"
              >
                <h3 className="text-slate-100 mb-4 text-xl font-bold flex items-center gap-2">
                  💻 Code Editor
                </h3>
                <div className="rounded-xl overflow-hidden mb-4 flex-1 border border-slate-700/60 shadow-inner">
                  <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 16,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      padding: { top: 12, bottom: 12 },
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                      },
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      fontLigatures: true
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 10px 30px rgba(244, 143, 177, 0.3)" }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmitCode}
                  disabled={isExecuting}
                  className={`border-none rounded-xl px-8 py-4 text-lg cursor-pointer font-bold transition-all duration-300 ${
                    isExecuting 
                      ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isExecuting ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
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
                className={`p-6 rounded-2xl shadow-xl border h-56 flex flex-col ${
                  output.includes('Error') ? 'bg-slate-800/60 border-rose-400/50' : 
                  output.includes('Correct') ? 'bg-slate-800/60 border-green-400/50' : 'bg-slate-800/60 border-slate-700/50'
                }`}
              >
                <h4 className="mb-4 text-slate-100 font-bold text-lg flex items-center gap-2">
                  📊 Output:
                </h4>
                <div className={`font-mono whitespace-pre-wrap flex-1 overflow-y-auto text-sm leading-relaxed p-4 rounded-xl border ${
                  output.includes('Error') ? 'text-rose-400 bg-[#18181b] border-rose-400/60' :
                  output.includes('Correct') ? 'text-emerald-400 bg-[#18181b] border-emerald-400/60' : 'text-slate-300 bg-[#18181b] border-slate-700/60'
                } font-medium`}>
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
