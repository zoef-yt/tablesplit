'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGroupStore } from '@/stores/groupStore';
import { apiHelpers } from '@/lib/api';
import { Group } from '@/types';

export default function GroupsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { groups, setGroups } = useGroupStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const response = await apiHelpers.get<Group[]>('/groups');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Groups</h1>
          <p className="text-gray-400">Manage your expense groups</p>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No groups yet</h2>
            <p className="text-gray-400 mb-6">Create your first group to start tracking expenses</p>
            <button
              onClick={() => router.push('/groups/create')}
              className="px-6 py-3 bg-gold-500 text-slate-950 rounded-lg font-bold hover:bg-gold-400 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {groups.map((group, index) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="bg-felt-700/50 backdrop-blur-sm border border-gold-900/30 rounded-xl p-6 hover:border-gold-500 transition-colors cursor-pointer shadow-glow-gold"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{group.name}</h3>
                    <div className="poker-chip w-12 h-12" />
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Users className="w-4 h-4" />
                    <span>{group.members.length} members</span>
                  </div>

                  <div className="flex items-center gap-2 text-gold-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">View details →</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Create Group Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/groups/create')}
              className="fixed bottom-8 right-8 w-16 h-16 bg-gold-500 rounded-full shadow-chip flex items-center justify-center hover:bg-gold-400 transition-colors"
            >
              <Plus className="w-8 h-8 text-slate-950" />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
