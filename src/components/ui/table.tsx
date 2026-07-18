import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
	return (
		<div className="overflow-x-auto">
			<table className={cn("w-full", className)} {...props} />
		</div>
	);
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className="border-b border-border" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className="divide-y divide-border" {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
	return <tr className={cn("hover:bg-hover transition-colors", className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
	return <th className={cn("px-4 py-3 text-left text-sm font-medium text-muted-foreground", className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={cn("px-4 py-3 text-sm", className)} {...props} />;
}

interface SortableTableHeadProps {
	label: string;
	active: boolean;
	direction: "asc" | "desc";
	onSort: () => void;
}

export function SortableTableHead({ label, active, direction, onSort }: SortableTableHeadProps) {
	const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
	return (
		<TableHead>
			<button
				type="button"
				onClick={onSort}
				aria-label={`Sort by ${label}`}
				className="flex items-center gap-1 hover:text-foreground transition-colors"
			>
				{label}
				<Icon className="h-3.5 w-3.5" aria-hidden />
			</button>
		</TableHead>
	);
}
