"use client";

import { motion } from "framer-motion";
import { X, Receipt, Users, Calendar, Tag, Trash2, Edit2, IndianRupee } from "lucide-react";
import { Expense, User } from "@/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface ExpenseDetailModalProps {
	expense: Expense | null;
	isOpen: boolean;
	onClose: () => void;
	currentUserId: string;
	onDelete?: (expenseId: string) => void;
	onEdit?: (expense: Expense) => void;
}

export function ExpenseDetailModal({
	expense,
	isOpen,
	onClose,
	currentUserId,
	onDelete,
	onEdit,
}: ExpenseDetailModalProps) {
	if (!expense) return null;

	const paidByUser =
		typeof expense.paidBy === "object" && expense.paidBy
			? expense.paidBy
			: null;
	const paidByName = paidByUser?.name || "Unknown";
	const isPaidByMe = paidByUser?._id === currentUserId;

	const handleDelete = () => {
		if (onDelete) {
			const confirmed = confirm(
				`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`,
			);
			if (confirmed) {
				onDelete(expense._id);
				onClose();
			}
		}
	};

	const handleEdit = () => {
		if (onEdit) {
			onEdit(expense);
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-white text-xl flex items-center gap-2">
							<Receipt className="w-5 h-5 text-primary-500" />
							Expense Details
						</DialogTitle>
						<button
							onClick={onClose}
							className="p-1 hover:bg-gray-800 rounded-full transition-colors"
						>
							<X className="w-5 h-5 text-gray-400" />
						</button>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Main Info */}
					<div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
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

					{/* Split Details */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-lg font-bold text-white flex items-center gap-2">
								<Users className="w-5 h-5 text-primary-500" />
								Split Between {expense.splits.length}{" "}
								{expense.splits.length === 1 ? "Person" : "People"}
							</h4>
							<span className="text-sm text-gray-400">
								₹{(expense.amount / expense.splits.length).toFixed(2)} each
							</span>
						</div>

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
					</div>

					{/* Action Buttons */}
					{isPaidByMe && (
						<div className="flex gap-2 pt-4 border-t border-gray-700">
							{onEdit && (
								<Button
									onClick={handleEdit}
									variant="outline"
									className="flex-1 border-gray-700 hover:bg-gray-800"
								>
									<Edit2 className="w-4 h-4 mr-2" />
									Edit Expense
								</Button>
							)}
							{onDelete && (
								<Button
									onClick={handleDelete}
									variant="outline"
									className="flex-1 border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Delete Expense
								</Button>
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
