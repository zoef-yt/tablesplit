'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-primary-500/20 mb-8 backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">TableSplit</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Split Expenses.
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Not Friendships.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            The modern way to track and settle group expenses. Simple, fast, and beautifully designed.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-primary text-white rounded-xl font-semibold text-lg shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="#features">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold text-lg border border-slate-700 hover:border-primary-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                Learn More
              </motion.button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div id="features" className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Real-time Sync"
              description="See updates instantly. Everyone stays in the loop, always."
              delay={0.3}
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Smart Splitting"
              description="Fair splits calculated automatically. No math required."
              delay={0.4}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Private"
              description="Your data is encrypted and never shared. Period."
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
      className="group p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:border-primary-500/50 hover:bg-slate-800/60 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
        <div className="text-primary-400">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
