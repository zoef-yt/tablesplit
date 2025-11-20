import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'sonner';
import type { GamificationProfile, LeaderboardEntry, Badge, Achievement } from '@/types';

/**
 * Hook to get current user's gamification profile
 */
export function useGamificationProfile() {
  return useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: async (): Promise<GamificationProfile> => {
      const response = await api.get('/gamification/profile');
      return response.data;
    },
  });
}

/**
 * Hook to get another user's gamification profile
 */
export function useUserGamificationProfile(userId: string) {
  return useQuery({
    queryKey: ['gamification', 'profile', userId],
    queryFn: async (): Promise<GamificationProfile> => {
      const response = await api.get(`/gamification/profile/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to get leaderboard
 */
export function useLeaderboard(type: 'xp' | 'settlements' | 'streaks' = 'xp', limit: number = 10) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', type, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const response = await api.get('/gamification/leaderboard', {
        params: { type, limit },
      });
      return response.data;
    },
  });
}

/**
 * Hook to get all available badges
 */
export function useAllBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: async (): Promise<Record<string, Badge>> => {
      const response = await api.get('/gamification/badges');
      return response.data;
    },
  });
}

/**
 * Hook to get all achievements
 */
export function useAllAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const response = await api.get('/gamification/achievements');
      return response.data;
    },
  });
}

/**
 * Hook to get current user's rank
 */
export function useUserRank() {
  return useQuery({
    queryKey: ['gamification', 'rank'],
    queryFn: async () => {
      const response = await api.get('/gamification/rank');
      return response.data;
    },
  });
}

/**
 * Hook to equip a title
 */
export function useEquipTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const response = await api.post('/gamification/equip/title', { title });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Title equipped!');
      queryClient.invalidateQueries({ queryKey: ['gamification', 'profile'] });
    },
    onError: () => {
      toast.error('Failed to equip title');
    },
  });
}

/**
 * Hook to equip a badge
 */
export function useEquipBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const response = await api.post('/gamification/equip/badge', { badgeId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Badge equipped!');
      queryClient.invalidateQueries({ queryKey: ['gamification', 'profile'] });
    },
    onError: () => {
      toast.error('Failed to equip badge');
    },
  });
}
