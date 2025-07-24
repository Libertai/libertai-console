import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, X } from "lucide-react";

interface ReallocateAgentModalProps {
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
	agentName: string;
}

export function ReallocateAgentModal({
	onConfirm,
	onCancel,
	isLoading = false,
	agentName,
}: Readonly<ReallocateAgentModalProps>) {
	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<RefreshCw className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">Reallocate Instance</h2>
					</div>
					<Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
						<X className="h-4 w-4" />
					</Button>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
						<Bot className="h-5 w-5 text-primary flex-shrink-0" />
						<div>
							<p className="font-medium">{agentName}</p>
							<p className="text-sm text-muted-foreground">Agent instance will be recreated</p>
						</div>
					</div>

					<div className="space-y-3 text-sm text-muted-foreground">
						<p>
							<strong>This action will:</strong>
						</p>
						<ul className="space-y-1 ml-4">
							<li>• Reallocate your agent instance on a new server</li>
							<li>• Assign a new IP address to your agent</li>
							<li>• Take a few minutes to complete</li>
							<li>• Loose any data stored in the instance</li>
						</ul>
					</div>

					<div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
						<p className="text-sm text-amber-800 dark:text-amber-200">
							<strong>Note:</strong> Your agent will be temporarily unavailable during the reallocation process.
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<Button variant="outline" onClick={onCancel} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={onConfirm} disabled={isLoading}>
						{isLoading ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Reallocating...
							</>
						) : (
							<>
								<RefreshCw className="h-4 w-4 mr-2" />
								Reallocate Instance
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
