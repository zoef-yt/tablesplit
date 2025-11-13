import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/animations";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
	{
		variants: {
			variant: {
				default: "bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30",
				destructive: "bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/30",
				outline:
					"border-2 border-gray-700 bg-gray-800/50 text-white shadow-sm hover:bg-gray-800 hover:border-gray-600 backdrop-blur-sm",
				secondary: "bg-gray-800 text-white shadow-sm hover:bg-gray-700",
				ghost: "hover:bg-gray-800 hover:text-white",
				link: "text-primary-400 underline-offset-4 hover:underline hover:text-primary-300",
			},
			size: {
				default: "h-11 px-5 py-2.5",
				sm: "h-9 rounded-lg px-3.5 text-xs",
				lg: "h-12 rounded-xl px-8 text-base",
				icon: "h-11 w-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	disableHaptic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, onClick, disableHaptic, ...props }, ref) => {
		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			if (!disableHaptic) {
				haptic("light");
			}
			onClick?.(e);
		};

		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				onClick={handleClick}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
