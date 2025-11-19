"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	History,
	Smartphone,
	Banknote,
	Building2,
	MoreHorizontal,
	ArrowRight,
	Calendar,
} from "lucide-react";
import { SettlementRecord, User } from "@/types";
import { staggerChildren, listItem } from "@/lib/animations";
import { formatDistanceToNow } from "date-fns";

interface SettlementHistoryProps {
	settlements: SettlementRecord[];
	users: Record<string, User>;
	currentUserId: string;
}

const paymentMethodIcons = {
	UPI: Smartphone,
	Cash: Banknote,
	"Bank Transfer": Building2,
	Other: MoreHorizontal,
};

const paymentMethodColors = {
	UPI: "text-primary-400 bg-primary-500/10",
	Cash: "text-green-400 bg-green-500/10",
	"Bank Transfer": "text-blue-400 bg-blue-500/10",
	Other: "text-purple-400 bg-purple-500/10",
};

export function SettlementHistory({
	settlements,
	users,
	currentUserId,
}: SettlementHistoryProps) {
	if (settlements.length === 0) {
		return (
			<div className="text-center py-12">
				<History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
				<h3 className="text-lg font-semibold text-white mb-2">
					No Settlement History
				</h3>
				<p className="text-gray-400 text-sm">
					Settlements you make will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<History className="w-5 h-5 text-primary-500" />
				<h3 className="text-lg font-bold text-white">Settlement History</h3>
				<span className="text-sm text-gray-400">({settlements.length})</span>
			</div>

			<motion.div
				variants={staggerChildren}
				initial="hidden"
				animate="visible"
				className="space-y-3"
			>
				<AnimatePresence>
					{settlements.map((settlement) => {
						const fromUser =
							typeof settlement.fromUserId === "object"
								? settlement.fromUserId
								: users[settlement.fromUserId];
						const toUser =
							typeof settlement.toUserId === "object"
								? settlement.toUserId
								: users[settlement.toUserId];

						const isPaidByMe =
							(typeof settlement.fromUserId === "object"
								? settlement.fromUserId._id
								: settlement.fromUserId) === currentUserId;

						const PaymentIcon = settlement.paymentMethod
							? paymentMethodIcons[settlement.paymentMethod]
							: null;

						const colorClass = settlement.paymentMethod
							? paymentMethodColors[settlement.paymentMethod]
							: "text-gray-400 bg-gray-800/50";

						return (
							<motion.div
								key={settlement._id}
								variants={listItem}
								className={`p-4 rounded-xl border ${
									isPaidByMe
										? "bg-primary-500/5 border-primary-500/20"
										: "bg-green-500/5 border-green-500/20"
								}`}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-3 flex-1">
										<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
											{fromUser?.name?.charAt(0).toUpperCase() || "?"}
										</div>
										<ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
										<div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
											{toUser?.name?.charAt(0).toUpperCase() || "?"}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-white font-medium text-sm truncate">
												{fromUser?.name || "Unknown"} → {toUser?.name || "Unknown"}
											</p>
											<div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
												<Calendar className="w-3 h-3" />
												<span>
													{formatDistanceToNow(new Date(settlement.settledAt), {
														addSuffix: true,
													})}
												</span>
											</div>
										</div>
									</div>
									<div className="text-right">
										<p className="text-lg font-bold text-white">
											₹{settlement.amount.toFixed(2)}
										</p>
									</div>
								</div>

								<div className="flex items-center justify-between">
									{settlement.paymentMethod && PaymentIcon && (
										<div
											className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass}`}
										>
											<PaymentIcon className="w-4 h-4" />
											<span className="text-xs font-medium">
												{settlement.paymentMethod}
											</span>
										</div>
									)}
									{!settlement.paymentMethod && (
										<span className="text-xs text-gray-500">
											No payment method recorded
										</span>
									)}
								</div>

								{settlement.notes && (
									<div className="mt-3 pt-3 border-t border-gray-800">
										<p className="text-sm text-gray-400 italic">
											&ldquo;{settlement.notes}&rdquo;
										</p>
									</div>
								)}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
