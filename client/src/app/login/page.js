"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/'); // Redirect to homepage or lobby
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7FFF7] via-[#4ECDC4] to-[#FFE66D] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#4ECDC4] rounded-full opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFE66D] rounded-full opacity-20"></div>

        {/* Header */}
        <motion.div
          key={isSignup ? 'signup' : 'login'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignup 
              ? 'Join us and start your journey' 
              : 'Sign in to continue to your account'
            }
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-[#1A1A1A] ml-1">
              Email
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F7FFF7] border-2 border-gray-200 rounded-xl text-[#1A1A1A] placeholder-gray-500 focus:border-[#4ECDC4] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all duration-200"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-[#1A1A1A] ml-1">
              Password
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F7FFF7] border-2 border-gray-200 rounded-xl text-[#1A1A1A] placeholder-gray-500 focus:border-[#4ECDC4] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all duration-200"
            />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-[#4ECDC4] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#45B7B8] transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {isSignup ? 'Create Account' : 'Sign In'}
            </motion.span>
          </motion.button>
        </form>

        {/* Toggle Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-8 pt-6 border-t border-gray-200 text-center"
        >
          <p className="text-gray-600 text-sm mb-4">
            {isSignup ? 'Already have an account?' : 'Don\'t have an account?'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSignup(!isSignup)}
            className="px-6 py-2 text-[#4ECDC4] font-semibold border-2 border-[#4ECDC4] rounded-xl hover:bg-[#4ECDC4] hover:text-white transition-all duration-200"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </motion.button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-[#FF6B6B] text-sm text-center font-medium">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator for form submission */}
        <motion.div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          style={{ pointerEvents: 'none' }}
        >
          <motion.div
            className="w-8 h-8 border-4 border-[#4ECDC4] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
