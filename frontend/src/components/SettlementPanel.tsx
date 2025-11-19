"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	DollarSign,
	Users,
	ArrowRight,
	ExternalLink,
	Copy,
	Check,
	Smartphone,
	Banknote,
	Building2,
	MoreHorizontal,
} from "lucide-react";
import { Settlement, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { generateUpiDeepLink, getUpiProvider, openUpiPayment, generateTransactionRef } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";
import { emitUserActivity } from "@/lib/socket";

interface SettlementPanelProps {
	groupId: string;
	groupName: string;
	settlements: Settlement[];
	users: Record<string, User>;
	currentUserId: string;
	onMarkAsPaid?: (
		from: string,
		to: string,
		amount: number,
		paymentMethod?: "UPI" | "Cash" | "Bank Transfer" | "Other",
		notes?: string
	) => void;
}

export function SettlementPanel({
	groupId,
	groupName,
	settlements,
	users,
	currentUserId,
	onMarkAsPaid,
}: SettlementPanelProps) {
	const [copiedLink, setCopiedLink] = useState<string | null>(null);
	const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
	const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(
		null
	);
	const [paymentNotes, setPaymentNotes] = useState("");
	const [customAmount, setCustomAmount] = useState("");
	const [useCustomAmount, setUseCustomAmount] = useState(false);

	// Track user activity when making a payment
	useEffect(() => {
		// Small delay to ensure socket has joined group
		const timer = setTimeout(() => {
			if (showPaymentMethodSheet && selectedSettlement) {
				const payee = users[selectedSettlement.to];
				emitUserActivity(
					groupId,
					`Making a payment to ${payee?.name || "someone"}...`
				);
			} else if (!showPaymentMethodSheet) {
				emitUserActivity(groupId, null);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [showPaymentMethodSheet, selectedSettlement, groupId, users]);

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

		// After opening UPI app, ask user to confirm payment
		setTimeout(() => {
			setSelectedSettlement(settlement);
			setShowPaymentMethodSheet(true);
		}, 1000);
	};

	const handleManualPayment = (settlement: Settlement) => {
		setSelectedSettlement(settlement);
		setCustomAmount(settlement.amount.toString());
		setUseCustomAmount(false);
		setShowPaymentMethodSheet(true);
	};

	const handleConfirmPayment = (
		paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Other"
	) => {
		if (selectedSettlement && onMarkAsPaid) {
			// Use custom amount if provided, otherwise use suggested amount
			const amountToSettle = useCustomAmount
				? parseFloat(customAmount) || selectedSettlement.amount
				: selectedSettlement.amount;

			if (amountToSettle <= 0) {
				alert("Please enter a valid amount");
				return;
			}

			onMarkAsPaid(
				selectedSettlement.from,
				selectedSettlement.to,
				amountToSettle,
				paymentMethod,
				paymentNotes || undefined
			);
			setShowPaymentMethodSheet(false);
			setSelectedSettlement(null);
			setPaymentNotes("");
			setCustomAmount("");
			setUseCustomAmount(false);
		}
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
									{payee?.upiId && (
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
									)}
									<Button
										onClick={() => handleManualPayment(settlement)}
										variant={payee?.upiId ? "outline" : "default"}
										className={
											payee?.upiId
												? "border-gray-700"
												: "flex-1 bg-primary-600 hover:bg-primary-700"
										}
										size="sm"
									>
										{payee?.upiId ? (
											<MoreHorizontal className="w-4 h-4" />
										) : (
											"Mark as Paid"
										)}
									</Button>
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

			{/* Payment Method Bottom Sheet */}
			<BottomSheet
				isOpen={showPaymentMethodSheet}
				onClose={() => {
					setShowPaymentMethodSheet(false);
					setSelectedSettlement(null);
					setPaymentNotes("");
					setCustomAmount("");
					setUseCustomAmount(false);
				}}
				title="Settle Payment"
				subtitle={
					selectedSettlement
						? `To ${users[selectedSettlement.to]?.name}`
						: ""
				}
			>
				<div className="space-y-4 pb-6">
					{/* Amount Selection */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium text-gray-300">
								Amount to Settle
							</label>
							<button
								onClick={() => setUseCustomAmount(!useCustomAmount)}
								className="text-xs text-primary-400 hover:text-primary-300"
							>
								{useCustomAmount ? "Use suggested" : "Enter custom amount"}
							</button>
						</div>

						{useCustomAmount ? (
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
									₹
								</span>
								<Input
									type="number"
									step="0.01"
									value={customAmount}
									onChange={(e) => setCustomAmount(e.target.value)}
									placeholder="Enter amount"
									className="bg-gray-800 border-gray-700 text-white pl-8 text-lg font-semibold"
								/>
							</div>
						) : (
							<div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30 text-center">
								<p className="text-2xl font-bold text-primary-400">
									₹{selectedSettlement?.amount.toFixed(2)}
								</p>
								<p className="text-xs text-gray-400 mt-1">Suggested amount</p>
							</div>
						)}
					</div>

					<p className="text-gray-400 text-sm">
						Select the payment method you used to settle this amount.
					</p>

					{/* Payment Method Buttons */}
					<div className="grid grid-cols-2 gap-3">
						<Button
							onClick={() => handleConfirmPayment("UPI")}
							variant="outline"
							disabled={
								!selectedSettlement ||
								!users[selectedSettlement.to]?.upiId
							}
							className="h-20 flex-col gap-2 border-gray-700 hover:border-primary-500 hover:bg-primary-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:bg-transparent"
						>
							<Smartphone className="w-6 h-6 text-primary-400" />
							<span>UPI</span>
							{selectedSettlement && !users[selectedSettlement.to]?.upiId && (
								<span className="text-xs text-red-400">Not available</span>
							)}
						</Button>

						<Button
							onClick={() => handleConfirmPayment("Cash")}
							variant="outline"
							className="h-20 flex-col gap-2 border-gray-700 hover:border-green-500 hover:bg-green-500/10"
						>
							<Banknote className="w-6 h-6 text-green-400" />
							<span>Cash</span>
						</Button>

						<Button
							onClick={() => handleConfirmPayment("Bank Transfer")}
							variant="outline"
							className="h-20 flex-col gap-2 border-gray-700 hover:border-blue-500 hover:bg-blue-500/10"
						>
							<Building2 className="w-6 h-6 text-blue-400" />
							<span>Bank Transfer</span>
						</Button>

						<Button
							onClick={() => handleConfirmPayment("Other")}
							variant="outline"
							className="h-20 flex-col gap-2 border-gray-700 hover:border-purple-500 hover:bg-purple-500/10"
						>
							<MoreHorizontal className="w-6 h-6 text-purple-400" />
							<span>Other</span>
						</Button>
					</div>

					{/* Optional Notes */}
					<div className="space-y-2">
						<label className="text-sm text-gray-300">
							Notes (optional)
						</label>
						<Input
							value={paymentNotes}
							onChange={(e) => setPaymentNotes(e.target.value)}
							placeholder="Add any notes about this payment..."
							className="bg-gray-800 border-gray-700 text-white"
						/>
					</div>
				</div>
			</BottomSheet>
		</div>
	);
}
