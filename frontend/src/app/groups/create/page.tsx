"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Sparkles } from "lucide-react";
import { apiHelpers } from "@/lib/api";
import { Group } from "@/types";

export default function CreateGroupPage() {
	const router = useRouter();

	const [name, setName] = useState("");
	const [theme, setTheme] = useState<"poker" | "classic" | "minimal">("poker");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await apiHelpers.post<Group>("/groups", {
				name,
				theme,
				currency: "USD",
			});

			const group = response.data;
			router.push(`/groups/${group!._id}`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create group",
			);
		} finally {
			setLoading(false);
		}
	};

	const themes: Array<{
		value: "poker" | "classic" | "minimal";
		name: string;
		icon: string;
		description: string;
	}> = [
		{
			value: "poker",
			name: "Poker Table",
			icon: "🎰",
			description: "Classic green felt",
		},
		{
			value: "classic",
			name: "Classic Dark",
			icon: "🌙",
			description: "Sleek and modern",
		},
		{
			value: "minimal",
			name: "Minimal",
			icon: "✨",
			description: "Clean and simple",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 p-6">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<button
						onClick={() => router.push("/groups")}
						className="p-2 hover:bg-felt-700 rounded-full transition-colors"
					>
						<ArrowLeft className="w-6 h-6 text-white" />
					</button>
					<h1 className="text-3xl font-bold text-white">Create New Group</h1>
				</div>

				{/* Form */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-felt-700/50 backdrop-blur-sm border border-gold-900/30 rounded-xl p-8"
				>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Group Name */}
						<div>
							<label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
								<Users className="w-5 h-5" />
								Group Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Weekend Trip, Roommates, etc."
								required
								className="w-full px-4 py-3 bg-slate-900/50 border border-gold-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
							/>
						</div>

						{/* Theme Selection */}
						<div>
							<label className="block text-gray-300 mb-3 font-semibold flex items-center gap-2">
								<Sparkles className="w-5 h-5" />
								Choose Theme
							</label>
							<div className="grid grid-cols-3 gap-4">
								{themes.map((themeOption) => (
									<button
										key={themeOption.value}
										type="button"
										onClick={() => setTheme(themeOption.value)}
										className={`p-4 rounded-lg border-2 transition-all ${
											theme === themeOption.value
												? "border-gold-500 bg-gold-500/20"
												: "border-gold-900/30 bg-slate-900/50 hover:border-gold-700"
										}`}
									>
										<div className="text-3xl mb-2">{themeOption.icon}</div>
										<p className="text-white font-semibold text-sm mb-1">
											{themeOption.name}
										</p>
										<p className="text-gray-400 text-xs">
											{themeOption.description}
										</p>
									</button>
								))}
							</div>
						</div>

						{error && (
							<div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
								{error}
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading || !name}
							className="w-full py-4 bg-gold-500 text-slate-950 rounded-lg font-bold text-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-chip"
						>
							{loading ? "Creating..." : "Create Group"}
						</button>
					</form>
				</motion.div>
			</div>
		</div>
	);
}
