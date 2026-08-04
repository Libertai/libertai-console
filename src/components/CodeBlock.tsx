import { CopyButton } from "@libertai/ui/copy-button";
import { cn } from "@/lib/utils";

export function CodeBlock({
	value,
	copyLabel,
	className,
}: {
	value: string;
	copyLabel?: string;
	className?: string;
}) {
	return (
		<div className={cn("relative rounded-md border border-border/50 bg-secondary/50 p-4", className)}>
			{/* pr-12 keeps the copy button off the first line — the install one-liner is 99 chars. */}
			<pre className="overflow-x-auto pr-12 font-mono text-sm whitespace-pre-wrap">{value}</pre>
			<div className="absolute top-2 right-2">
				<CopyButton value={value} label={copyLabel} />
			</div>
		</div>
	);
}
