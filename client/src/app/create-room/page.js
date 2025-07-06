"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, getSocket } from '@/lib/socket';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function CreateRoom() {
  const [questionId, setQuestionId] = useState('two_sum');
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const waitForAuth = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await connectSocket();
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          router.push('/home');
        }
      });
    };
    
    waitForAuth();
  }, [router]);

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
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.01,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: { scale: 0.99 }
  };

  const inputVariants = {
    focus: { 
      scale: 1.01,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  // Show loading spinner while checking authentication
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

  // Don't render the component if not authenticated (prevents flash)
  if (!isAuthenticated) {
    return( 
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-[#18181b] flex items-center justify-center p-4"
    >
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <motion.button 
          variants={itemVariants}
          onClick={handleBack}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </motion.button>

        {/* Main Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#23272f] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <motion.h1 
              variants={itemVariants}
              className="text-2xl font-bold text-slate-100 mb-1"
            >
              Create Room
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-slate-400 text-sm"
            >
              Configure your coding challenge session
            </motion.p>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <div className="space-y-5">
              {/* Question ID Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  Question ID
                </label>
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="text"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  placeholder="e.g., two_sum, palindrome"
                  className="w-full px-4 py-3 rounded-lg bg-[#18181b] border border-slate-700/60 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </motion.div>

              {/* Time Limit Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  Time Limit
                </label>
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  min="60"
                  max="3600"
                  className="w-full px-4 py-3 rounded-lg bg-[#18181b] border border-slate-700/60 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200"
                />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-xs text-slate-400 flex items-center gap-1"
                >
                </motion.div>
              </motion.div>

              {/* Create Button */}
              <motion.button 
                variants={buttonVariants}
                initial="idle"
                whileHover={!isCreating ? "hover" : "idle"}
                whileTap={!isCreating ? "tap" : "idle"}
                onClick={handleCreate}
                disabled={isCreating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 mt-6 ${
                  isCreating 
                    ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isCreating ? (
                    <motion.div 
                      key="creating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full"
                      />
                      Creating Room...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Room
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
