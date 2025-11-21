"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Users as UsersIcon, UserCircle, LogOut, Receipt, UserPlus, Trophy, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navigation() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [showDropdown, setShowDropdown] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	if (!user) return null;

	const handleLogout = () => {
		logout();
		router.push("/auth/login");
	};

	return (
		<nav className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<button
						onClick={() => router.push("/groups")}
						className="flex items-center gap-2 text-xl font-bold text-white hover:text-primary-400 transition-colors"
					>
						<Receipt className="w-6 h-6" />
						<span>TableSplit</span>
					</button>

					{/* Nav Links */}
					<div className="hidden md:flex items-center gap-6">
						<button
							onClick={() => router.push("/groups")}
							className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
						>
							<UsersIcon className="w-5 h-5" />
							<span>Groups</span>
						</button>

						<button
							onClick={() => router.push("/friends")}
							className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
						>
							<UserPlus className="w-5 h-5" />
							<span>Friends</span>
						</button>

						<button
							onClick={() => router.push("/achievements")}
							className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
						>
							<Trophy className="w-5 h-5" />
							<span>Achievements</span>
						</button>

						{/* User Menu */}
						<div className="relative">
							<button
								onClick={() => setShowDropdown(!showDropdown)}
								className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
							>
								<div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
									{user.name.charAt(0).toUpperCase()}
								</div>
								<span className="text-white">{user.name}</span>
							</button>

							<AnimatePresence>
								{showDropdown && (
									<>
										{/* Backdrop */}
										<div
											className="fixed inset-0"
											onClick={() => setShowDropdown(false)}
										/>

										{/* Dropdown Menu */}
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden"
										>
											<button
												onClick={() => {
													setShowDropdown(false);
													router.push("/profile");
												}}
												className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
											>
												<UserCircle className="w-5 h-5" />
												<span>Profile</span>
											</button>
											<div className="border-t border-gray-800" />
											<button
												onClick={() => {
													setShowDropdown(false);
													handleLogout();
												}}
												className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
											>
												<LogOut className="w-5 h-5" />
												<span>Logout</span>
											</button>
										</motion.div>
									</>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-gray-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
						</button>
					</div>
				</div>

				{/* Mobile Menu Drawer */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="md:hidden border-t border-gray-800 overflow-hidden"
						>
							<div className="px-4 py-3 space-y-1">
								<button
									onClick={() => {
										router.push("/groups");
										setMobileMenuOpen(false);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
								>
									<UsersIcon className="w-5 h-5" />
									<span>Groups</span>
								</button>

								<button
									onClick={() => {
										router.push("/friends");
										setMobileMenuOpen(false);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
								>
									<UserPlus className="w-5 h-5" />
									<span>Friends</span>
								</button>

								<button
									onClick={() => {
										router.push("/achievements");
										setMobileMenuOpen(false);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
								>
									<Trophy className="w-5 h-5" />
									<span>Achievements</span>
								</button>

								<button
									onClick={() => {
										router.push("/profile");
										setMobileMenuOpen(false);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
								>
									<UserCircle className="w-5 h-5" />
									<span>Profile</span>
								</button>

								<div className="border-t border-gray-800 my-2" />

								<button
									onClick={() => {
										handleLogout();
										setMobileMenuOpen(false);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px]"
								>
									<LogOut className="w-5 h-5" />
									<span>Logout</span>
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</nav>
	);
}
