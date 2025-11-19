"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useFriends } from "@/lib/hooks/useFriends";
import { useAddMemberToGroup } from "@/lib/hooks/useGroups";
import type { User } from "@/types";

interface AddFriendToGroupDialogProps {
	groupId: string;
	currentMembers: string[]; // Array of user IDs already in the group
}

export function AddFriendToGroupDialog({
	groupId,
	currentMembers,
}: AddFriendToGroupDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: friends = [], isLoading } = useFriends();
	const addMemberMutation = useAddMemberToGroup(groupId);

	// Filter friends who are not already in the group
	const availableFriends = friends.filter(
		(friend) => !currentMembers.includes(friend._id)
	);

	// Filter by search query
	const filteredFriends = availableFriends.filter(
		(friend) =>
			friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			friend.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleAddFriend = async (friendId: string) => {
		try {
			await addMemberMutation.mutateAsync(friendId);
			// Don't close dialog so user can add multiple friends
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: "Failed to add friend to group"
			);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="border-primary-700 text-primary-400 hover:bg-primary-500/10"
				>
					<UserPlus className="w-4 h-4 mr-2" />
					Add Friend
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-gray-900 border-gray-800 max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white">Add Friend to Group</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search friends..."
							className="bg-gray-800 border-gray-700 text-white pl-10"
						/>
					</div>

					{/* Friends List */}
					<div className="max-h-96 overflow-y-auto space-y-2">
						{isLoading ? (
							<div className="text-center py-8">
								<Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
							</div>
						) : availableFriends.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-400">
									{friends.length === 0
										? "You don't have any friends yet"
										: "All your friends are already in this group"}
								</p>
							</div>
						) : filteredFriends.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-400">No friends found</p>
							</div>
						) : (
							filteredFriends.map((friend) => (
								<motion.div
									key={friend._id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
											{friend.name.charAt(0).toUpperCase()}
										</div>
										<div>
											<p className="text-white font-medium">{friend.name}</p>
											<p className="text-gray-400 text-sm">{friend.email}</p>
										</div>
									</div>
									<Button
										onClick={() => handleAddFriend(friend._id)}
										size="sm"
										disabled={addMemberMutation.isPending}
										className="bg-primary-600 hover:bg-primary-700"
									>
										{addMemberMutation.isPending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<UserPlus className="w-4 h-4" />
										)}
									</Button>
								</motion.div>
							))
						)}
					</div>

					<div className="border-t border-gray-800 pt-4">
						<Button
							onClick={() => setIsOpen(false)}
							variant="outline"
							className="w-full border-gray-700"
						>
							Done
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
