import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiHelpers } from '@/lib/api';
import { Group } from '@/types';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await apiHelpers.get<Group[]>('/groups');
      return response.data || [];
    },
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const response = await apiHelpers.get<Group>(`/groups/${groupId}`);
      return response.data!;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; theme: string; currency: string }) => {
      const response = await apiHelpers.post<Group>('/groups', data);
      return response.data!;
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push(`/groups/${newGroup._id}`);
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; theme?: string; currency?: string }) => {
      const response = await apiHelpers.put<Group>(`/groups/${groupId}`, updates);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteToken: string) => {
      const response = await apiHelpers.post<Group>(`/groups/join/${inviteToken}`);
      return response.data!;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push(`/groups/${group._id}`);
    },
  });
}

export function useInviteToGroup(groupId: string) {
  return useMutation({
    mutationFn: async (data: { email?: string; inviterName: string }) => {
      const response = await apiHelpers.post<{ inviteToken: string; inviteLink: string }>(`/groups/${groupId}/invite`, data);
      return response.data!;
    },
  });
}

export function useLeaveGroup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      await apiHelpers.delete(`/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push('/groups');
    },
  });
}
