"use client"

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: "⚡",
      title: "Real-Time Competition",
      description: "Compete against opponents in live coding challenges with real-time updates and instant feedback."
    },
    {
      icon: "👥",
      title: "Add Friends",
      description: "Connect with friends, invite them to private rooms, and challenge them to coding duels."
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Communicate with your opponent during the competition through our integrated chat system."
    },
    {
      icon: "🚀",
      title: "Instant Code Execution",
      description: "Write, compile, and run your code instantly with our powerful code execution engine."
    },
    {
      icon: "🎮",
      title: "Room-Based Matches",
      description: "Join private rooms with unique IDs and compete head-to-head with your friends or random opponents."
    },
    {
      icon: "⏰",
      title: "Timed Challenges",
      description: "Race against the clock with configurable time limits for each coding challenge."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#18181b]/80 backdrop-blur-xl border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="text-2xl">⚡</div>
              <span className="text-xl font-bold text-slate-100">CodeFight</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link href="/login">
                <button className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors duration-200">
                  Login
                </button>
              </Link>
              <Link href="/">
                <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200">
                  Get Started
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6">
              Code. Compete.
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Win.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the ultimate real-time coding competition platform. Challenge opponents, solve problems, and climb the leaderboards in live head-to-head matches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-200"
              >
                🚀 Start Competing
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="px-8 py-4 border-2 border-slate-600 text-slate-300 rounded-2xl font-bold text-lg hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200"
              >
                🔐 Sign In
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Why Choose <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">CodeFight</span>?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Experience the future of competitive coding with our cutting-edge features designed for real-time competition.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-[#23272f] p-8 rounded-2xl border border-slate-700/60 hover:border-cyan-400/40 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-100 mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#23272f]/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              How It <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create or Join a Room",
                description: "Create a new competition room or join an existing one using a unique room ID.",
                icon: "🏠"
              },
              {
                step: "02",
                title: "Wait for Opponent",
                description: "Share your room ID with a friend or wait for a random opponent to join.",
                icon: "👥"
              },
              {
                step: "03",
                title: "Code & Compete",
                description: "Solve the coding challenge, chat with your opponent, and see who wins!",
                icon: "⚡"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-100 mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Ready to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Compete</span>?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of developers competing in real-time coding challenges.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/create-room')}
              className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-xl hover:shadow-2xl transition-all duration-200"
            >
              🚀 Start Your First Match
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-700/60">
        <div className="mt-8 pt-8 border-t border-slate-700/60 text-center text-slate-500">
            <p>&copy; 2025 CodeFight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
