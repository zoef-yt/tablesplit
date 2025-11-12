"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useGroups, useCreateGroup } from "@/lib/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Navigation } from "@/components/Navigation";

const createGroupSchema = z.object({
	name: z.string().min(1, "Group name is required").max(100),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function GroupsPage() {
	const router = useRouter();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);
	const { data: groups = [], isLoading } = useGroups();
	const createGroupMutation = useCreateGroup();

	const form = useForm<CreateGroupFormValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: "",
		},
	});

	// Handle redirect to login if not authenticated
	useEffect(() => {
		if (isHydrated && !user) {
			router.push("/auth/login");
		}
	}, [user, isHydrated, router]);

	const onCreateGroup = async (values: CreateGroupFormValues) => {
		await createGroupMutation.mutateAsync({
			name: values.name,
			theme: "poker",
			currency: "INR",
		});
		setIsCreateDialogOpen(false);
		form.reset();
	};

	// Show loading while hydrating
	if (!isHydrated || !user) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-950">
			<Navigation />
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
							Your Groups
						</h1>
						<p className="text-gray-400">
							Hey {user.name}! Manage your expense groups here
						</p>
					</div>
				</div>

				{/* Groups Grid or Empty State */}
				{groups.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center py-20"
					>
						<div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
							<Users className="w-12 h-12 text-gray-600" />
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">
							No groups yet
						</h2>
						<p className="text-gray-400 mb-8 max-w-md mx-auto">
							Create your first group to start tracking expenses with friends
						</p>
						<Dialog
							open={isCreateDialogOpen}
							onOpenChange={setIsCreateDialogOpen}
						>
							<DialogTrigger asChild>
								<Button className="bg-primary-600 hover:bg-primary-700">
									<Plus className="w-5 h-5 mr-2" />
									Create Your First Group
								</Button>
							</DialogTrigger>
							<DialogContent className="bg-gray-900 border-gray-800">
								<DialogHeader>
									<DialogTitle className="text-white">
										Create New Group
									</DialogTitle>
								</DialogHeader>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onCreateGroup)}
										className="space-y-4"
									>
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-gray-300">
														Group Name
													</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="Trip to Goa, Roommates, etc."
															className="bg-gray-800 border-gray-700 text-white"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											type="submit"
											className="w-full bg-primary-600 hover:bg-primary-700"
											disabled={createGroupMutation.isPending}
										>
											{createGroupMutation.isPending ? (
												<>
													<Loader2 className="w-5 h-5 animate-spin mr-2" />
													Creating...
												</>
											) : (
												"Create Group"
											)}
										</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</motion.div>
				) : (
					<>
						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
							{groups.map((group, index) => (
								<motion.div
									key={group._id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.3 }}
									onClick={() => router.push(`/groups/${group._id}`)}
									className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all cursor-pointer group"
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
												{group.name}
											</h3>
											<div className="flex items-center gap-2 text-gray-400 text-sm">
												<Users className="w-4 h-4" />
												<span>{group.members.length} members</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2 text-primary-500 group-hover:text-primary-400 transition-colors">
										<span className="text-sm font-medium">View details</span>
										<ArrowRight className="w-4 h-4" />
									</div>
								</motion.div>
							))}

							{/* Create Group Card */}
							<Dialog
								open={isCreateDialogOpen}
								onOpenChange={setIsCreateDialogOpen}
							>
								<DialogTrigger asChild>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: groups.length * 0.05, duration: 0.3 }}
										className="bg-gray-900/30 backdrop-blur-xl border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-primary-500/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] group"
									>
										<div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-500/20 transition-colors">
											<Plus className="w-6 h-6 text-primary-500" />
										</div>
										<h3 className="text-lg font-semibold text-white mb-1">
											Create New Group
										</h3>
										<p className="text-gray-400 text-sm text-center">
											Start tracking expenses
										</p>
									</motion.div>
								</DialogTrigger>
								<DialogContent className="bg-gray-900 border-gray-800">
									<DialogHeader>
										<DialogTitle className="text-white">
											Create New Group
										</DialogTitle>
									</DialogHeader>
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(onCreateGroup)}
											className="space-y-4"
										>
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-gray-300">
															Group Name
														</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Trip to Goa, Roommates, etc."
																className="bg-gray-800 border-gray-700 text-white"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												type="submit"
												className="w-full bg-primary-600 hover:bg-primary-700"
												disabled={createGroupMutation.isPending}
											>
												{createGroupMutation.isPending ? (
													<>
														<Loader2 className="w-5 h-5 animate-spin mr-2" />
														Creating...
													</>
												) : (
													"Create Group"
												)}
											</Button>
										</form>
									</Form>
								</DialogContent>
							</Dialog>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
