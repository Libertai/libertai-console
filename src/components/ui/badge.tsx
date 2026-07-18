import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
	success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	destructive: "bg-red-500/15 text-red-700 dark:text-red-400",
	info: "bg-primary/15 text-primary",
	outline: "border border-border text-muted-foreground",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: keyof typeof variants;
}

export function Badge({ variant = "outline", className, ...props }: BadgeProps) {
	return (
		<span
			className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", variants[variant], className)}
			{...props}
		/>
	);
}
