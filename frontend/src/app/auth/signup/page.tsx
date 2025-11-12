"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { AuthResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

const signupSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
	const router = useRouter();
	const setAuth = useAuthStore((state) => state.setAuth);

	const form = useForm<SignupFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const signupMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			email: string;
			password: string;
		}) => {
			const response = await apiHelpers.post<AuthResponse>(
				"/auth/signup",
				data,
			);
			return response.data!;
		},
		onSuccess: (data) => {
			setAuth(data.user, data.token);

			// Check if there's a pending invite to redirect to
			const pendingInvite = sessionStorage.getItem("pendingInvite");
			if (pendingInvite) {
				sessionStorage.removeItem("pendingInvite");
				router.push(`/groups/join/${pendingInvite}`);
			} else {
				router.push("/groups");
			}
		},
		onError: (error: Error) => {
			form.setError("root", {
				message: error.message || "Sign up failed. Please try again.",
			});
		},
	});

	const onSubmit = async (values: SignupFormValues) => {
		await signupMutation.mutateAsync({
			name: values.name,
			email: values.email,
			password: values.password,
		});
	};

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-purple-900/20" />

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="relative w-full max-w-md"
			>
				{/* Logo */}
				<div className="text-center mb-8">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.1, duration: 0.3 }}
						className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-lg"
					>
						<Wallet className="w-8 h-8 text-white" />
					</motion.div>
					<h1 className="text-3xl font-bold text-white mb-2">TableSplit</h1>
					<p className="text-gray-400 text-sm">Create your account</p>
				</div>

				{/* Signup Card */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, duration: 0.3 }}
					className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl"
				>
					<h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{/* Name Field */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300">Name</FormLabel>
										<FormControl>
											<div className="relative">
												<User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
												<Input
													{...field}
													type="text"
													placeholder="John Doe"
													className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Email Field */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300">Email</FormLabel>
										<FormControl>
											<div className="relative">
												<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
												<Input
													{...field}
													type="email"
													placeholder="you@example.com"
													className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Password Field */}
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300">Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
												<Input
													{...field}
													type="password"
													placeholder="••••••••"
													className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Confirm Password Field */}
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-300">
											Confirm Password
										</FormLabel>
										<FormControl>
											<div className="relative">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
												<Input
													{...field}
													type="password"
													placeholder="••••••••"
													className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Error Message */}
							{form.formState.errors.root && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
								>
									{form.formState.errors.root.message}
								</motion.div>
							)}

							{/* Submit Button */}
							<Button
								type="submit"
								className="w-full bg-primary-600 hover:bg-primary-700 text-white"
								disabled={signupMutation.isPending}
							>
								{signupMutation.isPending ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin mr-2" />
										Creating Account...
									</>
								) : (
									"Create Account"
								)}
							</Button>
						</form>
					</Form>

					{/* Login Link */}
					<div className="mt-6 text-center">
						<p className="text-gray-400 text-sm">
							Already have an account?{" "}
							<Link
								href="/auth/login"
								className="text-primary-500 hover:text-primary-400 font-medium"
							>
								Sign In
							</Link>
						</p>
					</div>
				</motion.div>
			</motion.div>
		</div>
	);
}
