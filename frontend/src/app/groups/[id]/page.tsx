"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Plus,
	Receipt,
	Loader2,
	Users as UsersIcon,
	IndianRupee,
	UserPlus,
	Copy,
	Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useGroup, useInviteToGroup } from "@/lib/hooks/useGroups";
import {
	useBalances,
	useExpenses,
	useCreateExpense,
	useSettlements,
	useRecordSettlement,
} from "@/lib/hooks/useExpenses";
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";
import { SettlementPanel } from "@/components/SettlementPanel";
import type { User } from "@/types";

const expenseSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be positive"),
	category: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function GroupDetailPage() {
	const params = useParams();
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);
	const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
	const [inviteLink, setInviteLink] = useState("");
	const [copied, setCopied] = useState(false);
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

	const groupId = params.id as string;

	const { data: group, isLoading: groupLoading } = useGroup(groupId);
	const { data: balances = [] } = useBalances(groupId);
	const { data: expenses = [] } = useExpenses(groupId);
	const { data: settlements = [] } = useSettlements(groupId);
	const createExpenseMutation = useCreateExpense(groupId);
	const inviteMutation = useInviteToGroup(groupId);
	const recordSettlementMutation = useRecordSettlement(groupId);

	useRealtimeUpdates(groupId);

	// Handle redirect to login if not authenticated
	useEffect(() => {
		if (isHydrated && !user) {
			router.push("/auth/login");
		}
	}, [user, isHydrated, router]);

	// Initialize selected members when group loads
	useEffect(() => {
		if (group && selectedMembers.length === 0) {
			const memberIds: string[] = [];
			for (const m of group.members) {
				const userId =
					typeof m.userId === "object" && m.userId ? m.userId._id : m.userId;
				if (typeof userId === "string") {
					memberIds.push(userId);
				}
			}
			setSelectedMembers([...new Set(memberIds)]);
		}
	}, [group, selectedMembers.length]);

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			description: "",
			amount: 0,
			category: "",
		},
	});

	const onAddExpense = async (values: ExpenseFormValues) => {
		if (!user || !group) return;

		// Validate selected members
		if (selectedMembers.length === 0) {
			form.setError("root", {
				message: "Please select at least one person to split with",
			});
			return;
		}

		try {
			await createExpenseMutation.mutateAsync({
				description: values.description,
				amount: values.amount,
				paidBy: user._id,
				selectedMembers: selectedMembers,
				category: values.category,
			});

			setIsExpenseDialogOpen(false);
			form.reset();
			// Reset selected members to all members
			const memberIds: string[] = [];
			for (const m of group.members) {
				const userId =
					typeof m.userId === "object" && m.userId ? m.userId._id : m.userId;
				if (typeof userId === "string") {
					memberIds.push(userId);
				}
			}
			setSelectedMembers([...new Set(memberIds)]);
		} catch (error) {
			form.setError("root", {
				message:
					error instanceof Error
						? error.message
						: "Failed to create expense. Please try again.",
			});
		}
	};

	const onGenerateInvite = async () => {
		if (!user) return;

		const result = await inviteMutation.mutateAsync({
			inviterName: user.name,
		});

		setInviteLink(result.inviteLink);
	};

	const onCopyInviteLink = () => {
		navigator.clipboard.writeText(inviteLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Show loading while hydrating
	if (!isHydrated || !user) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	if (groupLoading) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	if (!group) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">
						Group not found
					</h2>
					<Button onClick={() => router.push("/groups")}>Back to Groups</Button>
				</div>
			</div>
		);
	}

	const myBalance = balances.find((b) => b.userId === user._id);

	// Create users lookup object from group members for SettlementPanel
	const usersLookup: Record<string, User> = {};
	if (group) {
		for (const member of group.members) {
			const memberUser =
				typeof member.userId === "object" && member.userId
					? member.userId
					: null;
			if (memberUser) {
				usersLookup[memberUser._id] = memberUser;
			}
		}
	}

	const handleMarkAsPaid = async (from: string, to: string, amount: number) => {
		try {
			await recordSettlementMutation.mutateAsync({ from, to, amount });
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "Failed to record settlement",
			);
		}
	};

	return (
		<div className="min-h-screen bg-gray-950">
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<button
						onClick={() => router.push("/groups")}
						className="p-2 hover:bg-gray-800 rounded-full transition-colors"
					>
						<ArrowLeft className="w-6 h-6 text-white" />
					</button>
					<div className="flex-1 text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-white">
							{group.name}
						</h1>
						<div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-1">
							<UsersIcon className="w-4 h-4" />
							<span>{group.members.length} members</span>
						</div>
					</div>
					<Dialog
						open={isInviteDialogOpen}
						onOpenChange={setIsInviteDialogOpen}
					>
						<DialogTrigger asChild>
							<button
								onClick={() => setInviteLink("")}
								className="p-2 hover:bg-gray-800 rounded-full transition-colors text-primary-500"
								title="Invite members"
							>
								<UserPlus className="w-6 h-6" />
							</button>
						</DialogTrigger>
						<DialogContent className="bg-gray-900 border-gray-800">
							<DialogHeader>
								<DialogTitle className="text-white">
									Invite People to {group.name}
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								{!inviteLink ? (
									<div className="text-center py-8">
										<p className="text-gray-400 mb-4">
											Generate an invite link to share with friends
										</p>
										<Button
											onClick={onGenerateInvite}
											disabled={inviteMutation.isPending}
											className="bg-primary-600 hover:bg-primary-700"
										>
											{inviteMutation.isPending ? (
												<>
													<Loader2 className="w-5 h-5 animate-spin mr-2" />
													Generating...
												</>
											) : (
												<>
													<UserPlus className="w-5 h-5 mr-2" />
													Generate Invite Link
												</>
											)}
										</Button>
									</div>
								) : (
									<div className="space-y-4">
										<p className="text-gray-400 text-sm">
											Share this link with anyone you want to invite:
										</p>
										<div className="flex gap-2">
											<Input
												value={inviteLink}
												readOnly
												className="bg-gray-800 border-gray-700 text-white flex-1"
											/>
											<Button
												onClick={onCopyInviteLink}
												variant="outline"
												className="border-gray-700"
											>
												{copied ? (
													<>
														<Check className="w-5 h-5 mr-2" />
														Copied!
													</>
												) : (
													<>
														<Copy className="w-5 h-5 mr-2" />
														Copy
													</>
												)}
											</Button>
										</div>
										<p className="text-gray-500 text-xs">
											Anyone with this link can join the group. The link
											doesn&apos;t expire.
										</p>
									</div>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{/* My Balance */}
				{myBalance && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className={`mb-8 p-6 rounded-xl border ${
							myBalance.balance > 0
								? "bg-green-500/10 border-green-500/50"
								: myBalance.balance < 0
									? "bg-red-500/10 border-red-500/50"
									: "bg-gray-800/50 border-gray-700"
						}`}
					>
						<p className="text-gray-300 text-sm mb-2">Your balance</p>
						<div className="flex items-center gap-2">
							<IndianRupee className="w-6 h-6 text-white" />
							<p
								className={`text-3xl font-bold ${
									myBalance.balance > 0
										? "text-green-400"
										: myBalance.balance < 0
											? "text-red-400"
											: "text-gray-300"
								}`}
							>
								{formatCurrency(Math.abs(myBalance.balance))}
							</p>
						</div>
						<p className="text-gray-400 text-sm mt-1">
							{myBalance.balance > 0
								? "You are owed"
								: myBalance.balance < 0
									? "You owe"
									: "All settled up!"}
						</p>
					</motion.div>
				)}

				{/* Members List */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="mb-8 p-6 rounded-xl bg-gray-800/50 border border-gray-700"
				>
					<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
						<UsersIcon className="w-5 h-5" />
						Members ({group.members.length})
					</h2>
					<div className="space-y-3">
						{group.members.map((member, index) => {
							const memberUser =
								typeof member.userId === "object" && member.userId
									? member.userId
									: null;

							const userId =
								typeof member.userId === "object" && member.userId
									? member.userId._id
									: member.userId;
							const userName = memberUser?.name || "Unknown User";
							const userEmail = memberUser?.email || "No email";

							return (
								<div
									key={`${userId}-${index}`}
									className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700/50"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
											{userName.charAt(0).toUpperCase()}
										</div>
										<div>
											<p className="text-white font-medium">{userName}</p>
											<p className="text-gray-400 text-sm">{userEmail}</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-gray-500 text-xs">
											Seat {member.seatPosition + 1}
										</p>
										<p className="text-gray-500 text-xs">
											{new Date(member.joinedAt).toLocaleDateString()}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</motion.div>

				{/* Settlements Section */}
				{settlements.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="mb-8 p-6 rounded-xl bg-gray-800/50 border border-gray-700"
					>
						<SettlementPanel
							groupId={groupId}
							groupName={group.name}
							settlements={settlements}
							users={usersLookup}
							currentUserId={user._id}
							onMarkAsPaid={handleMarkAsPaid}
						/>
					</motion.div>
				)}

				{/* Expenses List */}
				<div className="mb-20">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold text-white">Recent Expenses</h2>
						<Dialog
							open={isExpenseDialogOpen}
							onOpenChange={setIsExpenseDialogOpen}
						>
							<DialogTrigger asChild>
								<Button className="bg-primary-600 hover:bg-primary-700">
									<Plus className="w-5 h-5 mr-2" />
									Add Expense
								</Button>
							</DialogTrigger>
							<DialogContent className="bg-gray-900 border-gray-800">
								<DialogHeader>
									<DialogTitle className="text-white">
										Add New Expense
									</DialogTitle>
								</DialogHeader>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onAddExpense)}
										className="space-y-4"
									>
										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-gray-300">
														Description
													</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="Dinner, Groceries, etc."
															className="bg-gray-800 border-gray-700 text-white"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="amount"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-gray-300">
														Amount (₹)
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															placeholder="0.00"
															value={
																field.value === undefined ||
																Number.isNaN(field.value)
																	? ""
																	: field.value
															}
															onChange={(e) => {
																const value = e.target.value;
																field.onChange(
																	value === "" ? undefined : parseFloat(value),
																);
															}}
															className="bg-gray-800 border-gray-700 text-white"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-gray-300">
														Category (Optional)
													</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="Food, Transport, etc."
															className="bg-gray-800 border-gray-700 text-white"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="space-y-2">
											<FormLabel className="text-gray-300">
												Split with ({selectedMembers.length} selected)
											</FormLabel>
											<div className="space-y-2 max-h-40 overflow-y-auto bg-gray-800/50 rounded p-2">
												{group?.members.map((member) => {
													const memberUser =
														typeof member.userId === "object" && member.userId
															? member.userId
															: null;
													const userId =
														typeof member.userId === "object" && member.userId
															? member.userId._id
															: member.userId;
													const userName = memberUser?.name || "Unknown User";

													return (
														<label
															key={userId}
															className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
														>
															<input
																type="checkbox"
																checked={selectedMembers.includes(userId)}
																onChange={(e) => {
																	if (e.target.checked) {
																		setSelectedMembers([
																			...selectedMembers,
																			userId,
																		]);
																	} else {
																		setSelectedMembers(
																			selectedMembers.filter(
																				(id) => id !== userId,
																			),
																		);
																	}
																}}
																className="w-4 h-4 accent-primary-500"
															/>
															<span className="text-white text-sm">
																{userName}
																{userId === user?._id && " (You)"}
															</span>
														</label>
													);
												})}
											</div>
											{selectedMembers.length === 0 && (
												<p className="text-red-500 text-xs mt-1">
													Select at least one person
												</p>
											)}
										</div>
										{form.formState.errors.root && (
											<p className="text-red-500 text-sm">
												{form.formState.errors.root.message}
											</p>
										)}
										<Button
											type="submit"
											className="w-full bg-primary-600 hover:bg-primary-700"
											disabled={createExpenseMutation.isPending}
										>
											{createExpenseMutation.isPending ? (
												<>
													<Loader2 className="w-5 h-5 animate-spin mr-2" />
													Adding...
												</>
											) : (
												"Add Expense"
											)}
										</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>

					{expenses.length === 0 ? (
						<div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
							<Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
							<p className="text-gray-400">No expenses yet</p>
							<p className="text-gray-500 text-sm">
								Add an expense to get started
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{expenses.map((expense, index) => {
								const paidByUser =
									typeof expense.paidBy === "object" && expense.paidBy
										? expense.paidBy
										: null;
								const paidByName = paidByUser?.name || "Unknown";

								return (
									<motion.div
										key={expense._id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
									>
										<div className="flex items-start justify-between mb-3">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h3 className="text-white font-medium">
														{expense.description}
													</h3>
													{expense.category && (
														<span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">
															{expense.category}
														</span>
													)}
												</div>
												<p className="text-gray-400 text-sm">
													Paid by {paidByName}
													{paidByUser?._id === user?._id && " (You)"}
												</p>
												<p className="text-gray-500 text-xs mt-1">
													{new Date(expense.createdAt).toLocaleString("en-IN", {
														day: "numeric",
														month: "short",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</div>
											<div className="text-right">
												<p className="text-xl font-bold text-white">
													₹{expense.amount.toFixed(2)}
												</p>
												<p className="text-gray-400 text-sm">
													₹{(expense.amount / expense.splits.length).toFixed(2)}{" "}
													each
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-500">
											<UsersIcon className="w-3 h-3" />
											<span>
												Split between {expense.splits.length}{" "}
												{expense.splits.length === 1 ? "person" : "people"}
											</span>
										</div>
									</motion.div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
