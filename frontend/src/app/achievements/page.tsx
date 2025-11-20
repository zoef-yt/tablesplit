"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
	Trophy,
	Flame,
	Star,
	Crown,
	Medal,
	Zap,
	Target,
	Users,
	TrendingUp,
	Clock,
	Loader2,
	ChevronRight,
	Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
	useGamificationProfile,
	useLeaderboard,
	useEquipTitle,
	useEquipBadge,
} from "@/lib/hooks/useGamification";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import type { Badge, Achievement } from "@/types";

// Rarity colors
const RARITY_COLORS = {
	common: "from-gray-500 to-gray-600",
	rare: "from-blue-500 to-blue-600",
	epic: "from-purple-500 to-purple-600",
	legendary: "from-yellow-500 to-orange-500",
};

const RARITY_BG = {
	common: "bg-gray-500/20 border-gray-500/50",
	rare: "bg-blue-500/20 border-blue-500/50",
	epic: "bg-purple-500/20 border-purple-500/50",
	legendary: "bg-yellow-500/20 border-yellow-500/50",
};

export default function AchievementsPage() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const [activeTab, setActiveTab] = useState<"overview" | "badges" | "achievements" | "leaderboard">("overview");
	const [leaderboardType, setLeaderboardType] = useState<"xp" | "settlements" | "streaks">("xp");

	const { data: profile, isLoading } = useGamificationProfile();
	const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(leaderboardType, 20);
	const equipTitleMutation = useEquipTitle();
	const equipBadgeMutation = useEquipBadge();

	if (!user) {
		router.push("/auth/login");
		return null;
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-primary-500" />
			</div>
		);
	}

	const stats = profile?.stats;
	const xpProgress = profile?.xpProgress || 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<Navigation />

			<div className="max-w-4xl mx-auto px-4 pt-20 pb-24">
				{/* Header with Level & XP */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6"
				>
					<div className="bg-gradient-to-r from-primary-600/20 to-purple-600/20 border border-primary-500/30 rounded-2xl p-6">
						<div className="flex items-center gap-4 mb-4">
							<div className="relative">
								<div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
									{stats?.level || 1}
								</div>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
									className="absolute -inset-1 rounded-full border-2 border-dashed border-primary-500/50"
								/>
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h1 className="text-xl font-bold text-white">
										{profile?.currentTitle}
									</h1>
									<Sparkles className="w-5 h-5 text-yellow-400" />
								</div>
								<p className="text-gray-400 text-sm">{user.name}</p>
							</div>
						</div>

						{/* XP Progress Bar */}
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-gray-400">
									Level {stats?.level || 1}
								</span>
								<span className="text-primary-400">
									{stats?.xp || 0} / {profile?.xpForNextLevel || 100} XP
								</span>
							</div>
							<div className="h-3 bg-gray-700 rounded-full overflow-hidden">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${xpProgress}%` }}
									transition={{ duration: 1, ease: "easeOut" }}
									className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
								/>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Quick Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid grid-cols-2 gap-3 mb-6"
				>
					<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<Flame className="w-5 h-5 text-orange-500" />
							<span className="text-gray-400 text-sm">Streak</span>
						</div>
						<p className="text-2xl font-bold text-white">
							{stats?.currentSettleStreak || 0}
							<span className="text-sm text-gray-400 ml-1">days</span>
						</p>
					</div>
					<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<Trophy className="w-5 h-5 text-yellow-500" />
							<span className="text-gray-400 text-sm">Badges</span>
						</div>
						<p className="text-2xl font-bold text-white">
							{profile?.unlockedBadges?.length || 0}
						</p>
					</div>
				</motion.div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-2 overflow-x-auto">
					{[
						{ id: "overview", label: "Overview", icon: Star },
						{ id: "badges", label: "Badges", icon: Medal },
						{ id: "achievements", label: "Achievements", icon: Target },
						{ id: "leaderboard", label: "Leaderboard", icon: Crown },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as typeof activeTab)}
							className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 whitespace-nowrap ${
								activeTab === tab.id
									? "bg-primary-600 text-white"
									: "text-gray-400 hover:text-white"
							}`}
						>
							<tab.icon className="w-3.5 h-3.5" />
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<AnimatePresence mode="wait">
					{activeTab === "overview" && (
						<motion.div
							key="overview"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="space-y-4"
						>
							{/* Stats Grid */}
							<div className="grid grid-cols-2 gap-3">
								<StatCard
									icon={<Zap className="w-5 h-5 text-yellow-400" />}
									label="Expenses Added"
									value={stats?.totalExpensesAdded || 0}
								/>
								<StatCard
									icon={<TrendingUp className="w-5 h-5 text-green-400" />}
									label="Total Split"
									value={formatCurrency(stats?.totalAmountSplit || 0)}
								/>
								<StatCard
									icon={<Target className="w-5 h-5 text-blue-400" />}
									label="Settlements Made"
									value={stats?.totalSettlementsMade || 0}
								/>
								<StatCard
									icon={<Clock className="w-5 h-5 text-purple-400" />}
									label="On-Time Rate"
									value={`${stats?.totalSettlementsMade ? Math.round((stats.onTimeSettlements / stats.totalSettlementsMade) * 100) : 0}%`}
								/>
								<StatCard
									icon={<Users className="w-5 h-5 text-pink-400" />}
									label="Groups Joined"
									value={stats?.groupsJoined || 0}
								/>
								<StatCard
									icon={<Flame className="w-5 h-5 text-orange-400" />}
									label="Best Streak"
									value={`${stats?.longestSettleStreak || 0} days`}
								/>
							</div>

							{/* Available Titles */}
							{profile?.availableTitles && profile.availableTitles.length > 0 && (
								<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
									<h3 className="text-white font-semibold mb-3 flex items-center gap-2">
										<Crown className="w-5 h-5 text-yellow-400" />
										Your Titles
									</h3>
									<div className="flex flex-wrap gap-2">
										{profile.availableTitles.map((title) => (
											<button
												key={title}
												onClick={() => equipTitleMutation.mutate(title)}
												className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
													title === profile.currentTitle
														? "bg-primary-600 text-white"
														: "bg-gray-700 text-gray-300 hover:bg-gray-600"
												}`}
											>
												{title}
											</button>
										))}
									</div>
								</div>
							)}
						</motion.div>
					)}

					{activeTab === "badges" && (
						<motion.div
							key="badges"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="space-y-4"
						>
							{/* Unlocked Badges */}
							{profile?.unlockedBadges && profile.unlockedBadges.length > 0 ? (
								<div className="grid grid-cols-2 gap-3">
									{profile.unlockedBadges.map((badge) => (
										<motion.button
											key={badge.id}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => equipBadgeMutation.mutate(badge.id)}
											className={`p-4 rounded-xl border ${RARITY_BG[badge.rarity]} ${
												stats?.equippedBadge === badge.id ? "ring-2 ring-primary-500" : ""
											}`}
										>
											<div className="text-3xl mb-2">{badge.icon}</div>
											<h4 className="text-white font-semibold text-sm">{badge.name}</h4>
											<p className="text-gray-400 text-xs mt-1">{badge.description}</p>
											<div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${RARITY_COLORS[badge.rarity]} text-white`}>
												{badge.rarity}
											</div>
										</motion.button>
									))}
								</div>
							) : (
								<div className="text-center py-12 text-gray-400">
									<Medal className="w-12 h-12 mx-auto mb-4 opacity-50" />
									<p>No badges unlocked yet</p>
									<p className="text-sm mt-1">Keep splitting to earn badges!</p>
								</div>
							)}
						</motion.div>
					)}

					{activeTab === "achievements" && (
						<motion.div
							key="achievements"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="space-y-3"
						>
							{profile?.achievements?.map((achievement) => (
								<div
									key={achievement.id}
									className={`p-4 rounded-xl border ${
										achievement.unlocked
											? "bg-gray-800/50 border-green-500/50"
											: "bg-gray-800/30 border-gray-700 opacity-60"
									}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
												achievement.unlocked
													? "bg-green-500/20"
													: "bg-gray-700"
											}`}>
												{achievement.unlocked ? (
													<Trophy className="w-5 h-5 text-green-400" />
												) : (
													<Target className="w-5 h-5 text-gray-500" />
												)}
											</div>
											<div>
												<h4 className="text-white font-semibold text-sm">
													{achievement.name}
												</h4>
												<p className="text-gray-400 text-xs">
													{achievement.description}
												</p>
											</div>
										</div>
										<div className="text-right">
											<span className={`text-sm font-bold ${
												achievement.unlocked ? "text-green-400" : "text-gray-500"
											}`}>
												+{achievement.xpReward} XP
											</span>
										</div>
									</div>
								</div>
							))}
						</motion.div>
					)}

					{activeTab === "leaderboard" && (
						<motion.div
							key="leaderboard"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="space-y-4"
						>
							{/* Leaderboard Type Selector */}
							<div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
								{[
									{ id: "xp", label: "XP" },
									{ id: "settlements", label: "Settlements" },
									{ id: "streaks", label: "Streaks" },
								].map((type) => (
									<button
										key={type.id}
										onClick={() => setLeaderboardType(type.id as typeof leaderboardType)}
										className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
											leaderboardType === type.id
												? "bg-primary-600 text-white"
												: "text-gray-400 hover:text-white"
										}`}
									>
										{type.label}
									</button>
								))}
							</div>

							{/* Leaderboard List */}
							{leaderboardLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="w-6 h-6 animate-spin text-primary-500" />
								</div>
							) : (
								<div className="space-y-2">
									{leaderboard?.map((entry, index) => (
										<motion.div
											key={entry.user?._id || index}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.05 }}
											className={`flex items-center gap-3 p-3 rounded-xl ${
												index === 0
													? "bg-yellow-500/20 border border-yellow-500/50"
													: index === 1
													? "bg-gray-400/20 border border-gray-400/50"
													: index === 2
													? "bg-orange-500/20 border border-orange-500/50"
													: "bg-gray-800/50 border border-gray-700"
											}`}
										>
											<div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
												index === 0
													? "bg-yellow-500 text-black"
													: index === 1
													? "bg-gray-400 text-black"
													: index === 2
													? "bg-orange-500 text-black"
													: "bg-gray-700 text-gray-300"
											}`}>
												{entry.rank}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-white font-medium text-sm truncate">
													{entry.user?.name || "Unknown"}
												</p>
												<p className="text-gray-400 text-xs">
													{entry.title}
												</p>
											</div>
											<div className="text-right">
												<p className="text-white font-bold">
													{leaderboardType === "xp"
														? `${entry.xp} XP`
														: leaderboardType === "settlements"
														? entry.value
														: `${entry.value} days`}
												</p>
												<p className="text-gray-400 text-xs">Lvl {entry.level}</p>
											</div>
										</motion.div>
									))}

									{(!leaderboard || leaderboard.length === 0) && (
										<div className="text-center py-8 text-gray-400">
											<Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
											<p>No rankings yet</p>
											<p className="text-sm mt-1">Be the first to top the leaderboard!</p>
										</div>
									)}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string | number;
}) {
	return (
		<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
			<div className="flex items-center gap-2 mb-2">
				{icon}
				<span className="text-gray-400 text-xs">{label}</span>
			</div>
			<p className="text-lg font-bold text-white">{value}</p>
		</div>
	);
}
