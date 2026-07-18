import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
	title: string;
	icon?: ReactNode;
	value: ReactNode;
	isLoading?: boolean;
	footer?: string;
	action?: ReactNode;
}

export function StatCard({ title, icon, value, isLoading, footer, action }: StatCardProps) {
	return (
		<Card>
			<div className="flex items-center gap-3 mb-2">
				{icon}
				<h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
			</div>
			{isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-3xl font-bold">{value}</p>}
			{action && <div className="mt-4">{action}</div>}
			{footer && <p className="text-xs text-muted-foreground mt-4">{footer}</p>}
		</Card>
	);
}
