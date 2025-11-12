'use client';

import { motion } from 'framer-motion';
import { Coins, Users, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-glow-gold-strong">
              <Coins className="w-12 h-12 text-slate-950" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Table<span className="text-gold-500">Split</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Group expenses meet poker table magic. Track, split, and settle with style.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gold-500 text-slate-950 rounded-lg font-bold text-xl shadow-chip hover:bg-gold-400 transition-colors shadow-glow-gold"
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-time Magic"
              description="Watch balances flow like chips across the felt with butter-smooth animations"
              delay={0.3}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Social First"
              description="Groups are communities, not spreadsheets. Invite friends and track together"
              delay={0.4}
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Friction-free"
              description="Complex math hidden behind simple gestures. Just add, split, settle"
              delay={0.5}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-xl bg-felt-700/50 border border-gold-900/30 backdrop-blur-sm hover:border-gold-700/50 transition-colors"
    >
      <div className="text-gold-500 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
}
