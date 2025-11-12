import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/api";
import { Expense, Balance, Settlement } from "@/types";
import { connectSocket } from "@/lib/socket";
import { vibrate } from "@/lib/utils";

export function useExpenses(groupId: string) {
	return useQuery({
		queryKey: ["expenses", groupId],
		queryFn: async () => {
			const response = await apiHelpers.get<Expense[]>(
				`/expenses/group/${groupId}`,
			);
			return response.data || [];
		},
		enabled: !!groupId,
	});
}

export function useBalances(groupId: string) {
	return useQuery({
		queryKey: ["balances", groupId],
		queryFn: async () => {
			const response = await apiHelpers.get<Balance[]>(
				`/expenses/group/${groupId}/balances`,
			);
			return response.data || [];
		},
		enabled: !!groupId,
	});
}

export function useSettlements(groupId: string) {
	return useQuery({
		queryKey: ["settlements", groupId],
		queryFn: async () => {
			const response = await apiHelpers.get<Settlement[]>(
				`/expenses/group/${groupId}/settlement`,
			);
			return response.data || [];
		},
		enabled: !!groupId,
	});
}

export function useCreateExpense(groupId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			description: string;
			amount: number;
			paidBy: string;
			selectedMembers: string[];
			category?: string;
		}) => {
			const response = await apiHelpers.post<{
				expense: Expense;
				updatedBalances: Balance[];
			}>("/expenses", {
				groupId,
				...data,
			});
			return response.data!;
		},
		onSuccess: (data) => {
			// Invalidate and refetch
			queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
			queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
			queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });

			// Emit socket event for real-time update
			const socket = connectSocket();
			socket.emit("expense:created", {
				groupId,
				expense: data.expense,
				updatedBalances: data.updatedBalances,
			});

			vibrate(50);
		},
	});
}

export function useRecordSettlement(groupId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { from: string; to: string; amount: number }) => {
			const response = await apiHelpers.post(
				`/expenses/group/${groupId}/settle`,
				data,
			);
			return response.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
			queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });

			// Emit socket event
			const socket = connectSocket();
			socket.emit("payment:settled", {
				groupId,
				...variables,
			});

			vibrate([10, 50, 10]);
		},
	});
}
