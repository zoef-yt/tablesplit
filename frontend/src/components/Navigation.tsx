"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Users as UsersIcon, UserCircle, LogOut, Receipt } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navigation() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [showDropdown, setShowDropdown] = useState(false);

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

					{/* Mobile Menu */}
					<div className="md:hidden flex items-center gap-4">
						<button
							onClick={() => router.push("/profile")}
							className="p-2 text-gray-300 hover:text-white transition-colors"
						>
							<UserCircle className="w-6 h-6" />
						</button>
						<button
							onClick={handleLogout}
							className="p-2 text-red-400 hover:text-red-300 transition-colors"
						>
							<LogOut className="w-6 h-6" />
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
