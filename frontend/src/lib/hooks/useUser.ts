import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/api";
import { User } from "@/types";
import { useAuthStore } from "@/lib/store/auth";

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	const setUser = useAuthStore((state) => state.setUser);

	return useMutation({
		mutationFn: async (data: {
			name?: string;
			avatar?: string;
			upiId?: string;
		}) => {
			const response = await apiHelpers.put<User>("/auth/profile", data);
			return response.data!;
		},
		onSuccess: (updatedUser) => {
			// Update the auth store with the new user data
			setUser(updatedUser);

			// Invalidate any queries that might be affected
			queryClient.invalidateQueries({ queryKey: ["groups"] });
		},
	});
}
