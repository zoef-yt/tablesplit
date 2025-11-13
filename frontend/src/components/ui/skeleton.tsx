"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
	className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-gray-800/50",
				className
			)}
			{...props}
		/>
	);
}

export function ExpenseSkeleton() {
	return (
		<div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<Skeleton className="h-5 w-3/4 mb-2" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<div className="text-right">
					<Skeleton className="h-6 w-20 mb-1 ml-auto" />
					<Skeleton className="h-4 w-16 ml-auto" />
				</div>
			</div>
		</div>
	);
}

export function GroupSkeleton() {
	return (
		<div className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50">
			<div className="flex items-center justify-between mb-4">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-10 w-10 rounded-full" />
			</div>
			<Skeleton className="h-4 w-24" />
		</div>
	);
}

export function BalanceSkeleton() {
	return (
		<div className="p-6 rounded-xl bg-gray-800/30 border border-gray-700">
			<Skeleton className="h-4 w-24 mb-2" />
			<Skeleton className="h-8 w-32" />
		</div>
	);
}
