import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, joinGroup, leaveGroup } from "@/lib/socket";
import { Expense, Balance } from "@/types";
import { vibrate } from "@/lib/utils";

export function useRealtimeUpdates(groupId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!groupId) return;

		const socket = connectSocket();
		joinGroup(groupId);

		// Handle expense created
		const handleExpenseCreated = (data: {
			expense: Expense;
			updatedBalances: Balance[];
		}) => {
			queryClient.setQueryData(["expenses", groupId], (old: Expense[] = []) => [
				data.expense,
				...old,
			]);
			queryClient.setQueryData(["balances", groupId], data.updatedBalances);
			vibrate([10, 50, 10]);
		};

		// Handle expense updated
		const handleExpenseUpdated = (data: {
			expense: Expense;
			updatedBalances: Balance[];
		}) => {
			queryClient.setQueryData(["expenses", groupId], (old: Expense[] = []) =>
				old.map((exp) => (exp._id === data.expense._id ? data.expense : exp))
			);
			queryClient.setQueryData(["balances", groupId], data.updatedBalances);
			vibrate([10, 50, 10]);
		};

		// Handle expense deleted
		const handleExpenseDeleted = (data: {
			expenseId: string;
			updatedBalances: Balance[];
		}) => {
			queryClient.setQueryData(["expenses", groupId], (old: Expense[] = []) =>
				old.filter((exp) => exp._id !== data.expenseId)
			);
			queryClient.setQueryData(["balances", groupId], data.updatedBalances);
			vibrate([10, 50, 10]);
		};

		// Handle payment settled
		const handlePaymentSettled = () => {
			queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
			queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
			queryClient.invalidateQueries({ queryKey: ["settlement-history", groupId] });
			vibrate([10, 50, 10]);
		};

		socket.on("expense:created", handleExpenseCreated);
		socket.on("expense:updated", handleExpenseUpdated);
		socket.on("expense:deleted", handleExpenseDeleted);
		socket.on("payment:settled", handlePaymentSettled);

		return () => {
			leaveGroup(groupId);
			socket.off("expense:created", handleExpenseCreated);
			socket.off("expense:updated", handleExpenseUpdated);
			socket.off("expense:deleted", handleExpenseDeleted);
			socket.off("payment:settled", handlePaymentSettled);
		};
	}, [groupId, queryClient]);
}
