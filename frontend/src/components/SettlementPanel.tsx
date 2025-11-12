"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Users, ArrowRight, ExternalLink, Copy, Check } from "lucide-react";
import { Settlement, User } from "@/types";
import { Button } from "@/components/ui/button";
import { generateUpiDeepLink, getUpiProvider, openUpiPayment, generateTransactionRef } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";

interface SettlementPanelProps {
	groupId: string;
	groupName: string;
	settlements: Settlement[];
	users: Record<string, User>;
	currentUserId: string;
	onMarkAsPaid?: (from: string, to: string, amount: number) => void;
}

export function SettlementPanel({
	groupName,
	settlements,
	users,
	currentUserId,
	onMarkAsPaid,
}: SettlementPanelProps) {
	const [copiedLink, setCopiedLink] = useState<string | null>(null);

	const mySettlements = settlements.filter(
		(s) => s.from === currentUserId || s.to === currentUserId,
	);

	const handleUpiPayment = (settlement: Settlement) => {
		const payee = users[settlement.to];

		if (!payee?.upiId) {
			alert(
				`${payee?.name || "User"} hasn't set up their UPI ID yet. Ask them to add it in their profile.`,
			);
			return;
		}

		const upiLink = generateUpiDeepLink({
			pa: payee.upiId,
			pn: payee.name,
			am: settlement.amount,
			tn: `TableSplit - ${groupName}`,
			tr: generateTransactionRef(),
		});

		openUpiPayment(upiLink);
	};

	const handleCopyUpiLink = (settlement: Settlement) => {
		const payee = users[settlement.to];

		if (!payee?.upiId) {
			alert(`${payee?.name || "User"} hasn't set up their UPI ID yet.`);
			return;
		}

		const upiLink = generateUpiDeepLink({
			pa: payee.upiId,
			pn: payee.name,
			am: settlement.amount,
			tn: `TableSplit - ${groupName}`,
			tr: generateTransactionRef(),
		});

		navigator.clipboard.writeText(upiLink);
		setCopiedLink(settlement.from + settlement.to);
		setTimeout(() => setCopiedLink(null), 2000);
	};

	const handleMarkPaid = (settlement: Settlement) => {
		if (onMarkAsPaid) {
			const confirmed = confirm(
				`Mark payment of ₹${settlement.amount.toFixed(2)} as paid?`,
			);
			if (confirmed) {
				onMarkAsPaid(settlement.from, settlement.to, settlement.amount);
			}
		}
	};

	if (settlements.length === 0) {
		return (
			<div className="text-center py-12">
				<Users className="w-12 h-12 text-green-500 mx-auto mb-3" />
				<h3 className="text-xl font-bold text-white mb-2">All Settled Up!</h3>
				<p className="text-gray-400">Everyone is square. Time to add more expenses! 🎉</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-bold text-white flex items-center gap-2">
					<DollarSign className="w-5 h-5 text-primary-500" />
					Settlements
				</h3>
				<span className="text-sm text-gray-400">
					{mySettlements.length} pending
				</span>
			</div>

			<AnimatePresence>
				{settlements.map((settlement, index) => {
					const payer = users[settlement.from];
					const payee = users[settlement.to];
					const isMyPayment = settlement.from === currentUserId;
					const isPayingMe = settlement.to === currentUserId;

					return (
						<motion.div
							key={`${settlement.from}-${settlement.to}`}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ delay: index * 0.1 }}
							className={`p-4 rounded-xl border ${
								isMyPayment
									? "bg-red-500/10 border-red-500/30"
									: isPayingMe
										? "bg-green-500/10 border-green-500/30"
										: "bg-gray-800/50 border-gray-700"
							}`}
						>
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3 flex-1">
									<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
										{payer?.name?.charAt(0).toUpperCase() || "?"}
									</div>
									<ArrowRight className="w-4 h-4 text-gray-500" />
									<div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
										{payee?.name?.charAt(0).toUpperCase() || "?"}
									</div>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold text-white">
										₹{settlement.amount.toFixed(2)}
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between text-sm mb-3">
								<span className="text-gray-400">
									{payer?.name || "Unknown"} → {payee?.name || "Unknown"}
								</span>
								{payee?.upiId && (
									<span className="text-xs text-primary-400">
										{getUpiProvider(payee.upiId)}
									</span>
								)}
							</div>

							{isMyPayment && (
								<div className="flex gap-2">
									{payee?.upiId ? (
										<>
											<Button
												onClick={() => handleUpiPayment(settlement)}
												className="flex-1 bg-primary-600 hover:bg-primary-700 text-sm"
												size="sm"
											>
												<ExternalLink className="w-4 h-4 mr-1" />
												Pay via UPI
											</Button>
											<Button
												onClick={() => handleCopyUpiLink(settlement)}
												variant="outline"
												className="border-gray-700"
												size="sm"
											>
												{copiedLink === settlement.from + settlement.to ? (
													<Check className="w-4 h-4" />
												) : (
													<Copy className="w-4 h-4" />
												)}
											</Button>
										</>
									) : (
										<Button
											onClick={() => handleMarkPaid(settlement)}
											variant="outline"
											className="flex-1 border-gray-700 text-sm"
											size="sm"
										>
											Mark as Paid
										</Button>
									)}
								</div>
							)}

							{isPayingMe && (
								<div className="text-sm text-green-400">
									Waiting for payment...
								</div>
							)}
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}
