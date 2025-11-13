"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	X,
	Receipt,
	Users,
	Calendar,
	Tag,
	Trash2,
	Edit2,
	IndianRupee,
	Save,
	XCircle,
	Loader2,
} from "lucide-react";
import { Expense, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
	useDeleteExpense,
	useUpdateExpense,
	useSettlementHistory,
} from "@/lib/hooks/useExpenses";

interface ExpenseDetailModalProps {
	expense: Expense | null;
	isOpen: boolean;
	onClose: () => void;
	currentUserId: string;
	groupId: string;
	groupMembers: User[];
}

export function ExpenseDetailModal({
	expense,
	isOpen,
	onClose,
	currentUserId,
	groupId,
	groupMembers,
}: ExpenseDetailModalProps) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editDescription, setEditDescription] = useState("");
	const [editAmount, setEditAmount] = useState("");
	const [editCategory, setEditCategory] = useState("");
	const [editSelectedMembers, setEditSelectedMembers] = useState<string[]>([]);

	const deleteExpenseMutation = useDeleteExpense(groupId);
	const updateExpenseMutation = useUpdateExpense(groupId);
	const { data: settlementHistory = [] } = useSettlementHistory(groupId);

	useEffect(() => {
		if (expense) {
			setEditDescription(expense.description);
			setEditAmount(expense.amount.toString());
			setEditCategory(expense.category || "");
			setEditSelectedMembers(
				expense.splits.map((s) =>
					typeof s.userId === "object" ? s.userId._id : s.userId,
				),
			);
		}
	}, [expense]);

	if (!expense) return null;

	const paidByUser =
		typeof expense.paidBy === "object" && expense.paidBy
			? expense.paidBy
			: null;
	const paidByName = paidByUser?.name || "Unknown";
	const isPaidByMe = paidByUser?._id === currentUserId;

	const handleDelete = async () => {
		let message = `Are you sure you want to delete "${expense.description}"? This will reverse all balance changes.`;

		// Add warning if settlements have been made
		if (settlementHistory.length > 0) {
			message += "\n\n⚠️ Warning: Settlements have been made in this group. Deleting this expense will affect balances even after settlements.";
		}

		const confirmed = confirm(message);
		if (confirmed) {
			try {
				await deleteExpenseMutation.mutateAsync(expense._id);
				onClose();
			} catch (error) {
				alert(
					error instanceof Error
						? error.message
						: "Failed to delete expense",
				);
			}
		}
	};

	const handleSaveEdit = async () => {
		if (!editDescription.trim()) {
			alert("Description is required");
			return;
		}

		const amount = parseFloat(editAmount);
		if (isNaN(amount) || amount <= 0) {
			alert("Please enter a valid amount");
			return;
		}

		if (editSelectedMembers.length === 0) {
			alert("Please select at least one person to split with");
			return;
		}

		// Warn if settlements have been made
		if (settlementHistory.length > 0) {
			const confirmed = confirm(
				"⚠️ Settlements have been made in this group. Editing this expense will affect balances even after settlements. Are you sure you want to continue?",
			);
			if (!confirmed) {
				return;
			}
		}

		try {
			await updateExpenseMutation.mutateAsync({
				expenseId: expense._id,
				description: editDescription,
				amount,
				category: editCategory || undefined,
				selectedMembers: editSelectedMembers,
			});
			setIsEditMode(false);
			onClose();
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "Failed to update expense",
			);
		}
	};

	const handleCancelEdit = () => {
		// Reset to original values
		setEditDescription(expense.description);
		setEditAmount(expense.amount.toString());
		setEditCategory(expense.category || "");
		setEditSelectedMembers(
			expense.splits.map((s) =>
				typeof s.userId === "object" ? s.userId._id : s.userId,
			),
		);
		setIsEditMode(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90dvh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<div className="flex items-center justify-between">
						<DialogTitle className="text-white text-xl flex items-center gap-2">
							<Receipt className="w-5 h-5 text-primary-500" />
							{isEditMode ? "Edit Expense" : "Expense Details"}
						</DialogTitle>
						<button
							onClick={onClose}
							className="p-1 hover:bg-gray-800 rounded-full transition-colors"
						>
							<X className="w-5 h-5 text-gray-400" />
						</button>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-2">
					{/* Main Info */}
					<div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
						{isEditMode ? (
							<div className="space-y-4">
								<div>
									<label className="text-gray-300 text-sm font-medium block mb-2">
										Description
									</label>
									<Input
										value={editDescription}
										onChange={(e) => setEditDescription(e.target.value)}
										placeholder="Description"
										className="bg-gray-900 border-gray-700 text-white"
									/>
								</div>
								<div>
									<label className="text-gray-300 text-sm font-medium block mb-2">
										Amount (₹)
									</label>
									<Input
										type="number"
										step="0.01"
										value={editAmount}
										onChange={(e) => setEditAmount(e.target.value)}
										placeholder="0.00"
										className="bg-gray-900 border-gray-700 text-white"
									/>
								</div>
								<div>
									<label className="text-gray-300 text-sm font-medium block mb-2">
										Category (Optional)
									</label>
									<Input
										value={editCategory}
										onChange={(e) => setEditCategory(e.target.value)}
										placeholder="Food, Transport, etc."
										className="bg-gray-900 border-gray-700 text-white"
									/>
								</div>
							</div>
						) : (
							<div>
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<h3 className="text-2xl font-bold text-white mb-2">
											{expense.description}
										</h3>
										{expense.category && (
											<div className="flex items-center gap-2 mb-2">
												<Tag className="w-4 h-4 text-primary-400" />
												<span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-sm rounded">
													{expense.category}
												</span>
											</div>
										)}
										<div className="flex items-center gap-2 text-gray-400 text-sm">
											<Calendar className="w-4 h-4" />
											<span>
												{new Date(expense.createdAt).toLocaleString("en-IN", {
													day: "numeric",
													month: "long",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
									</div>
									<div className="text-right">
										<div className="flex items-center gap-1 text-3xl font-bold text-white">
											<IndianRupee className="w-7 h-7" />
											<span>{expense.amount.toFixed(2)}</span>
										</div>
									</div>
								</div>

								<div className="pt-3 border-t border-gray-700">
									<p className="text-gray-400 text-sm mb-1">Paid by</p>
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-sm">
											{paidByName.charAt(0).toUpperCase()}
										</div>
										<span className="text-white font-medium">
											{paidByName}
											{isPaidByMe && " (You)"}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Split Details */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-lg font-bold text-white flex items-center gap-2">
								<Users className="w-5 h-5 text-primary-500" />
								{isEditMode ? (
									<>Split with ({editSelectedMembers.length} selected)</>
								) : (
									<>
										Split Between {expense.splits.length}{" "}
										{expense.splits.length === 1 ? "Person" : "People"}
									</>
								)}
							</h4>
							{!isEditMode && (
								<span className="text-sm text-gray-400">
									₹
									{(
										parseFloat(editAmount || expense.amount.toString()) /
										(isEditMode
											? editSelectedMembers.length || 1
											: expense.splits.length)
									).toFixed(2)}{" "}
									each
								</span>
							)}
						</div>

						{isEditMode ? (
							<div className="space-y-2 max-h-64 overflow-y-auto bg-gray-800/50 rounded p-2">
								{groupMembers.map((member) => (
									<label
										key={member._id}
										className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
									>
										<input
											type="checkbox"
											checked={editSelectedMembers.includes(member._id)}
											onChange={(e) => {
												if (e.target.checked) {
													setEditSelectedMembers([
														...editSelectedMembers,
														member._id,
													]);
												} else {
													setEditSelectedMembers(
														editSelectedMembers.filter(
															(id) => id !== member._id,
														),
													);
												}
											}}
											className="w-4 h-4 accent-primary-500"
										/>
										<span className="text-white text-sm">
											{member.name}
											{member._id === currentUserId && " (You)"}
										</span>
									</label>
								))}
							</div>
						) : (
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{expense.splits.map((split, index) => {
									const splitUser =
										typeof split.userId === "object" && split.userId
											? split.userId
											: null;
									const splitUserName = splitUser?.name || "Unknown User";
									const splitUserId =
										typeof split.userId === "object" && split.userId
											? split.userId._id
											: split.userId;
									const isMe = splitUserId === currentUserId;

									return (
										<motion.div
											key={`${splitUserId}-${index}`}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.05 }}
											className={`p-3 rounded-lg border ${
												isMe
													? "bg-primary-500/10 border-primary-500/30"
													: "bg-gray-800/50 border-gray-700/50"
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div
														className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
															isMe
																? "bg-primary-500/20 text-primary-400"
																: "bg-gray-700 text-white"
														}`}
													>
														{splitUserName.charAt(0).toUpperCase()}
													</div>
													<div>
														<p className="text-white font-medium">
															{splitUserName}
															{isMe && " (You)"}
														</p>
														<p className="text-gray-400 text-sm">
															{split.percentage.toFixed(1)}% of total
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="text-xl font-bold text-white">
														₹{split.amount.toFixed(2)}
													</p>
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>
						)}
					</div>

					{/* WHO OWES WHAT - CLEAR BREAKDOWN */}
					{!isEditMode && (
						<div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-2 border-primary-500/30">
							<h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
								<IndianRupee className="w-5 h-5 text-primary-400" />
								Who Owes What
							</h4>
							<div className="space-y-3">
								{/* Who Paid */}
								<div className="p-3 rounded-lg bg-gray-900/50">
									<p className="text-sm text-gray-400 mb-1">Paid by:</p>
									<p className="text-lg font-bold text-green-400">
										{paidByUser?.name || "Unknown"}{" "}
										{paidByUser?._id === currentUserId && "(You)"} paid ₹
										{expense.amount.toFixed(2)}
									</p>
								</div>

								{/* Who Owes */}
								<div className="space-y-2">
									<p className="text-sm text-gray-400">Breakdown:</p>
									{expense.splits.map((split, index) => {
										const splitUser =
											typeof split.userId === "object" && split.userId
												? split.userId
												: null;
										const splitUserId =
											typeof split.userId === "object" && split.userId
												? split.userId._id
												: split.userId;
										const splitUserName = splitUser?.name || "Unknown User";
										const isMe = splitUserId === currentUserId;
										const isPayer = paidByUser?._id === splitUserId;

										// Calculate what this person owes
										const owedAmount = isPayer
											? expense.amount - split.amount // Payer gets back from others
											: split.amount; // Others owe their share

										if (isPayer && expense.splits.length === 1) {
											// Only payer in the split
											return (
												<div
													key={index}
													className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
												>
													<p className="text-white">
														<span className="font-bold text-primary-400">
															{splitUserName}
															{isMe && " (You)"}
														</span>{" "}
														paid for themselves
													</p>
												</div>
											);
										} else if (isPayer) {
											// Payer gets money back
											return (
												<div
													key={index}
													className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
												>
													<p className="text-white">
														<span className="font-bold text-green-400">
															{splitUserName}
															{isMe && " (You)"}
														</span>{" "}
														should get back{" "}
														<span className="font-bold text-green-400">
															₹{owedAmount.toFixed(2)}
														</span>
													</p>
												</div>
											);
										} else {
											// Others owe money
											return (
												<div
													key={index}
													className={`p-3 rounded-lg ${
														isMe
															? "bg-red-500/10 border border-red-500/30"
															: "bg-gray-800/30 border border-gray-700/50"
													}`}
												>
													<p className="text-white">
														<span
															className={`font-bold ${
																isMe ? "text-red-400" : "text-gray-300"
															}`}
														>
															{splitUserName}
															{isMe && " (You)"}
														</span>{" "}
														owes{" "}
														<span
															className={`font-bold ${
																isMe ? "text-red-400" : "text-gray-300"
															}`}
														>
															₹{owedAmount.toFixed(2)}
														</span>{" "}
														to{" "}
														<span className="font-bold text-primary-400">
															{paidByUser?.name}
															{paidByUser?._id === currentUserId && " (You)"}
														</span>
													</p>
												</div>
											);
										}
									})}
								</div>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					{isPaidByMe && (
						<div className="flex gap-2 pt-4 border-t border-gray-700">
							{isEditMode ? (
								<>
									<Button
										onClick={handleSaveEdit}
										className="flex-1 bg-primary-600 hover:bg-primary-700"
										disabled={updateExpenseMutation.isPending}
									>
										{updateExpenseMutation.isPending ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="w-4 h-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
									<Button
										onClick={handleCancelEdit}
										variant="outline"
										className="flex-1 border-gray-700 hover:bg-gray-800"
										disabled={updateExpenseMutation.isPending}
									>
										<XCircle className="w-4 h-4 mr-2" />
										Cancel
									</Button>
								</>
							) : (
								<>
									<Button
										onClick={() => setIsEditMode(true)}
										variant="outline"
										className="flex-1 border-gray-700 hover:bg-gray-800"
									>
										<Edit2 className="w-4 h-4 mr-2" />
										Edit Expense
									</Button>
									<Button
										onClick={handleDelete}
										variant="outline"
										className="flex-1 border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
										disabled={deleteExpenseMutation.isPending}
									>
										{deleteExpenseMutation.isPending ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Deleting...
											</>
										) : (
											<>
												<Trash2 className="w-4 h-4 mr-2" />
												Delete Expense
											</>
										)}
									</Button>
								</>
							)}
						</div>
					)}

					{!isPaidByMe && (
						<p className="text-gray-500 text-sm text-center py-2">
							Only the person who paid can edit or delete this expense
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
