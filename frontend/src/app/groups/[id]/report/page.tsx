"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Printer,
	Download,
	Calendar,
	Users,
	Receipt,
	TrendingUp,
	TrendingDown,
	Minus,
	FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { Loader2 } from "lucide-react";

interface ExpenseSummary {
	group: {
		name: string;
		createdAt: string;
		memberCount: number;
	};
	members: Array<{
		_id: string;
		name: string;
		email: string;
		avatar?: string;
	}>;
	expenses: Array<{
		_id: string;
		date: string;
		description: string;
		amount: number;
		paidBy: {
			_id: string;
			name: string;
		};
		category?: string;
		splits: Array<{
			userId: string;
			userName: string;
			amount: number;
		}>;
		runningBalances: Record<string, number>;
	}>;
	settlements: Array<{
		_id: string;
		date: string;
		fromUser: {
			_id: string;
			name: string;
		};
		toUser: {
			_id: string;
			name: string;
		};
		amount: number;
		runningBalances: Record<string, number>;
	}>;
	finalBalances: Array<{
		userId: string;
		userName: string;
		balance: number;
	}>;
	totals: {
		totalExpenses: number;
		totalSettled: number;
		expenseCount: number;
		settlementCount: number;
	};
	memberBreakdowns: Array<{
		member: {
			_id: string;
			name: string;
			email: string;
		};
		transactions: Array<{
			date: string;
			description: string;
			cost: number;
			youPaid: number;
			yourShare: number;
			balance: number;
			type: "expense" | "settlement_sent" | "settlement_received";
		}>;
		totalPaid: number;
		totalShare: number;
		finalBalance: number;
	}>;
}

export default function ExpenseReportPage() {
	const params = useParams();
	const router = useRouter();
	const groupId = params.id as string;
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);

	const [summary, setSummary] = useState<ExpenseSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSummary = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/expenses/group/${groupId}/summary`);
			setSummary(response.data.data);
		} catch (err) {
			setError("Failed to load expense report");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isHydrated && !user) {
			router.push("/auth/login");
			return;
		}

		if (groupId && user) {
			fetchSummary();
		}
	}, [groupId, user, isHydrated, router]);

	const handlePrint = () => {
		window.print();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	if (!isHydrated || !user) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
					<p className="text-gray-400">Generating expense report...</p>
				</div>
			</div>
		);
	}

	if (error || !summary) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-400 mb-4">{error || "Failed to load report"}</p>
					<Button onClick={() => router.back()} variant="outline">
						Go Back
					</Button>
				</div>
			</div>
		);
	}

	// Combine expenses and settlements into timeline for the main table
	const timeline = [
		...summary.expenses.map((e) => ({ ...e, type: "expense" as const })),
		...summary.settlements.map((s) => ({
			...s,
			type: "settlement" as const,
			description: `${s.fromUser.name} paid ${s.toUser.name}`,
			amount: s.amount,
			paidBy: s.fromUser,
		})),
	].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return (
		<div className="min-h-screen bg-gray-950">
			{/* Header - Hidden in print */}
			<div className="print:hidden bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.back()}
							className="text-gray-400 hover:text-white"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
						<div>
							<h1 className="text-xl font-bold text-white">Expense Report</h1>
							<p className="text-sm text-gray-400">{summary.group.name}</p>
						</div>
					</div>
					<div className="flex gap-2">
						<Button
							onClick={handlePrint}
							className="bg-primary-600 hover:bg-primary-700"
						>
							<Printer className="w-4 h-4 mr-2" />
							Print Report
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
				{/* Report Header */}
				<div className="bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-2xl p-8 mb-8 print:bg-white print:rounded-none print:border-b-2 print:border-gray-200">
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center print:bg-gray-100">
									<FileText className="w-6 h-6 text-primary-400 print:text-gray-600" />
								</div>
								<div>
									<h2 className="text-2xl font-bold text-white print:text-gray-900">
										{summary.group.name}
									</h2>
									<p className="text-gray-400 print:text-gray-600">
										Expense Report
									</p>
								</div>
							</div>
							<div className="flex items-center gap-6 mt-4 text-sm">
								<div className="flex items-center gap-2 text-gray-300 print:text-gray-600">
									<Calendar className="w-4 h-4" />
									<span>
										Created {formatDate(summary.group.createdAt)}
									</span>
								</div>
								<div className="flex items-center gap-2 text-gray-300 print:text-gray-600">
									<Users className="w-4 h-4" />
									<span>{summary.group.memberCount} members</span>
								</div>
								<div className="flex items-center gap-2 text-gray-300 print:text-gray-600">
									<Receipt className="w-4 h-4" />
									<span>{summary.totals.expenseCount} expenses</span>
								</div>
							</div>
						</div>
						<div className="text-right">
							<p className="text-sm text-gray-400 print:text-gray-500">
								Report generated on
							</p>
							<p className="text-white font-medium print:text-gray-900">
								{formatDate(new Date().toISOString())}
							</p>
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 print:bg-gray-50 print:border-gray-200">
						<p className="text-sm text-gray-400 print:text-gray-500 mb-1">
							Total Expenses
						</p>
						<p className="text-2xl font-bold text-white print:text-gray-900">
							{formatCurrency(summary.totals.totalExpenses)}
						</p>
					</div>
					<div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 print:bg-gray-50 print:border-gray-200">
						<p className="text-sm text-gray-400 print:text-gray-500 mb-1">
							Total Settled
						</p>
						<p className="text-2xl font-bold text-green-400 print:text-green-600">
							{formatCurrency(summary.totals.totalSettled)}
						</p>
					</div>
					<div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 print:bg-gray-50 print:border-gray-200">
						<p className="text-sm text-gray-400 print:text-gray-500 mb-1">
							Transactions
						</p>
						<p className="text-2xl font-bold text-white print:text-gray-900">
							{summary.totals.expenseCount + summary.totals.settlementCount}
						</p>
					</div>
					<div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 print:bg-gray-50 print:border-gray-200">
						<p className="text-sm text-gray-400 print:text-gray-500 mb-1">
							Avg per Expense
						</p>
						<p className="text-2xl font-bold text-white print:text-gray-900">
							{formatCurrency(
								summary.totals.expenseCount > 0
									? summary.totals.totalExpenses / summary.totals.expenseCount
									: 0
							)}
						</p>
					</div>
				</div>

				{/* Final Balances */}
				<div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8 print:bg-white print:border-gray-200">
					<h3 className="text-lg font-semibold text-white print:text-gray-900 mb-4">
						Final Balances
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{summary.finalBalances.map((balance) => (
							<div
								key={balance.userId}
								className={`p-4 rounded-lg ${
									balance.balance > 0.01
										? "bg-green-500/10 border border-green-500/30 print:bg-green-50 print:border-green-200"
										: balance.balance < -0.01
										? "bg-red-500/10 border border-red-500/30 print:bg-red-50 print:border-red-200"
										: "bg-gray-800/50 border border-gray-700 print:bg-gray-50 print:border-gray-200"
								}`}
							>
								<p className="text-sm text-gray-300 print:text-gray-600 mb-1">
									{balance.userName}
								</p>
								<div className="flex items-center gap-2">
									{balance.balance > 0.01 ? (
										<TrendingUp className="w-4 h-4 text-green-400 print:text-green-600" />
									) : balance.balance < -0.01 ? (
										<TrendingDown className="w-4 h-4 text-red-400 print:text-red-600" />
									) : (
										<Minus className="w-4 h-4 text-gray-400" />
									)}
									<span
										className={`font-bold ${
											balance.balance > 0.01
												? "text-green-400 print:text-green-600"
												: balance.balance < -0.01
												? "text-red-400 print:text-red-600"
												: "text-gray-400 print:text-gray-500"
										}`}
									>
										{balance.balance > 0.01
											? `gets back ${formatCurrency(balance.balance)}`
											: balance.balance < -0.01
											? `owes ${formatCurrency(Math.abs(balance.balance))}`
											: "settled up"}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Main Expense Table */}
				<div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden mb-8 print:bg-white print:border-gray-200">
					<div className="p-4 border-b border-gray-800 print:border-gray-200">
						<h3 className="text-lg font-semibold text-white print:text-gray-900">
							All Transactions
						</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-gray-800/50 print:bg-gray-100">
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-300 print:text-gray-600">
										Date
									</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-300 print:text-gray-600">
										Description
									</th>
									<th className="text-right py-3 px-4 text-sm font-semibold text-gray-300 print:text-gray-600">
										Amount
									</th>
									{summary.members.map((member) => (
										<th
											key={member._id}
											className="text-right py-3 px-4 text-sm font-semibold text-gray-300 print:text-gray-600 whitespace-nowrap"
										>
											{member.name.split(" ")[0]}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{timeline.map((item, index) => (
									<tr
										key={item._id}
										className={`border-t border-gray-800/50 print:border-gray-200 ${
											item.type === "settlement"
												? "bg-green-500/5 print:bg-green-50"
												: ""
										}`}
									>
										<td className="py-3 px-4 text-sm text-gray-400 print:text-gray-600 whitespace-nowrap">
											{formatDate(item.date)}
										</td>
										<td className="py-3 px-4 text-sm text-white print:text-gray-900">
											<div>
												{item.description}
												{item.type === "expense" && (
													<span className="text-gray-500 text-xs ml-2">
														paid by {item.paidBy.name}
													</span>
												)}
											</div>
										</td>
										<td className="py-3 px-4 text-sm text-right font-medium text-white print:text-gray-900">
											{formatCurrency(item.amount)}
										</td>
										{summary.members.map((member) => {
											const balance = item.runningBalances[member._id] || 0;
											return (
												<td
													key={member._id}
													className={`py-3 px-4 text-sm text-right font-medium ${
														balance > 0.01
															? "text-green-400 print:text-green-600"
															: balance < -0.01
															? "text-red-400 print:text-red-600"
															: "text-gray-500"
													}`}
												>
													{balance !== 0
														? formatCurrency(balance)
														: "-"}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
							<tfoot>
								<tr className="bg-gray-800/50 print:bg-gray-100 border-t-2 border-gray-700 print:border-gray-300">
									<td
										colSpan={2}
										className="py-3 px-4 text-sm font-bold text-white print:text-gray-900"
									>
										Final Balance
									</td>
									<td className="py-3 px-4 text-sm text-right font-bold text-white print:text-gray-900">
										{formatCurrency(summary.totals.totalExpenses)}
									</td>
									{summary.members.map((member) => {
										const finalBalance =
											summary.finalBalances.find(
												(b) => b.userId === member._id
											)?.balance || 0;
										return (
											<td
												key={member._id}
												className={`py-3 px-4 text-sm text-right font-bold ${
													finalBalance > 0.01
														? "text-green-400 print:text-green-600"
														: finalBalance < -0.01
														? "text-red-400 print:text-red-600"
														: "text-gray-500"
												}`}
											>
												{finalBalance !== 0
													? formatCurrency(finalBalance)
													: "settled"}
											</td>
										);
									})}
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				{/* Individual Member Breakdowns */}
				<div className="space-y-8 print:break-before-page">
					<h3 className="text-xl font-bold text-white print:text-gray-900">
						Individual Breakdowns
					</h3>
					{summary.memberBreakdowns.map((breakdown) => (
						<div
							key={breakdown.member._id}
							className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden print:bg-white print:border-gray-200 print:break-inside-avoid"
						>
							<div className="p-4 border-b border-gray-800 print:border-gray-200 bg-gray-800/30 print:bg-gray-50">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="text-lg font-semibold text-white print:text-gray-900">
											{breakdown.member.name}
										</h4>
										<p className="text-sm text-gray-400 print:text-gray-500">
											{breakdown.member.email}
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-gray-400 print:text-gray-500">
											Final Balance
										</p>
										<p
											className={`text-lg font-bold ${
												breakdown.finalBalance > 0.01
													? "text-green-400 print:text-green-600"
													: breakdown.finalBalance < -0.01
													? "text-red-400 print:text-red-600"
													: "text-gray-400"
											}`}
										>
											{breakdown.finalBalance > 0.01
												? `gets back ${formatCurrency(breakdown.finalBalance)}`
												: breakdown.finalBalance < -0.01
												? `owes ${formatCurrency(Math.abs(breakdown.finalBalance))}`
												: "settled up"}
										</p>
									</div>
								</div>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="bg-gray-800/30 print:bg-gray-50">
											<th className="text-left py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												Date
											</th>
											<th className="text-left py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												Description
											</th>
											<th className="text-right py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												Cost
											</th>
											<th className="text-right py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												You Paid
											</th>
											<th className="text-right py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												Your Share
											</th>
											<th className="text-right py-2 px-4 text-xs font-semibold text-gray-400 print:text-gray-600">
												Balance
											</th>
										</tr>
									</thead>
									<tbody>
										{breakdown.transactions.map((tx, idx) => (
											<tr
												key={idx}
												className={`border-t border-gray-800/50 print:border-gray-200 ${
													tx.type !== "expense"
														? "bg-green-500/5 print:bg-green-50"
														: ""
												}`}
											>
												<td className="py-2 px-4 text-xs text-gray-400 print:text-gray-600 whitespace-nowrap">
													{formatDate(tx.date)}
												</td>
												<td className="py-2 px-4 text-xs text-white print:text-gray-900">
													{tx.description}
												</td>
												<td className="py-2 px-4 text-xs text-right text-gray-300 print:text-gray-700">
													{formatCurrency(tx.cost)}
												</td>
												<td className="py-2 px-4 text-xs text-right text-gray-300 print:text-gray-700">
													{tx.youPaid > 0
														? formatCurrency(tx.youPaid)
														: "-"}
												</td>
												<td className="py-2 px-4 text-xs text-right text-gray-300 print:text-gray-700">
													{formatCurrency(tx.yourShare)}
												</td>
												<td
													className={`py-2 px-4 text-xs text-right font-medium ${
														tx.balance > 0.01
															? "text-green-400 print:text-green-600"
															: tx.balance < -0.01
															? "text-red-400 print:text-red-600"
															: "text-gray-500"
													}`}
												>
													{tx.balance > 0.01
														? `you lent ${formatCurrency(tx.balance)}`
														: tx.balance < -0.01
														? `you borrowed ${formatCurrency(Math.abs(tx.balance))}`
														: "settled"}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="bg-gray-800/50 print:bg-gray-100 border-t border-gray-700 print:border-gray-300">
											<td
												colSpan={3}
												className="py-2 px-4 text-xs font-bold text-white print:text-gray-900"
											>
												Totals
											</td>
											<td className="py-2 px-4 text-xs text-right font-bold text-white print:text-gray-900">
												{formatCurrency(breakdown.totalPaid)}
											</td>
											<td className="py-2 px-4 text-xs text-right font-bold text-white print:text-gray-900">
												{formatCurrency(breakdown.totalShare)}
											</td>
											<td
												className={`py-2 px-4 text-xs text-right font-bold ${
													breakdown.finalBalance > 0.01
														? "text-green-400 print:text-green-600"
														: breakdown.finalBalance < -0.01
														? "text-red-400 print:text-red-600"
														: "text-gray-500"
												}`}
											>
												{breakdown.finalBalance > 0.01
													? `gets back ${formatCurrency(breakdown.finalBalance)}`
													: breakdown.finalBalance < -0.01
													? `owes ${formatCurrency(Math.abs(breakdown.finalBalance))}`
													: "settled"}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					))}
				</div>

				{/* Footer */}
				<div className="mt-8 pt-8 border-t border-gray-800 print:border-gray-200 text-center">
					<p className="text-sm text-gray-500 print:text-gray-400">
						Generated by TableSplit on {formatDate(new Date().toISOString())}
					</p>
				</div>
			</div>

			{/* Print Styles */}
			<style jsx global>{`
				@media print {
					body {
						background: white !important;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}

					.print\\:hidden {
						display: none !important;
					}

					.print\\:break-before-page {
						break-before: page;
					}

					.print\\:break-inside-avoid {
						break-inside: avoid;
					}
				}
			`}</style>
		</div>
	);
}
