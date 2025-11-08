'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coins, Mail, Lock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/magic-link', { email });
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      setAuth(user, token);
      router.push('/groups');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-glow-gold-strong">
              <Coins className="w-10 h-10 text-slate-950" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Table<span className="text-gold-500">Split</span>
          </h1>
          <p className="text-gray-400">Welcome back to the table</p>
        </div>

        {/* Login Card */}
        <div className="bg-felt-700/50 backdrop-blur-sm border border-gold-900/30 rounded-2xl p-8 shadow-glow-gold">
          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Mail className="w-16 h-16 text-gold-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
              <p className="text-gray-300 mb-6">
                We've sent a magic link to <strong>{email}</strong>. Click the link to log in.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="text-gold-500 hover:text-gold-400 underline"
              >
                Try different email
              </button>
            </motion.div>
          ) : (
            <>
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Sign in with Magic Link</h2>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-gold-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gold-500 text-slate-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gold-900/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-felt-700/50 text-gray-400">Or with password</span>
                </div>
              </div>

              {/* Password Login Form */}
              <form onSubmit={handlePasswordLogin}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-gold-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-3 bg-felt-500 text-white rounded-lg font-bold border-2 border-gold-700 hover:bg-felt-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
