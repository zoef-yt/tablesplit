"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
	Settings,
	X,
	Edit2,
	Trash2,
	UserX,
	Save,
	XCircle,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import { Group, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	useUpdateGroup,
	useRemoveMember,
	useDeleteGroup,
} from "@/lib/hooks/useGroups";

interface GroupSettingsProps {
	group: Group;
	currentUserId: string;
}

export function GroupSettings({ group, currentUserId }: GroupSettingsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [editedName, setEditedName] = useState(group.name);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const updateGroupMutation = useUpdateGroup(group._id);
	const removeMemberMutation = useRemoveMember(group._id);
	const deleteGroupMutation = useDeleteGroup();

	// Check if current user is the creator (first member)
	const isCreator =
		group.members.length > 0 &&
		(typeof group.members[0].userId === "object"
			? group.members[0].userId._id
			: group.members[0].userId) === currentUserId;

	const handleSaveName = async () => {
		if (!editedName.trim() || editedName === group.name) {
			setIsEditingName(false);
			return;
		}

		try {
			await updateGroupMutation.mutateAsync({ name: editedName });
			setIsEditingName(false);
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "Failed to update group name",
			);
		}
	};

	const handleRemoveMember = async (memberId: string, memberName: string) => {
		const confirmed = confirm(
			`Are you sure you want to remove ${memberName} from the group?`,
		);
		if (confirmed) {
			try {
				await removeMemberMutation.mutateAsync(memberId);
			} catch (error) {
				alert(
					error instanceof Error
						? error.message
						: "Failed to remove member",
				);
			}
		}
	};

	const handleDeleteGroup = async () => {
		try {
			await deleteGroupMutation.mutateAsync(group._id);
			setIsOpen(false);
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "Failed to delete group",
			);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="border-gray-700 hover:bg-gray-800"
				>
					<Settings className="w-4 h-4 mr-2" />
					Settings
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-white text-xl flex items-center gap-2">
							<Settings className="w-5 h-5 text-primary-500" />
							Group Settings
						</DialogTitle>
						<button
							onClick={() => setIsOpen(false)}
							className="p-1 hover:bg-gray-800 rounded-full transition-colors"
						>
							<X className="w-5 h-5 text-gray-400" />
						</button>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Group Name */}
					<div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
						<h3 className="text-lg font-bold text-white mb-3">
							Group Name
						</h3>
						{isEditingName ? (
							<div className="space-y-3">
								<Input
									value={editedName}
									onChange={(e) => setEditedName(e.target.value)}
									placeholder="Group name"
									className="bg-gray-900 border-gray-700 text-white"
									disabled={!isCreator}
								/>
								<div className="flex gap-2">
									<Button
										onClick={handleSaveName}
										className="flex-1 bg-primary-600 hover:bg-primary-700"
										disabled={
											updateGroupMutation.isPending || !isCreator
										}
									>
										{updateGroupMutation.isPending ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="w-4 h-4 mr-2" />
												Save
											</>
										)}
									</Button>
									<Button
										onClick={() => {
											setEditedName(group.name);
											setIsEditingName(false);
										}}
										variant="outline"
										className="flex-1 border-gray-700 hover:bg-gray-800"
										disabled={updateGroupMutation.isPending}
									>
										<XCircle className="w-4 h-4 mr-2" />
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<p className="text-white text-lg">{group.name}</p>
								{isCreator && (
									<Button
										onClick={() => setIsEditingName(true)}
										variant="outline"
										size="sm"
										className="border-gray-700 hover:bg-gray-800"
									>
										<Edit2 className="w-4 h-4 mr-2" />
										Edit
									</Button>
								)}
							</div>
						)}
					</div>

					{/* Members List */}
					<div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
						<h3 className="text-lg font-bold text-white mb-3">
							Members ({group.members.length})
						</h3>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{group.members.map((member, index) => {
								const memberUser =
									typeof member.userId === "object"
										? member.userId
										: null;
								const memberId = memberUser?._id || "";
								const memberName = memberUser?.name || "Unknown User";
								const isCurrentUser = memberId === currentUserId;
								const isMemberCreator = index === 0;

								return (
									<div
										key={memberId}
										className={`p-3 rounded-lg border flex items-center justify-between ${
											isCurrentUser
												? "bg-primary-500/10 border-primary-500/30"
												: "bg-gray-800/50 border-gray-700/50"
										}`}
									>
										<div className="flex items-center gap-3">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
													isCurrentUser
														? "bg-primary-500/20 text-primary-400"
														: "bg-gray-700 text-white"
												}`}
											>
												{memberName.charAt(0).toUpperCase()}
											</div>
											<div>
												<p className="text-white font-medium">
													{memberName}
													{isCurrentUser && " (You)"}
													{isMemberCreator && (
														<span className="ml-2 text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded">
															Creator
														</span>
													)}
												</p>
												<p className="text-gray-400 text-sm">
													{memberUser?.email}
												</p>
											</div>
										</div>
										{isCreator &&
											!isMemberCreator &&
											!isCurrentUser && (
												<Button
													onClick={() =>
														handleRemoveMember(memberId, memberName)
													}
													variant="outline"
													size="sm"
													className="border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
													disabled={
														removeMemberMutation.isPending
													}
												>
													{removeMemberMutation.isPending ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<>
															<UserX className="w-4 h-4 mr-2" />
															Remove
														</>
													)}
												</Button>
											)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Danger Zone */}
					{isCreator && (
						<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
							<h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
								<AlertTriangle className="w-5 h-5" />
								Danger Zone
							</h3>
							{showDeleteConfirm ? (
								<div className="space-y-3">
									<p className="text-gray-300 text-sm">
										Are you sure you want to delete this group? This
										will permanently delete all expenses, balances, and
										settlements. This action cannot be undone.
									</p>
									<div className="flex gap-2">
										<Button
											onClick={handleDeleteGroup}
											className="flex-1 bg-red-600 hover:bg-red-700"
											disabled={deleteGroupMutation.isPending}
										>
											{deleteGroupMutation.isPending ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													Deleting...
												</>
											) : (
												<>
													<Trash2 className="w-4 h-4 mr-2" />
													Yes, Delete Group
												</>
											)}
										</Button>
										<Button
											onClick={() => setShowDeleteConfirm(false)}
											variant="outline"
											className="flex-1 border-gray-700 hover:bg-gray-800"
											disabled={deleteGroupMutation.isPending}
										>
											<XCircle className="w-4 h-4 mr-2" />
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<Button
									onClick={() => setShowDeleteConfirm(true)}
									variant="outline"
									className="w-full border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Delete Group
								</Button>
							)}
						</div>
					)}

					{!isCreator && (
						<p className="text-gray-500 text-sm text-center py-2">
							Only the group creator can manage these settings
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
