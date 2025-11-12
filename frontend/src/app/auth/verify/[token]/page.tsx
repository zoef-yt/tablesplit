"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useVerifyMagicLink } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyMagicLinkPage() {
	const params = useParams();
	const router = useRouter();
	const token = params.token as string;

	const { data, isLoading, isError, error } = useVerifyMagicLink(token);

	useEffect(() => {
		if (data && !isError) {
			setTimeout(() => router.push("/groups"), 1000);
		}
	}, [data, isError, router]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-center"
			>
				{isLoading && (
					<>
						<Loader2 className="w-16 h-16 text-gold-500 mx-auto mb-4 animate-spin" />
						<h2 className="text-2xl font-bold text-white mb-2">
							Verifying your link...
						</h2>
						<p className="text-gray-400">Please wait a moment</p>
					</>
				)}

				{data && !isError ? (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200 }}
					>
						<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-white mb-2">
							Welcome back! 🎰
						</h2>
						<p className="text-gray-400">Redirecting to your groups...</p>
					</motion.div>
				) : null}

				{isError && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200 }}
					>
						<XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-white mb-2">
							Verification Failed
						</h2>
						<p className="text-gray-400 mb-6">
							{(error as any)?.response?.data?.error ||
								"Invalid or expired magic link"}
						</p>
						<Link href="/auth/login">
							<Button>Back to Login</Button>
						</Link>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
