'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyMagicLinkPage() {
  const router = useRouter();
  const params = useParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = params.token as string;
        const response = await api.get(`/auth/verify/${token}`);
        const { user, token: jwtToken } = response.data.data;

        setAuth(user, jwtToken);
        setStatus('success');

        // Redirect to groups after 1 second
        setTimeout(() => {
          router.push('/groups');
        }, 1000);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Invalid or expired magic link');
      }
    };

    verifyToken();
  }, [params.token, router, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-gold-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying your link...</h2>
            <p className="text-gray-400">Please wait a moment</p>
          </>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back! 🎰</h2>
            <p className="text-gray-400">Redirecting to your groups...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-gold-500 text-slate-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
            >
              Back to Login
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
