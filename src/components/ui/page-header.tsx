import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 className="text-3xl font-bold">{title}</h1>
				{description && <p className="text-muted-foreground mt-1">{description}</p>}
			</div>
			{action}
		</div>
	);
}
