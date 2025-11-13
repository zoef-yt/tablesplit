import { Transition, Variants } from "framer-motion";

/**
 * Apple-style spring animation presets
 * Using spring physics for natural, smooth motion
 */

export const spring = {
	// Smooth spring (default for most UI elements)
	smooth: {
		type: "spring" as const,
		stiffness: 300,
		damping: 30,
	},
	// Bouncy spring (for playful interactions)
	bouncy: {
		type: "spring" as const,
		stiffness: 400,
		damping: 25,
	},
	// Snappy spring (for quick, responsive feedback)
	snappy: {
		type: "spring" as const,
		stiffness: 500,
		damping: 35,
	},
	// Gentle spring (for subtle animations)
	gentle: {
		type: "spring" as const,
		stiffness: 200,
		damping: 25,
	},
};

/**
 * Common animation variants for consistent motion
 */

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: spring.smooth,
	},
};

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: spring.smooth,
	},
};

export const fadeInDown: Variants = {
	hidden: { opacity: 0, y: -20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: spring.smooth,
	},
};

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: spring.bouncy,
	},
};

export const slideInRight: Variants = {
	hidden: { opacity: 0, x: 100 },
	visible: {
		opacity: 1,
		x: 0,
		transition: spring.smooth,
	},
	exit: {
		opacity: 0,
		x: -100,
		transition: spring.smooth,
	},
};

export const slideInLeft: Variants = {
	hidden: { opacity: 0, x: -100 },
	visible: {
		opacity: 1,
		x: 0,
		transition: spring.smooth,
	},
	exit: {
		opacity: 0,
		x: 100,
		transition: spring.smooth,
	},
};

export const slideInBottom: Variants = {
	hidden: { y: "100%" },
	visible: {
		y: 0,
		transition: spring.smooth,
	},
	exit: {
		y: "100%",
		transition: spring.smooth,
	},
};

export const staggerChildren: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.07,
			delayChildren: 0.1,
		},
	},
};

export const listItem: Variants = {
	hidden: { opacity: 0, x: -20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: spring.smooth,
	},
};

/**
 * Haptic feedback utilities
 */

export function haptic(style: "light" | "medium" | "heavy" = "light") {
	if (typeof window !== "undefined" && "vibrate" in navigator) {
		const patterns = {
			light: 10,
			medium: 20,
			heavy: 30,
		};
		navigator.vibrate(patterns[style]);
	}
}

/**
 * Button press animation
 * Scales down slightly on press for tactile feedback
 */
export const buttonPress = {
	whileTap: { scale: 0.97 },
	transition: spring.snappy,
};

/**
 * Card hover animation
 */
export const cardHover = {
	whileHover: { scale: 1.02, y: -2 },
	whileTap: { scale: 0.98 },
	transition: spring.smooth,
};
