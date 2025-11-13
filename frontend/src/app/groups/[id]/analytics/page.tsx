"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	TrendingUp,
	Users,
	PieChart as PieChartIcon,
	Calendar,
	IndianRupee,
	Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroupAnalytics } from "@/lib/hooks/useExpenses";
import { useGroup } from "@/lib/hooks/useGroups";
import { formatCurrency } from "@/lib/utils";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	LineChart,
	Line,
} from "recharts";

const COLORS = [
	"#10b981", // green
	"#3b82f6", // blue
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // purple
	"#ec4899", // pink
	"#14b8a6", // teal
	"#f97316", // orange
];

export default function AnalyticsPage() {
	const params = useParams();
	const router = useRouter();
	const groupId = params.id as string;

	const { data: group } = useGroup(groupId);
	const { data: analytics, isLoading } = useGroupAnalytics(groupId);

	if (isLoading || !analytics) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading analytics...</div>
			</div>
		);
	}

	const formatMonth = (monthStr: string) => {
		const [year, month] = monthStr.split("-");
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
			{/* Header */}
			<div className="bg-gray-900/50 border-b border-gray-800 sticky top-0 z-10 backdrop-blur-lg">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.back()}
							className="text-gray-400 hover:text-white"
						>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<div className="flex-1">
							<h1 className="text-2xl font-bold text-white flex items-center gap-2">
								<TrendingUp className="w-6 h-6 text-primary-500" />
								Analytics
							</h1>
							<p className="text-gray-400 text-sm">{group?.name}</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
				{/* Group Overview Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30"
					>
						<div className="flex items-center gap-2 mb-2">
							<IndianRupee className="w-5 h-5 text-green-400" />
							<p className="text-gray-400 text-sm">Total Expenses</p>
						</div>
						<p className="text-2xl font-bold text-white">
							{formatCurrency(analytics.groupTotals.totalExpenses)}
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30"
					>
						<div className="flex items-center gap-2 mb-2">
							<Receipt className="w-5 h-5 text-blue-400" />
							<p className="text-gray-400 text-sm">Expense Count</p>
						</div>
						<p className="text-2xl font-bold text-white">
							{analytics.groupTotals.expenseCount}
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
					>
						<div className="flex items-center gap-2 mb-2">
							<IndianRupee className="w-5 h-5 text-purple-400" />
							<p className="text-gray-400 text-sm">Average Expense</p>
						</div>
						<p className="text-2xl font-bold text-white">
							{formatCurrency(analytics.groupTotals.averageExpense)}
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
					>
						<div className="flex items-center gap-2 mb-2">
							<Users className="w-5 h-5 text-amber-400" />
							<p className="text-gray-400 text-sm">Members</p>
						</div>
						<p className="text-2xl font-bold text-white">
							{analytics.groupTotals.memberCount}
						</p>
					</motion.div>
				</div>

				{/* User Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
				>
					<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
						<Users className="w-5 h-5 text-primary-400" />
						Your Statistics
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<p className="text-gray-400 text-sm mb-1">You Paid</p>
							<p className="text-xl font-bold text-green-400">
								{formatCurrency(analytics.userStats.totalPaid)}
							</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm mb-1">Your Share</p>
							<p className="text-xl font-bold text-orange-400">
								{formatCurrency(analytics.userStats.totalOwed)}
							</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm mb-1">% of Total</p>
							<p className="text-xl font-bold text-blue-400">
								{analytics.userStats.shareOfTotal.toFixed(1)}%
							</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm mb-1">Expenses Created</p>
							<p className="text-xl font-bold text-purple-400">
								{analytics.userStats.expenseCount}
							</p>
						</div>
					</div>
				</motion.div>

				{/* Category Breakdown - Pie Chart */}
				{analytics.categoryBreakdown.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
					>
						<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
							<PieChartIcon className="w-5 h-5 text-primary-400" />
							Category Breakdown
						</h2>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={analytics.categoryBreakdown as any[]}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ category, total }: any) =>
												`${category}: ₹${total.toFixed(0)}`
											}
											outerRadius={100}
											fill="#8884d8"
											dataKey="total"
										>
											{analytics.categoryBreakdown.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#1f2937",
												border: "1px solid #374151",
												borderRadius: "8px",
												color: "#fff",
											}}
											formatter={(value: number) => `₹${value.toFixed(2)}`}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="space-y-2">
								{analytics.categoryBreakdown.map((cat, index) => (
									<div
										key={cat.category}
										className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50"
									>
										<div className="flex items-center gap-3">
											<div
												className="w-4 h-4 rounded"
												style={{ backgroundColor: COLORS[index % COLORS.length] }}
											/>
											<div>
												<p className="text-white font-medium">{cat.category}</p>
												<p className="text-gray-400 text-sm">{cat.count} expenses</p>
											</div>
										</div>
										<p className="text-white font-bold">
											{formatCurrency(cat.total)}
										</p>
									</div>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{/* Top Payers */}
				{analytics.topPayers.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
					>
						<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
							<Users className="w-5 h-5 text-primary-400" />
							Top Contributors
						</h2>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={analytics.topPayers as any[]}>
									<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
									<XAxis
										dataKey="userName"
										stroke="#9ca3af"
										tick={{ fill: "#9ca3af" }}
									/>
									<YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
									<Tooltip
										contentStyle={{
											backgroundColor: "#1f2937",
											border: "1px solid #374151",
											borderRadius: "8px",
											color: "#fff",
										}}
										formatter={(value: number) => `₹${value.toFixed(2)}`}
									/>
									<Legend wrapperStyle={{ color: "#9ca3af" }} />
									<Bar dataKey="totalPaid" fill="#10b981" name="Total Paid" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</motion.div>
				)}

				{/* Monthly Trends */}
				{analytics.monthlyTrends.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
					>
						<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
							<Calendar className="w-5 h-5 text-primary-400" />
							Monthly Trends
						</h2>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={analytics.monthlyTrends.map((trend) => ({
										...trend,
										monthLabel: formatMonth(trend.month),
									}))}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
									<XAxis
										dataKey="monthLabel"
										stroke="#9ca3af"
										tick={{ fill: "#9ca3af" }}
									/>
									<YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
									<Tooltip
										contentStyle={{
											backgroundColor: "#1f2937",
											border: "1px solid #374151",
											borderRadius: "8px",
											color: "#fff",
										}}
										formatter={(value: number, name: string) => [
											name === "total" ? `₹${value.toFixed(2)}` : value,
											name === "total" ? "Total Spent" : "Expense Count",
										]}
									/>
									<Legend wrapperStyle={{ color: "#9ca3af" }} />
									<Line
										type="monotone"
										dataKey="total"
										stroke="#3b82f6"
										strokeWidth={2}
										name="Total Spent"
									/>
									<Line
										type="monotone"
										dataKey="count"
										stroke="#f59e0b"
										strokeWidth={2}
										name="Expense Count"
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</motion.div>
				)}

				{/* Top Expenses */}
				{analytics.topExpenses.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8 }}
						className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
					>
						<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
							<Receipt className="w-5 h-5 text-primary-400" />
							Top Expenses
						</h2>
						<div className="space-y-2">
							{analytics.topExpenses.map((expense, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
								>
									<div className="flex-1">
										<p className="text-white font-medium">{expense.description}</p>
										<div className="flex items-center gap-3 mt-1">
											<span className="text-xs text-gray-400">{expense.paidBy}</span>
											<span className="text-xs text-gray-500">•</span>
											<span className="text-xs text-gray-400">{expense.category}</span>
											<span className="text-xs text-gray-500">•</span>
											<span className="text-xs text-gray-400">
												{new Date(expense.date).toLocaleDateString()}
											</span>
										</div>
									</div>
									<p className="text-xl font-bold text-green-400">
										{formatCurrency(expense.amount)}
									</p>
								</div>
							))}
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
