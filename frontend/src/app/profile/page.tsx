"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	User as UserIcon,
	Mail,
	Loader2,
	Save,
	CreditCard,
	Check,
	X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useUpdateProfile } from "@/lib/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { isValidUpiId, getUpiProvider } from "@/lib/upi";

const profileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	upiId: z
		.string()
		.optional()
		.refine(
			(val) => !val || isValidUpiId(val),
			"Invalid UPI ID format (e.g., username@paytm)",
		),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);
	const updateProfileMutation = useUpdateProfile();
	const [showSuccess, setShowSuccess] = useState(false);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: "",
			upiId: "",
		},
	});

	// Initialize form with user data
	useEffect(() => {
		if (user) {
			form.reset({
				name: user.name || "",
				upiId: user.upiId || "",
			});
		}
	}, [user, form]);

	// Handle redirect to login if not authenticated
	useEffect(() => {
		if (isHydrated && !user) {
			router.push("/auth/login");
		}
	}, [user, isHydrated, router]);

	const onSubmit = async (values: ProfileFormValues) => {
		if (!user) return;

		try {
			await updateProfileMutation.mutateAsync({
				name: values.name,
				upiId: values.upiId || undefined,
			});

			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (error) {
			form.setError("root", {
				message:
					error instanceof Error
						? error.message
						: "Failed to update profile. Please try again.",
			});
		}
	};

	// Show loading while hydrating
	if (!isHydrated || !user) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
			</div>
		);
	}

	const watchedUpiId = form.watch("upiId");
	const upiProvider =
		watchedUpiId && watchedUpiId.length > 0
			? getUpiProvider(watchedUpiId)
			: null;

	return (
		<div className="min-h-screen bg-gray-950">
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

			<div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<button
						onClick={() => router.push("/groups")}
						className="p-2 hover:bg-gray-800 rounded-full transition-colors"
					>
						<ArrowLeft className="w-6 h-6 text-white" />
					</button>
					<h1 className="text-2xl sm:text-3xl font-bold text-white">
						My Profile
					</h1>
					<div className="w-10" /> {/* Spacer for centering */}
				</div>

				{/* Profile Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8 p-6 rounded-xl bg-gray-800/50 border border-gray-700"
				>
					<div className="flex items-center gap-4 mb-6">
						<div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-3xl font-bold">
							{user.name.charAt(0).toUpperCase()}
						</div>
						<div>
							<h2 className="text-2xl font-bold text-white">{user.name}</h2>
							<p className="text-gray-400 flex items-center gap-2 mt-1">
								<Mail className="w-4 h-4" />
								{user.email}
							</p>
						</div>
					</div>

					{/* Account Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
						<div>
							<p className="text-gray-500 text-sm">Member Since</p>
							<p className="text-white font-medium">
								{new Date(user.createdAt).toLocaleDateString("en-IN", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</p>
						</div>
						<div>
							<p className="text-gray-500 text-sm">Last Active</p>
							<p className="text-white font-medium">
								{new Date(user.lastActive).toLocaleDateString("en-IN", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</p>
						</div>
					</div>
				</motion.div>

				{/* Edit Profile Form */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
				>
					<h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
						<UserIcon className="w-5 h-5 text-primary-500" />
						Edit Profile
					</h3>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300">Display Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Your name"
												className="bg-gray-900 border-gray-700 text-white"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="upiId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300 flex items-center gap-2">
											<CreditCard className="w-4 h-4" />
											UPI ID
											{upiProvider && (
												<span className="text-xs text-primary-400">
													({upiProvider})
												</span>
											)}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="username@paytm"
												className="bg-gray-900 border-gray-700 text-white"
											/>
										</FormControl>
										<FormDescription className="text-gray-500">
											Your UPI ID is required to receive payments. Format:
											username@provider (e.g., username@paytm, username@phonepe)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{form.formState.errors.root && (
								<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
									<X className="w-5 h-5 text-red-400" />
									<p className="text-red-400 text-sm">
										{form.formState.errors.root.message}
									</p>
								</div>
							)}

							{showSuccess && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2"
								>
									<Check className="w-5 h-5 text-green-400" />
									<p className="text-green-400 text-sm">
										Profile updated successfully!
									</p>
								</motion.div>
							)}

							<Button
								type="submit"
								className="w-full bg-primary-600 hover:bg-primary-700"
								disabled={updateProfileMutation.isPending}
							>
								{updateProfileMutation.isPending ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin mr-2" />
										Saving...
									</>
								) : (
									<>
										<Save className="w-5 h-5 mr-2" />
										Save Changes
									</>
								)}
							</Button>
						</form>
					</Form>
				</motion.div>

				{/* UPI Info Card */}
				{user.upiId && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
					>
						<div className="flex items-start gap-3">
							<Check className="w-5 h-5 text-green-400 mt-0.5" />
							<div>
								<p className="text-green-400 font-medium mb-1">
									UPI ID Configured
								</p>
								<p className="text-gray-400 text-sm">
									You can now receive payments via UPI in group settlements.
									Other members will see a &ldquo;Pay via UPI&rdquo; button when
									settling up with you.
								</p>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
