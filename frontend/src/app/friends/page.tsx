"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
	UserPlus,
	Users,
	Check,
	X,
	Trash2,
	Loader2,
	Mail,
	Clock,
	UserMinus,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useFriends,
	usePendingFriendRequests,
	useSentFriendRequests,
	useSendFriendRequest,
	useAcceptFriendRequest,
	useDeclineFriendRequest,
	useCancelFriendRequest,
	useRemoveFriend,
} from "@/lib/hooks/useFriends";
import { useAuthStore } from "@/lib/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { FriendRequest, User } from "@/types";

export default function FriendsPage() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);

	const [activeTab, setActiveTab] = useState<"friends" | "pending" | "sent">(
		"friends"
	);
	const [email, setEmail] = useState("");
	const [showAddFriend, setShowAddFriend] = useState(false);
	const [showInviteDialog, setShowInviteDialog] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [sendingInvite, setSendingInvite] = useState(false);

	const { data: friends = [], isLoading: friendsLoading } = useFriends();
	const { data: pendingRequests = [], isLoading: pendingLoading } =
		usePendingFriendRequests();
	const { data: sentRequests = [], isLoading: sentLoading } =
		useSentFriendRequests();

	const sendRequestMutation = useSendFriendRequest();
	const acceptRequestMutation = useAcceptFriendRequest();
	const declineRequestMutation = useDeclineFriendRequest();
	const cancelRequestMutation = useCancelFriendRequest();
	const removeFriendMutation = useRemoveFriend();

	// Redirect if not authenticated
	if (isHydrated && !user) {
		router.push("/auth/login");
		return null;
	}

	if (!isHydrated || !user) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	const handleSendRequest = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim()) {
			return;
		}

		try {
			await sendRequestMutation.mutateAsync(email);
			setEmail("");
			setShowAddFriend(false);
			setActiveTab("sent");
		} catch (error: any) {
			// Check if this is a "user not found" error
			if (error?.response?.status === 404 && error?.response?.data?.action === 'invite') {
				// Show invite dialog
				setInviteEmail(email);
				setShowInviteDialog(true);
				setShowAddFriend(false);
			} else {
				// Extract error message from axios error
				const errorMessage = error?.response?.data?.error
					|| error?.response?.data?.message
					|| error?.message
					|| 'Failed to send friend request';
				toast.error(errorMessage);
			}
		}
	};

	const handleSendInvite = async () => {
		setSendingInvite(true);
		try {
			const response = await api.post('/friends/invite', { email: inviteEmail });
			toast.success(response.data.message || 'Invite sent successfully!');
			setShowInviteDialog(false);
			setInviteEmail("");
			setEmail("");
		} catch (error) {
			toast.error('Failed to send invite. Please try again.');
			console.error(error);
		} finally {
			setSendingInvite(false);
		}
	};

	const handleAccept = async (requestId: string) => {
		try {
			await acceptRequestMutation.mutateAsync(requestId);
		} catch (error) {
			console.error(error);
		}
	};

	const handleDecline = async (requestId: string) => {
		try {
			await declineRequestMutation.mutateAsync(requestId);
		} catch (error) {
			console.error(error);
		}
	};

	const handleCancel = async (requestId: string) => {
		try {
			await cancelRequestMutation.mutateAsync(requestId);
		} catch (error) {
			console.error(error);
		}
	};

	const handleRemove = async (friendId: string) => {
		if (
			!confirm("Are you sure you want to remove this friend? You can send them a friend request again later.")
		) {
			return;
		}

		try {
			await removeFriendMutation.mutateAsync(friendId);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="min-h-screen bg-gray-950">
			<Navigation />
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

			<div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
					<p className="text-gray-400">
						Manage your friends and friend requests
					</p>
				</div>

				{/* Add Friend Button */}
				<div className="mb-6">
					<AnimatePresence>
						{showAddFriend ? (
							<motion.form
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								onSubmit={handleSendRequest}
								className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
							>
								<div className="space-y-4">
									<div>
										<label className="text-sm text-gray-300 mb-2 block">
											Email Address
										</label>
										<Input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="friend@example.com"
											className="bg-gray-900 border-gray-700 text-white"
											autoFocus
										/>
									</div>
									{sendRequestMutation.error && (
										<p className="text-red-400 text-sm">
											{sendRequestMutation.error instanceof Error
												? sendRequestMutation.error.message
												: "Failed to send friend request"}
										</p>
									)}
									<div className="flex gap-2">
										<Button
											type="submit"
											disabled={sendRequestMutation.isPending}
											className="flex-1 bg-primary-600 hover:bg-primary-700"
										>
											{sendRequestMutation.isPending ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													Sending...
												</>
											) : (
												<>
													<Mail className="w-4 h-4 mr-2" />
													Send Request
												</>
											)}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setShowAddFriend(false);
												setEmail("");
											}}
											className="border-gray-700"
										>
											Cancel
										</Button>
									</div>
								</div>
							</motion.form>
						) : (
							<Button
								onClick={() => setShowAddFriend(true)}
								className="w-full bg-primary-600 hover:bg-primary-700"
							>
								<UserPlus className="w-5 h-5 mr-2" />
								Add Friend by Email
							</Button>
						)}
					</AnimatePresence>
				</div>

				{/* Invite Dialog */}
				<AnimatePresence>
					{showInviteDialog && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
							onClick={() => setShowInviteDialog(false)}
						>
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								onClick={(e) => e.stopPropagation()}
								className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full"
							>
								<div className="text-center mb-4">
									<div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
										<Mail className="w-8 h-8 text-yellow-400" />
									</div>
									<h3 className="text-xl font-bold text-white mb-2">
										User Not Found
									</h3>
									<p className="text-gray-400 text-sm">
										<span className="text-white font-medium">{inviteEmail}</span> isn&apos;t on TableSplit yet.
									</p>
								</div>

								<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
									<p className="text-gray-300 text-sm text-center">
										Would you like to send them an invitation to join TableSplit?
										They&apos;ll receive an email with a signup link.
									</p>
								</div>

								<div className="flex gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setShowInviteDialog(false);
											setInviteEmail("");
											setEmail("");
										}}
										className="flex-1 border-gray-700"
										disabled={sendingInvite}
									>
										Cancel
									</Button>
									<Button
										type="button"
										onClick={handleSendInvite}
										className="flex-1 bg-yellow-600 hover:bg-yellow-700"
										disabled={sendingInvite}
									>
										{sendingInvite ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Sending...
											</>
										) : (
											<>
												<Mail className="w-4 h-4 mr-2" />
												Send Invite
											</>
										)}
									</Button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Tabs */}
				<div className="flex flex-col sm:flex-row gap-2 mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-2">
					<button
						onClick={() => setActiveTab("friends")}
						className={`flex-1 px-3 sm:px-4 py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
							activeTab === "friends"
								? "bg-primary-600 text-white"
								: "text-gray-400 hover:text-white hover:bg-gray-800/50"
						}`}
					>
						<Users className="w-4 h-4 flex-shrink-0" />
						<span>Friends ({friends.length})</span>
					</button>
					<button
						onClick={() => setActiveTab("pending")}
						className={`flex-1 px-3 sm:px-4 py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
							activeTab === "pending"
								? "bg-primary-600 text-white"
								: "text-gray-400 hover:text-white hover:bg-gray-800/50"
						}`}
					>
						<Mail className="w-4 h-4 flex-shrink-0" />
						<span>Requests ({pendingRequests.length})</span>
					</button>
					<button
						onClick={() => setActiveTab("sent")}
						className={`flex-1 px-3 sm:px-4 py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
							activeTab === "sent"
								? "bg-primary-600 text-white"
								: "text-gray-400 hover:text-white hover:bg-gray-800/50"
						}`}
					>
						<Clock className="w-4 h-4 flex-shrink-0" />
						<span>Sent ({sentRequests.length})</span>
					</button>
				</div>

				{/* Content */}
				<div className="space-y-4">
					{activeTab === "friends" && (
						<>
							{friendsLoading ? (
								<div className="text-center py-12">
									<Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
								</div>
							) : friends.length === 0 ? (
								<div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
									<Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
									<p className="text-gray-400">No friends yet</p>
									<p className="text-gray-500 text-sm">
										Add friends by their email address
									</p>
								</div>
							) : (
								friends.map((friend, index) => (
									<motion.div
										key={friend._id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-lg">
													{friend.name.charAt(0).toUpperCase()}
												</div>
												<div>
													<p className="text-white font-medium">{friend.name}</p>
													<p className="text-gray-400 text-sm">{friend.email}</p>
												</div>
											</div>
											<Button
												onClick={() => handleRemove(friend._id)}
												variant="outline"
												size="sm"
												className="border-red-900/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
												disabled={removeFriendMutation.isPending}
											>
												<UserMinus className="w-4 h-4" />
											</Button>
										</div>
									</motion.div>
								))
							)}
						</>
					)}

					{activeTab === "pending" && (
						<>
							{pendingLoading ? (
								<div className="text-center py-12">
									<Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
								</div>
							) : pendingRequests.length === 0 ? (
								<div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
									<Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
									<p className="text-gray-400">No pending requests</p>
									<p className="text-gray-500 text-sm">
										You&apos;ll see friend requests here
									</p>
								</div>
							) : (
								pendingRequests.map((request, index) => {
									const fromUser =
										typeof request.from === "object" ? request.from : null;
									return (
										<motion.div
											key={request._id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-lg">
														{fromUser?.name.charAt(0).toUpperCase() || "?"}
													</div>
													<div>
														<p className="text-white font-medium">
															{fromUser?.name || "Unknown User"}
														</p>
														<p className="text-gray-400 text-sm">
															{fromUser?.email || "No email"}
														</p>
														<p className="text-gray-500 text-xs mt-1">
															{new Date(request.createdAt).toLocaleDateString()}
														</p>
													</div>
												</div>
												<div className="flex gap-2">
													<Button
														onClick={() => handleAccept(request._id)}
														size="sm"
														className="bg-green-600 hover:bg-green-700"
														disabled={acceptRequestMutation.isPending}
													>
														<Check className="w-4 h-4" />
													</Button>
													<Button
														onClick={() => handleDecline(request._id)}
														variant="outline"
														size="sm"
														className="border-gray-700"
														disabled={declineRequestMutation.isPending}
													>
														<X className="w-4 h-4" />
													</Button>
												</div>
											</div>
										</motion.div>
									);
								})
							)}
						</>
					)}

					{activeTab === "sent" && (
						<>
							{sentLoading ? (
								<div className="text-center py-12">
									<Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
								</div>
							) : sentRequests.length === 0 ? (
								<div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
									<Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
									<p className="text-gray-400">No sent requests</p>
									<p className="text-gray-500 text-sm">
										Requests you send will appear here
									</p>
								</div>
							) : (
								sentRequests.map((request, index) => {
									const toUser =
										typeof request.to === "object" ? request.to : null;
									return (
										<motion.div
											key={request._id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-semibold text-lg">
														{toUser?.name.charAt(0).toUpperCase() || "?"}
													</div>
													<div>
														<p className="text-white font-medium">
															{toUser?.name || "Unknown User"}
														</p>
														<p className="text-gray-400 text-sm">
															{toUser?.email || "No email"}
														</p>
														<p className="text-gray-500 text-xs mt-1">
															Sent {new Date(request.createdAt).toLocaleDateString()}
														</p>
													</div>
												</div>
												<Button
													onClick={() => handleCancel(request._id)}
													variant="outline"
													size="sm"
													className="border-gray-700"
													disabled={cancelRequestMutation.isPending}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Cancel
												</Button>
											</div>
										</motion.div>
									);
								})
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
