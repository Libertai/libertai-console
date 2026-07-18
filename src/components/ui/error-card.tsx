import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<Card className="flex flex-col items-center gap-3 py-10 text-center">
			<AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden />
			<p className="text-muted-foreground">{message}</p>
			{onRetry && (
				<Button variant="outline" size="sm" onClick={onRetry}>
					Retry
				</Button>
			)}
		</Card>
	);
}
