import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { FriendRequest, User, UserWithFriendshipStatus } from '@/types';

/**
 * Hook to get all friends
 */
export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get('/friends');
      return response.data;
    },
  });
}

/**
 * Hook to get pending friend requests (received)
 */
export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests', 'pending'],
    queryFn: async (): Promise<FriendRequest[]> => {
      const response = await api.get('/friends/requests/pending');
      return response.data;
    },
  });
}

/**
 * Hook to get sent friend requests
 */
export function useSentFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: async (): Promise<FriendRequest[]> => {
      const response = await api.get('/friends/requests/sent');
      return response.data;
    },
  });
}

/**
 * Hook to send a friend request
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string): Promise<FriendRequest> => {
      const response = await api.post('/friends/request', { email });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate sent requests to show the new one
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
    },
  });
}

/**
 * Hook to accept a friend request
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.post(`/friends/request/${requestId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both friends and pending requests
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'pending'] });
    },
  });
}

/**
 * Hook to decline a friend request
 */
export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.post(`/friends/request/${requestId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate pending requests
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'pending'] });
    },
  });
}

/**
 * Hook to cancel a sent friend request
 */
export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.delete(`/friends/request/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate sent requests
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
    },
  });
}

/**
 * Hook to remove a friend
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const response = await api.delete(`/friends/${friendId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate friends list
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

/**
 * Hook to search for users by email
 */
export function useSearchUsers(searchQuery: string) {
  return useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async (): Promise<UserWithFriendshipStatus[]> => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return [];
      }
      const response = await api.get('/friends/search', {
        params: { q: searchQuery },
      });
      return response.data;
    },
    enabled: searchQuery.trim().length >= 2,
  });
}
