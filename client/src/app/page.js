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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const waitForAuth = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log(user);
          setUsername(user.email);
          await connectSocket();
          setStatus('Ready');
          setIsLoading(false);
        } else {
          setStatus('🔐 Please log in first');
          router.push('/home');
          setIsLoading(false);
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.1, ease: "easeOut" }
    },
    hover: {
      y: -4,
      transition: { duration: 0.1, ease: "easeOut" }
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

  // Loading spinner component
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-slate-400 text-lg font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#18181b] p-6 overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold text-slate-100 mb-4 tracking-tight"
          >
            Code<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Fight</span>
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 font-medium"
          >
            1v1 Competitive Coding Platform
          </motion.p>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between mb-12 bg-[#23272f]/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30"
        >
          <div className="flex items-center gap-4">
            <motion.div
              variants={statusVariants}
              animate={getStatusVariant()}
              className="flex items-center gap-3"
            >
              <div className={`w-3 h-3 rounded-full ${
                status === 'Ready' ? 'bg-[#4ECDC4]' : 
                status.includes('🔐') ? 'bg-[#FF6B6B]' : 'bg-[#FFE66D]'
              }`} />
              <span className="text-lg font-semibold text-slate-100">
                {status}
              </span>
            </motion.div>
            
            {username && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-slate-400 text-sm bg-slate-800/50 px-3 py-1 rounded-full"
              >
                {username}
              </motion.div>
            )}
          </div>

          {username && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-100 flex items-center gap-2 text-sm"
            >
              <span>🚪</span>
              Logout
            </motion.button>
          )}
        </motion.div>

        {/* Action Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Create Room Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            className="group bg-[#23272f]/80 backdrop-blur-sm rounded-3xl p-8 cursor-pointer shadow-2xl border border-slate-700/40 hover:border-cyan-400/50 transition-all duration-300 relative overflow-hidden"
          >
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                className="text-4xl p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-400/30"
              >
                🏗️
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-1">
                  Create Room
                </h3>
                <p className="text-slate-400 text-sm">
                  Host a new challenge
                </p>
              </div>
            </div>
            
            <p className="text-slate-400 leading-relaxed mb-4">
              Start a new coding challenge and invite others to compete in real-time battles
            </p>

            <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
              <span>Get started</span>
              <span className="ml-2">→</span>
            </div>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-[#23272f]/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-700/40 hover:border-rose-400/50 transition-all duration-300 relative overflow-hidden"
          >
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.5, type: "spring" }}
                className="text-4xl p-3 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-2xl border border-rose-400/30"
              >
                🚪
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-1">
                  Join Room
                </h3>
                <p className="text-slate-400 text-sm">
                  Enter existing battle
                </p>
              </div>
            </div>
            
            <p className="text-slate-400 leading-relaxed mb-6">
              Enter an existing room ID to join the coding battle
            </p>

            <div className="space-y-4">
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full p-4 rounded-2xl border border-slate-700/60 text-slate-100 bg-[#18181b]/80 placeholder-slate-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all duration-200 font-medium"
              />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                className="w-full p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Join Battle</span>
                <span>⚔️</span>
              </motion.button>
            </div>

            <AnimatePresence>
              {joinStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-4 p-4 rounded-2xl text-sm font-medium border ${
                    joinStatus.includes('✅') 
                      ? 'bg-emerald-950/20 border-emerald-400/60 text-emerald-400' 
                      : 'bg-rose-950/20 border-rose-400/60 text-rose-400'
                  }`}
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
          className="mt-16 pt-8 border-t border-slate-700/30 text-center"
        >
          <p className="text-slate-500 text-sm font-medium">
            Ready to code? Choose your battle mode above! 🚀
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
