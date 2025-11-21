"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
	TrendingUp,
	FileText,
	Mail,
	X,
	MoreVertical,
	Settings,
	UserRoundPlus,
	Link as LinkIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useGroup, useInviteToGroup } from "@/lib/hooks/useGroups";
import {
	useBalances,
	useExpenses,
	useCreateExpense,
	useSettlements,
	useRecordSettlement,
	useSettlementHistory,
} from "@/lib/hooks/useExpenses";
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { usePresence } from "@/lib/hooks/usePresence";
import { emitUserActivity } from "@/lib/socket";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Timeline } from "@/components/Timeline";
import { ExpenseDetailModal } from "@/components/ExpenseDetailModal";
import { Navigation } from "@/components/Navigation";
import { GroupSettings } from "@/components/GroupSettings";
import { AddFriendToGroupDialog } from "@/components/AddFriendToGroupDialog";
import { Combobox, EXPENSE_CATEGORIES } from "@/components/ui/combobox";
import type { User, Expense } from "@/types";

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
	const [pendingEmails, setPendingEmails] = useState<string[]>([]);
	const [emailInput, setEmailInput] = useState("");
	const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
	const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false);
	const [showSettlementHistory, setShowSettlementHistory] = useState(false);
	const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [selectedMemberForTransactions, setSelectedMemberForTransactions] = useState<string | null>(null);
	const [isMemberTransactionsOpen, setIsMemberTransactionsOpen] = useState(false);

	// Track if we've emitted an activity (to avoid emitting null on initial render)
	const hasEmittedActivityRef = useRef(false);

	const groupId = params.id as string;

	const { data: group, isLoading: groupLoading } = useGroup(groupId);
	const { data: balances = [] } = useBalances(groupId);
	const { data: expenses = [] } = useExpenses(groupId);
	const { data: settlements = [] } = useSettlements(groupId);
	const { data: settlementHistory = [] } = useSettlementHistory(groupId);
	const createExpenseMutation = useCreateExpense(groupId);
	const inviteMutation = useInviteToGroup(groupId);
	const recordSettlementMutation = useRecordSettlement(groupId);

	useRealtimeUpdates(groupId);
	const { isUserOnline, getUserActivity } = usePresence(groupId);

	// Handle redirect to login if not authenticated
	useEffect(() => {
		if (isHydrated && !user) {
			router.push("/auth/login");
		}
	}, [user, isHydrated, router]);

	// Track activity when adding expense
	useEffect(() => {
		// Small delay to ensure socket has joined group
		const timer = setTimeout(() => {
			if (isExpenseDialogOpen) {
				emitUserActivity(groupId, "Adding an expense...");
				hasEmittedActivityRef.current = true;
			} else if (!isExpenseDetailOpen && hasEmittedActivityRef.current) {
				// Only clear if we previously emitted an activity and expense detail is also closed
				emitUserActivity(groupId, null);
				hasEmittedActivityRef.current = false;
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [isExpenseDialogOpen, isExpenseDetailOpen, groupId]);

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

		// Validate selected members or pending emails
		if (selectedMembers.length === 0 && pendingEmails.length === 0) {
			form.setError("root", {
				message: "Please select at least one person or add an email to split with",
			});
			return;
		}

		try {
			await createExpenseMutation.mutateAsync({
				description: values.description,
				amount: values.amount,
				paidBy: user._id,
				selectedMembers: selectedMembers,
				pendingEmails: pendingEmails.length > 0 ? pendingEmails : undefined,
				category: values.category || undefined, // Don't send empty string
			});

			setIsExpenseDialogOpen(false);
			form.reset();
			setPendingEmails([]);
			setEmailInput("");
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

	const addPendingEmail = () => {
		const email = emailInput.trim().toLowerCase();
		if (!email) return;

		// Simple email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			form.setError("root", { message: "Please enter a valid email address" });
			return;
		}

		// Check if already added
		if (pendingEmails.includes(email)) {
			form.setError("root", { message: "This email is already added" });
			return;
		}

		// Check if email belongs to existing member
		const existingMember = group?.members.find((m) => {
			const memberUser = typeof m.userId === "object" && m.userId ? m.userId : null;
			return memberUser?.email?.toLowerCase() === email;
		});

		if (existingMember) {
			form.setError("root", { message: "This person is already a group member" });
			return;
		}

		setPendingEmails([...pendingEmails, email]);
		setEmailInput("");
		form.clearErrors("root");
	};

	const removePendingEmail = (email: string) => {
		setPendingEmails(pendingEmails.filter((e) => e !== email));
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

	const handleMarkAsPaid = async (
		from: string,
		to: string,
		amount: number,
		paymentMethod?: "UPI" | "Cash" | "Bank Transfer" | "Other",
		notes?: string
	) => {
		try {
			await recordSettlementMutation.mutateAsync({
				from,
				to,
				amount,
				paymentMethod,
				notes,
			});
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "Failed to record settlement",
			);
		}
	};

	const handleExpenseClick = (expense: Expense) => {
		setSelectedExpense(expense);
		setIsExpenseDetailOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-950">
			<Navigation />
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-8 gap-2">
					<button
						onClick={() => router.push("/groups")}
						className="p-2 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
					>
						<ArrowLeft className="w-6 h-6 text-white" />
					</button>
					<div className="flex-1 text-center min-w-0">
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
							{group.name}
						</h1>
						<div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-1">
							<UsersIcon className="w-4 h-4" />
							<span>{group.members.length} members</span>
						</div>
					</div>

					{/* Desktop action buttons */}
					<div className="hidden md:flex items-center gap-2">
						<Link
							href={`/groups/${groupId}/report`}
							className="p-2 hover:bg-gray-800 rounded-full transition-colors text-blue-500"
							title="View expense report"
						>
							<FileText className="w-6 h-6" />
						</Link>
						<Link
							href={`/groups/${groupId}/analytics`}
							className="p-2 hover:bg-gray-800 rounded-full transition-colors text-green-500"
							title="View analytics"
						>
							<TrendingUp className="w-6 h-6" />
						</Link>
						<GroupSettings group={group} currentUserId={user._id} />
						<AddFriendToGroupDialog
							groupId={groupId}
							currentMembers={group.members.map((m) =>
								typeof m.userId === "object" && m.userId ? m.userId._id : m.userId
							)}
						/>
						<button
							onClick={() => {
								setInviteLink("");
								setIsInviteDialogOpen(true);
							}}
							className="p-2 hover:bg-gray-800 rounded-full transition-colors text-primary-500"
							title="Generate invite link"
						>
							<UserPlus className="w-6 h-6" />
						</button>
					</div>

					{/* Mobile dropdown menu */}
					<div className="md:hidden flex-shrink-0">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
									<MoreVertical className="w-6 h-6 text-white" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 w-56">
								<DropdownMenuItem
									onClick={() => router.push(`/groups/${groupId}/report`)}
									className="text-white hover:bg-gray-800 cursor-pointer"
								>
									<FileText className="w-4 h-4 mr-2 text-blue-500" />
									Expense Report
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => router.push(`/groups/${groupId}/analytics`)}
									className="text-white hover:bg-gray-800 cursor-pointer"
								>
									<TrendingUp className="w-4 h-4 mr-2 text-green-500" />
									Analytics
								</DropdownMenuItem>
								<DropdownMenuSeparator className="bg-gray-800" />
								<DropdownMenuItem
									onClick={() => setIsSettingsOpen(true)}
									className="text-white hover:bg-gray-800 cursor-pointer"
								>
									<Settings className="w-4 h-4 mr-2 text-gray-400" />
									Group Settings
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setIsAddFriendOpen(true)}
									className="text-white hover:bg-gray-800 cursor-pointer"
								>
									<UserRoundPlus className="w-4 h-4 mr-2 text-purple-500" />
									Add Friend
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setInviteLink("");
										setIsInviteDialogOpen(true);
									}}
									className="text-white hover:bg-gray-800 cursor-pointer"
								>
									<LinkIcon className="w-4 h-4 mr-2 text-primary-500" />
									Generate Invite Link
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Invite Dialog */}
				<Dialog
					open={isInviteDialogOpen}
					onOpenChange={setIsInviteDialogOpen}
				>
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

				{/* My Balance */}
				{myBalance && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border ${
							myBalance.balance > 0
								? "bg-green-500/10 border-green-500/50"
								: myBalance.balance < 0
									? "bg-red-500/10 border-red-500/50"
									: "bg-gray-800/50 border-gray-700"
						}`}
					>
						<p className="text-gray-300 text-sm mb-2">Your Balance in This Group</p>
						<div className="flex items-center gap-2 mb-3">
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
						<div className="space-y-1">
							{myBalance.balance > 0 ? (
								<>
									<p className="text-green-400 font-semibold">
										✓ Others owe you money
									</p>
									<p className="text-gray-400 text-sm">
										Check &ldquo;Settlements&rdquo; below to see who owes you and how much
									</p>
								</>
							) : myBalance.balance < 0 ? (
								<>
									<p className="text-red-400 font-semibold">
										! You owe money to others
									</p>
									<p className="text-gray-400 text-sm">
										Check &ldquo;Settlements&rdquo; below to see who to pay and how much
									</p>
								</>
							) : (
								<>
									<p className="text-gray-300 font-semibold">
										✓ All settled up!
									</p>
									<p className="text-gray-400 text-sm">
										You don&apos;t owe anyone and nobody owes you
									</p>
								</>
							)}
						</div>
					</motion.div>
				)}

				{/* Members List */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gray-800/50 border border-gray-700"
				>
					<div className="flex items-center justify-between mb-3 sm:mb-4">
						<h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
							<UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
							Members ({group.members.length})
						</h2>
						<span className="text-gray-500 text-xs hidden sm:inline">Tap to view transactions</span>
					</div>
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
							const isOnline = isUserOnline(userId);
							const activity = getUserActivity(userId);

							return (
								<div
									key={`${userId}-${index}`}
									onClick={() => {
										setSelectedMemberForTransactions(userId);
										setIsMemberTransactionsOpen(true);
									}}
									className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 cursor-pointer hover:bg-gray-800/50 hover:border-gray-600/50 transition-colors"
								>
									<div className="flex items-center gap-3 flex-1">
										<div className="relative">
											<div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
												{userName.charAt(0).toUpperCase()}
											</div>
											{/* Online/Offline indicator */}
											<div
												className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
													isOnline ? "bg-green-500" : "bg-gray-500"
												}`}
												title={isOnline ? "Online" : "Offline"}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-white font-medium">{userName}</p>
												{isOnline && (
													<span className="text-xs text-green-400 font-medium">
														●
													</span>
												)}
											</div>
											{activity ? (
												<p className="text-primary-400 text-xs italic truncate">
													{activity}
												</p>
											) : (
												<p className="text-gray-400 text-sm truncate">
													{userEmail}
												</p>
											)}
										</div>
									</div>
									<div className="text-right flex-shrink-0">
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
				{(settlements.length > 0 || settlementHistory.length > 0) && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="mb-8 rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden"
					>
						{/* Tab Header */}
						<div className="flex border-b border-gray-700">
							<button
								onClick={() => setShowSettlementHistory(false)}
								className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-colors ${
									!showSettlementHistory
										? "text-white bg-gray-800/50 border-b-2 border-primary-500"
										: "text-gray-400 hover:text-white hover:bg-gray-800/30"
								}`}
							>
								Pending ({settlements.length})
							</button>
							<button
								onClick={() => setShowSettlementHistory(true)}
								className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-colors ${
									showSettlementHistory
										? "text-white bg-gray-800/50 border-b-2 border-primary-500"
										: "text-gray-400 hover:text-white hover:bg-gray-800/30"
								}`}
							>
								Timeline ({expenses.length + settlementHistory.length})
							</button>
						</div>

						{/* Content */}
						<div className="p-4 sm:p-6">
							{!showSettlementHistory ? (
								<SettlementPanel
									groupId={groupId}
									groupName={group.name}
									settlements={settlements}
									users={usersLookup}
									currentUserId={user._id}
									onMarkAsPaid={handleMarkAsPaid}
								/>
							) : (
								<Timeline
									expenses={expenses}
									settlements={settlementHistory}
									users={usersLookup}
									currentUserId={user._id}
								/>
							)}
						</div>
					</motion.div>
				)}

				{/* Expenses List */}
				<div className="mb-20">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold text-white">Recent Expenses</h2>
					</div>

					<Dialog
						open={isExpenseDialogOpen}
						onOpenChange={setIsExpenseDialogOpen}
					>
						<DialogContent className="bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
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
														<Combobox
															value={field.value || ""}
															onChange={field.onChange}
															options={EXPENSE_CATEGORIES}
															placeholder="Select or type category"
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
											{selectedMembers.length === 0 && pendingEmails.length === 0 && (
												<p className="text-red-500 text-xs mt-1">
													Select at least one person or add an email
												</p>
											)}
										</div>

										{/* Add non-member by email */}
										<div className="space-y-2">
											<FormLabel className="text-gray-300 flex items-center gap-2">
												<Mail className="w-4 h-4" />
												Invite by email (not in group)
											</FormLabel>
											<div className="flex gap-2">
												<Input
													type="email"
													placeholder="email@example.com"
													value={emailInput}
													onChange={(e) => setEmailInput(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															addPendingEmail();
														}
													}}
													className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
												/>
												<Button
													type="button"
													onClick={addPendingEmail}
													variant="outline"
													className="border-gray-700 text-white hover:bg-gray-700"
												>
													Add
												</Button>
											</div>
											{pendingEmails.length > 0 && (
												<div className="space-y-1">
													{pendingEmails.map((email) => (
														<div
															key={email}
															className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm"
														>
															<span className="text-yellow-200">{email}</span>
															<button
																type="button"
																onClick={() => removePendingEmail(email)}
																className="text-yellow-400 hover:text-yellow-300"
															>
																<X className="w-4 h-4" />
															</button>
														</div>
													))}
													<p className="text-xs text-gray-400">
														These people will receive an invite email
													</p>
												</div>
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
										onClick={() => handleExpenseClick(expense)}
										className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-gray-900/70 transition-all cursor-pointer"
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

				{/* Expense Detail Modal */}
				<ExpenseDetailModal
					expense={selectedExpense}
					isOpen={isExpenseDetailOpen}
					onClose={() => {
						setIsExpenseDetailOpen(false);
						setSelectedExpense(null);
					}}
					currentUserId={user._id}
					groupId={groupId}
					groupMembers={Object.values(usersLookup)}
				/>

				{/* Controlled GroupSettings for mobile menu */}
				<GroupSettings
					group={group}
					currentUserId={user._id}
					open={isSettingsOpen}
					onOpenChange={setIsSettingsOpen}
				/>

				{/* Controlled AddFriendToGroupDialog for mobile menu */}
				<AddFriendToGroupDialog
					groupId={groupId}
					currentMembers={group.members.map((m) =>
						typeof m.userId === "object" && m.userId ? m.userId._id : m.userId
					)}
					open={isAddFriendOpen}
					onOpenChange={setIsAddFriendOpen}
				/>

				{/* Member Transactions Modal */}
				<Dialog open={isMemberTransactionsOpen} onOpenChange={setIsMemberTransactionsOpen}>
					<DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
						<DialogHeader>
							<DialogTitle className="text-white flex items-center gap-2">
								<Receipt className="w-5 h-5 text-primary-500" />
								{selectedMemberForTransactions && usersLookup[selectedMemberForTransactions]
									? `${usersLookup[selectedMemberForTransactions].name}'s Transactions`
									: "Member Transactions"}
							</DialogTitle>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto space-y-4 pr-2">
							{selectedMemberForTransactions && (() => {
								const memberExpenses = expenses.filter((expense) => {
									// Check if member paid or is in splits
									const paidById = typeof expense.paidBy === "object" && expense.paidBy
										? expense.paidBy._id
										: expense.paidBy;
									const isInSplits = expense.splits.some((s) => {
										const splitUserId = typeof s.userId === "object" && s.userId
											? s.userId._id
											: s.userId;
										return splitUserId === selectedMemberForTransactions;
									});
									return paidById === selectedMemberForTransactions || isInSplits;
								});

								// Calculate member's total paid and owed
								let totalPaid = 0;
								let totalOwed = 0;

								for (const expense of memberExpenses) {
									const paidById = typeof expense.paidBy === "object" && expense.paidBy
										? expense.paidBy._id
										: expense.paidBy;

									if (paidById === selectedMemberForTransactions) {
										totalPaid += expense.amount;
									}

									const memberSplit = expense.splits.find((s) => {
										const splitUserId = typeof s.userId === "object" && s.userId
											? s.userId._id
											: s.userId;
										return splitUserId === selectedMemberForTransactions;
									});

									if (memberSplit) {
										totalOwed += memberSplit.amount;
									}
								}

								const memberBalance = balances.find((b) => b.userId === selectedMemberForTransactions);

								if (memberExpenses.length === 0) {
									return (
										<div className="text-center py-8">
											<Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
											<p className="text-gray-400">No transactions found</p>
										</div>
									);
								}

								return (
									<>
										{/* Summary */}
										<div className="grid grid-cols-3 gap-3 mb-4">
											<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
												<p className="text-gray-400 text-xs mb-1">Total Paid</p>
												<p className="text-green-400 font-bold">{formatCurrency(totalPaid)}</p>
											</div>
											<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
												<p className="text-gray-400 text-xs mb-1">Total Owes</p>
												<p className="text-red-400 font-bold">{formatCurrency(totalOwed)}</p>
											</div>
											<div className={`p-3 rounded-lg ${
												memberBalance && memberBalance.balance > 0
													? "bg-green-500/10 border-green-500/30"
													: memberBalance && memberBalance.balance < 0
														? "bg-red-500/10 border-red-500/30"
														: "bg-gray-800/50 border-gray-700"
											} border`}>
												<p className="text-gray-400 text-xs mb-1">Balance</p>
												<p className={`font-bold ${
													memberBalance && memberBalance.balance > 0
														? "text-green-400"
														: memberBalance && memberBalance.balance < 0
															? "text-red-400"
															: "text-gray-300"
												}`}>
													{memberBalance ? formatCurrency(memberBalance.balance) : "₹0"}
												</p>
											</div>
										</div>

										{/* Transactions List */}
										<div className="space-y-3">
											{memberExpenses.map((expense) => {
												const paidByUser = typeof expense.paidBy === "object" && expense.paidBy
													? expense.paidBy
													: null;
												const paidById = paidByUser?._id || "";
												const isPayer = paidById === selectedMemberForTransactions;

												const memberSplit = expense.splits.find((s) => {
													const splitUserId = typeof s.userId === "object" && s.userId
														? s.userId._id
														: s.userId;
													return splitUserId === selectedMemberForTransactions;
												});

												return (
													<div
														key={expense._id}
														onClick={() => {
															setIsMemberTransactionsOpen(false);
															setSelectedExpense(expense);
															setIsExpenseDetailOpen(true);
														}}
														className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
													>
														<div className="flex items-start justify-between">
															<div className="flex-1">
																<div className="flex items-center gap-2 mb-1">
																	<h4 className="text-white font-medium text-sm">
																		{expense.description}
																	</h4>
																	{expense.category && (
																		<span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">
																			{expense.category}
																		</span>
																	)}
																</div>
																<p className="text-gray-400 text-xs">
																	{new Date(expense.createdAt).toLocaleDateString("en-IN", {
																		day: "numeric",
																		month: "short",
																		year: "numeric",
																	})}
																</p>
															</div>
															<div className="text-right">
																{isPayer && (
																	<p className="text-green-400 text-sm font-medium">
																		+{formatCurrency(expense.amount)}
																	</p>
																)}
																{memberSplit && (
																	<p className="text-red-400 text-sm font-medium">
																		-{formatCurrency(memberSplit.amount)}
																	</p>
																)}
															</div>
														</div>
														<div className="flex items-center justify-between mt-2 text-xs">
															<span className="text-gray-500">
																{isPayer ? "Paid by them" : `Paid by ${paidByUser?.name || "Unknown"}`}
															</span>
															<span className="text-gray-500">
																Split: {expense.splits.length} {expense.splits.length === 1 ? "person" : "people"}
															</span>
														</div>
													</div>
												);
											})}
										</div>
									</>
								);
							})()}
						</div>
					</DialogContent>
				</Dialog>

				{/* Floating Add Expense Button */}
				<motion.button
					onClick={() => setIsExpenseDialogOpen(true)}
					className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all z-50"
					style={{
						maxWidth: 'calc(100vw - 2rem)',
						marginBottom: 'env(safe-area-inset-bottom, 0px)'
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
				>
					<Plus className="w-5 h-5 sm:w-6 sm:h-6" />
				</motion.button>
			</div>
		</div>
	);
}
