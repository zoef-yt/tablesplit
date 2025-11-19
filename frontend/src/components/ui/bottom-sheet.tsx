"use client";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useState } from "react";
import { spring, slideInBottom } from "@/lib/animations";

interface BottomSheetProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
	subtitle?: string;
	snapPoints?: number[]; // Percentage heights to snap to
}

export function BottomSheet({
	isOpen,
	onClose,
	children,
	title,
	subtitle,
	snapPoints = [90],
}: BottomSheetProps) {
	const [currentSnap, setCurrentSnap] = useState(0);

	const handleDragEnd = (_: any, info: PanInfo) => {
		// If dragged down significantly, close
		if (info.offset.y > 100 || info.velocity.y > 500) {
			onClose();
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={spring.smooth}
						onClick={onClose}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
					/>

					{/* Bottom Sheet */}
					<motion.div
						variants={slideInBottom}
						initial="hidden"
						animate="visible"
						exit="exit"
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.5 }}
						onDragEnd={handleDragEnd}
						className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden"
						style={{ height: `${snapPoints[currentSnap]}%` }}
					>
						{/* Drag Handle */}
						<div className="flex justify-center pt-3 pb-2">
							<div className="w-10 h-1.5 bg-gray-700 rounded-full" />
						</div>

						{/* Header */}
						{(title || subtitle) && (
							<div className="px-6 pb-4 border-b border-gray-800">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										{title && (
											<h3 className="text-lg font-semibold text-white">
												{title}
											</h3>
										)}
										{subtitle && (
											<p className="text-sm text-gray-400 mt-1">
												{subtitle}
											</p>
										)}
									</div>
									<button
										onClick={onClose}
										className="p-2 -mr-2 hover:bg-gray-800 rounded-full transition-colors"
									>
										<X className="w-5 h-5 text-gray-400" />
									</button>
								</div>
							</div>
						)}

						{/* Content */}
						<div className="overflow-y-auto px-6 py-4 h-full">
							{children}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
