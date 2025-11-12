"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useJoinGroup } from "@/lib/hooks/useGroups";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function JoinGroupPage() {
	const params = useParams();
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const isHydrated = useAuthStore((state) => state.isHydrated);
	const token = params.token as string;
	const hasAttemptedJoin = useRef(false);

	const joinGroupMutation = useJoinGroup();

	// Auto-join when authenticated (only once)
	useEffect(() => {
		if (
			isHydrated &&
			user &&
			token &&
			!hasAttemptedJoin.current &&
			!joinGroupMutation.isSuccess &&
			!joinGroupMutation.isError
		) {
			hasAttemptedJoin.current = true;
			joinGroupMutation.mutate(token);
		}
	}, [user, isHydrated, token]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (isHydrated && !user) {
			// Store the invite token to redirect back after login
			sessionStorage.setItem("pendingInvite", token);
			router.push("/auth/login");
		}
	}, [user, isHydrated, token, router]);

	// Show loading while hydrating or joining
	if (!isHydrated || !user || joinGroupMutation.isPending) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center"
				>
					<Loader2 className="w-16 h-16 text-gold-500 mx-auto mb-4 animate-spin" />
					<h2 className="text-2xl font-bold text-white mb-2">
						Joining group...
					</h2>
					<p className="text-gray-400">Please wait a moment</p>
				</motion.div>
			</div>
		);
	}

	// Show error state
	if (joinGroupMutation.isError) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center max-w-md"
				>
					<XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-white mb-2">
						Unable to Join Group
					</h2>
					<p className="text-gray-400 mb-6">
						{(joinGroupMutation.error as any)?.response?.data?.error ||
							"The invite link may be invalid or expired."}
					</p>
					<Link href="/groups">
						<Button className="bg-primary-600 hover:bg-primary-700">
							Go to My Groups
						</Button>
					</Link>
				</motion.div>
			</div>
		);
	}

	// This state shouldn't be reached since useEffect handles the redirect
	return null;
}
