"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { slideInRight } from "@/lib/animations";

interface PageTransitionProps {
	children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={pathname}
				variants={slideInRight}
				initial="hidden"
				animate="visible"
				exit="exit"
				className="h-full"
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
