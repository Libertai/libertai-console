import { createFileRoute } from "@tanstack/react-router";
import { useRequireAuth } from "@/hooks/use-auth";
import { PlansSection } from "@libertai/auth";
import { BuyCreditsSection } from "@/components/billing/BuyCreditsSection";
import { TransactionHistory } from "@/components/billing/TransactionHistory";

export const Route = createFileRoute("/billing")({
	component: Billing,
});

// Subscription plans are hidden for now. Flip to re-enable the plan cards.
const SHOW_PLANS = true;

function Billing() {
	const { isAuthenticated } = useRequireAuth();
	if (!isAuthenticated) return null;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-10 max-w-5xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Billing</h1>
					<p className="text-muted-foreground mt-1">Buy credits and review your transactions</p>
				</div>

				{SHOW_PLANS && <PlansSection />}
				<BuyCreditsSection />
				<TransactionHistory />
			</div>
		</div>
	);
}
