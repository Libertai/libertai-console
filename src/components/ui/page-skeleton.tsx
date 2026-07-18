import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shown while auth is hydrating, in place of a protected route's real content.
export function PageSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-2">
						<Skeleton className="h-9 w-48" />
						<Skeleton className="h-5 w-72" />
					</div>
				</div>
				<Card className="space-y-4">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-24 w-full" />
				</Card>
				<Card className="space-y-4">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-24 w-full" />
				</Card>
			</div>
		</div>
	);
}
