import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiHelpers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { User, AuthResponse } from '@/types';

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password?: string }) => {
      if (!password) {
        // Send magic link
        await apiHelpers.post('/auth/magic-link', { email });
        return { requiresMagicLink: true };
      }
      // Login with password
      const response = await apiHelpers.post<AuthResponse>('/auth/login', { email, password });
      return response.data!;
    },
    onSuccess: (data) => {
      if ('requiresMagicLink' in data) {
        // Magic link sent, no further action needed
        return;
      }
      setAuth(data.user, data.token);

      // Check if there's a pending invite to redirect to
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        router.push(`/groups/join/${pendingInvite}`);
      } else {
        router.push('/groups');
      }
    },
  });
}

export function useVerifyMagicLink(token: string) {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useQuery({
    queryKey: ['verify-magic-link', token],
    queryFn: async () => {
      const response = await apiHelpers.get<AuthResponse>(`/auth/verify/${token}`);
      const data = response.data!;
      setAuth(data.user, data.token);
      return data;
    },
    retry: false,
    enabled: !!token,
  });
}

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await apiHelpers.get<User>('/auth/me');
      return response.data!;
    },
    enabled: !!user,
    initialData: user || undefined,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; avatar?: string }) => {
      const response = await apiHelpers.put<User>('/auth/profile', updates);
      return response.data!;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['current-user'], updatedUser);
      useAuthStore.getState().setAuth(updatedUser, useAuthStore.getState().token!);
    },
  });
}
