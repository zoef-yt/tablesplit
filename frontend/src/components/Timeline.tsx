"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Receipt,
	CheckCircle2,
	PartyPopper,
	Calendar,
	IndianRupee,
	X,
	Users,
} from "lucide-react";
import { Expense, SettlementRecord as SettlementType, User } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface TimelineEvent {
	id: string;
	type: "expense" | "settlement" | "settled_marker";
	date: Date;
	data?: any;
}

interface TimelineProps {
	expenses: Expense[];
	settlements: SettlementType[];
	users: Record<string, User>;
	currentUserId: string;
}

export function Timeline({
	expenses,
	settlements,
	users,
	currentUserId,
}: TimelineProps) {
	const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
		null,
	);

	// Merge expenses and settlements into timeline events
	const events: TimelineEvent[] = [
		...expenses.map((expense) => ({
			id: expense._id,
			type: "expense" as const,
			date: new Date(expense.createdAt),
			data: expense,
		})),
		...settlements.map((settlement) => ({
			id: settlement._id,
			type: "settlement" as const,
			date: new Date(settlement.settledAt),
			data: settlement,
		})),
	].sort((a, b) => b.date.getTime() - a.date.getTime());

	// Group events by settlement periods
	const timelinePeriods: TimelineEvent[][] = [];
	let currentPeriod: TimelineEvent[] = [];

	for (const event of events) {
		currentPeriod.push(event);

		// Check if this is a settlement that might close a period
		if (event.type === "settlement") {
			// Add a settled marker if all debts are cleared
			// (simplified - you could add more complex logic here)
			const hasMoreExpensesAfter = events.some(
				(e) =>
					e.date > event.date &&
					e.type === "expense" &&
					!currentPeriod.some((p) => p.id === e.id),
			);

			if (!hasMoreExpensesAfter && currentPeriod.length > 1) {
				currentPeriod.push({
					id: `settled-${event.id}`,
					type: "settled_marker",
					date: event.date,
				});
			}
		}
	}

	if (currentPeriod.length > 0) {
		timelinePeriods.push(currentPeriod);
	}

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	const renderEventCard = (event: TimelineEvent) => {
		if (event.type === "settled_marker") {
			return (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className="flex items-center justify-center py-6"
				>
					<div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
						<PartyPopper className="w-5 h-5 text-green-400" />
						<span className="text-green-400 font-medium">All Settled!</span>
					</div>
				</motion.div>
			);
		}

		if (event.type === "expense") {
			const expense = event.data as Expense;
			const paidBy =
				typeof expense.paidBy === "object" && expense.paidBy
					? expense.paidBy
					: null;
			const paidByName = paidBy?.name || "Unknown";
			const isCurrentUser = paidBy?._id === currentUserId;

			return (
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					onClick={() => setSelectedEvent(event)}
					className="relative pl-8 pb-8 cursor-pointer group"
				>
					{/* Timeline dot */}
					<div className="absolute left-0 top-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-500/20 group-hover:ring-8 transition-all" />

					{/* Timeline line */}
					<div className="absolute left-[5px] top-4 w-[2px] h-[calc(100%-1rem)] bg-gradient-to-b from-blue-500/50 to-transparent" />

					{/* Event card */}
					<div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-all group-hover:bg-gray-900/70">
						<div className="flex items-start justify-between mb-2">
							<div className="flex items-center gap-2">
								<Receipt className="w-5 h-5 text-blue-400" />
								<span className="text-white font-medium">
									{expense.description}
								</span>
							</div>
							<span className="text-xl font-bold text-white">
								₹{expense.amount.toFixed(2)}
							</span>
						</div>

						<div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
							<span>
								Paid by {paidByName}
								{isCurrentUser && " (You)"}
							</span>
						</div>

						{expense.category && (
							<div className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded mb-2">
								{expense.category}
							</div>
						)}

						<div className="flex items-center gap-1 text-xs text-gray-500">
							<Calendar className="w-3 h-3" />
							{formatDate(event.date)}
						</div>
					</div>
				</motion.div>
			);
		}

		if (event.type === "settlement") {
			const settlement = event.data as SettlementType;
			const fromUser =
				typeof settlement.fromUserId === "object" && settlement.fromUserId
					? settlement.fromUserId
					: null;
			const toUser =
				typeof settlement.toUserId === "object" && settlement.toUserId
					? settlement.toUserId
					: null;

			const fromName = fromUser?.name || "Unknown";
			const toName = toUser?.name || "Unknown";
			const isCurrentUserInvolved =
				fromUser?._id === currentUserId || toUser?._id === currentUserId;

			return (
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					onClick={() => setSelectedEvent(event)}
					className="relative pl-8 pb-8 cursor-pointer group"
				>
					{/* Timeline dot */}
					<div className="absolute left-0 top-1 w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-500/20 group-hover:ring-8 transition-all" />

					{/* Timeline line */}
					<div className="absolute left-[5px] top-4 w-[2px] h-[calc(100%-1rem)] bg-gradient-to-b from-green-500/50 to-transparent" />

					{/* Event card */}
					<div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-green-500/50 transition-all group-hover:bg-gray-900/70">
						<div className="flex items-start justify-between mb-2">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-5 h-5 text-green-400" />
								<span className="text-white font-medium">Payment Settled</span>
							</div>
							<span className="text-xl font-bold text-green-400">
								₹{settlement.amount.toFixed(2)}
							</span>
						</div>

						<div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
							<span>{fromName}</span>
							<span className="text-gray-500">→</span>
							<span>{toName}</span>
							{isCurrentUserInvolved && (
								<span className="text-green-400 text-xs">(You)</span>
							)}
						</div>

						{settlement.paymentMethod && (
							<div className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded mb-2">
								via {settlement.paymentMethod}
							</div>
						)}

						<div className="flex items-center gap-1 text-xs text-gray-500">
							<Calendar className="w-3 h-3" />
							{formatDate(event.date)}
						</div>
					</div>
				</motion.div>
			);
		}

		return null;
	};

	const renderEventDetails = (event: TimelineEvent) => {
		if (event.type === "expense") {
			const expense = event.data as Expense;
			const paidBy =
				typeof expense.paidBy === "object" && expense.paidBy
					? expense.paidBy
					: null;

			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-xl font-bold text-white">
								{expense.description}
							</h3>
							{expense.category && (
								<span className="text-sm text-gray-400">{expense.category}</span>
							)}
						</div>
						<div className="text-2xl font-bold text-white">
							₹{expense.amount.toFixed(2)}
						</div>
					</div>

					<div className="border-t border-gray-800 pt-4">
						<h4 className="text-sm font-medium text-gray-400 mb-2">
							Paid by
						</h4>
						<p className="text-white">{paidBy?.name || "Unknown"}</p>
					</div>

					<div className="border-t border-gray-800 pt-4">
						<h4 className="text-sm font-medium text-gray-400 mb-3">
							Split Between {expense.splits.length} People
						</h4>
						<div className="space-y-2">
							{expense.splits.map((split) => {
								const splitUser =
									typeof split.userId === "object" && split.userId
										? split.userId
										: null;
								return (
									<div
										key={split.userId.toString()}
										className="flex items-center justify-between bg-gray-800/50 p-2 rounded"
									>
										<span className="text-white">
											{splitUser?.name || "Unknown"}
										</span>
										<span className="text-gray-400">
											₹{split.amount.toFixed(2)} ({split.percentage.toFixed(1)}
											%)
										</span>
									</div>
								);
							})}
						</div>
					</div>

					<div className="border-t border-gray-800 pt-4">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							{formatDate(event.date)}
						</div>
					</div>
				</div>
			);
		}

		if (event.type === "settlement") {
			const settlement = event.data as SettlementType;
			const fromUser =
				typeof settlement.fromUserId === "object" && settlement.fromUserId
					? settlement.fromUserId
					: null;
			const toUser =
				typeof settlement.toUserId === "object" && settlement.toUserId
					? settlement.toUserId
					: null;

			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-bold text-white">Payment Settled</h3>
						<div className="text-2xl font-bold text-green-400">
							₹{settlement.amount.toFixed(2)}
						</div>
					</div>

					<div className="border-t border-gray-800 pt-4">
						<div className="flex items-center justify-center gap-4 py-6">
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
									<Users className="w-8 h-8 text-gray-400" />
								</div>
								<p className="text-white font-medium">{fromUser?.name}</p>
								<p className="text-xs text-gray-500">Paid</p>
							</div>

							<div className="flex-1 flex items-center justify-center">
								<div className="h-[2px] w-full bg-gradient-to-r from-gray-800 via-green-500 to-gray-800 relative">
									<IndianRupee className="w-6 h-6 text-green-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-1 rounded-full" />
								</div>
							</div>

							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
									<Users className="w-8 h-8 text-gray-400" />
								</div>
								<p className="text-white font-medium">{toUser?.name}</p>
								<p className="text-xs text-gray-500">Received</p>
							</div>
						</div>
					</div>

					{settlement.paymentMethod && (
						<div className="border-t border-gray-800 pt-4">
							<h4 className="text-sm font-medium text-gray-400 mb-2">
								Payment Method
							</h4>
							<p className="text-white">{settlement.paymentMethod}</p>
						</div>
					)}

					{settlement.notes && (
						<div className="border-t border-gray-800 pt-4">
							<h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
							<p className="text-white">{settlement.notes}</p>
						</div>
					)}

					<div className="border-t border-gray-800 pt-4">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							{formatDate(event.date)}
						</div>
					</div>
				</div>
			);
		}

		return null;
	};

	if (events.length === 0) {
		return (
			<div className="text-center py-12">
				<Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
				<p className="text-gray-400">No activity yet</p>
				<p className="text-gray-500 text-sm">
					Start by adding an expense to see the timeline
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="relative max-w-3xl mx-auto">
				{events.map((event) => (
					<div key={event.id}>{renderEventCard(event)}</div>
				))}
			</div>

			{/* Event Details Modal */}
			<Dialog
				open={selectedEvent !== null}
				onOpenChange={(open) => !open && setSelectedEvent(null)}
			>
				<DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-white">Event Details</DialogTitle>
					</DialogHeader>
					{selectedEvent && renderEventDetails(selectedEvent)}
				</DialogContent>
			</Dialog>
		</>
	);
}
