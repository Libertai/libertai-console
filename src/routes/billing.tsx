import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRequireAuth } from "@/hooks/use-auth";
import { PlansSection, UsageCreditsCard, useSubscription } from "@libertai/auth";
import { TransactionHistory } from "@/components/billing/TransactionHistory";

export const Route = createFileRoute("/billing")({
	component: Billing,
});

// Subscription plans are hidden for now. Flip to re-enable the plan cards.
const SHOW_PLANS = true;

function Billing() {
	const { isAuthenticated } = useRequireAuth();
	const navigate = useNavigate();
	const { data: subscription } = useSubscription();
	if (!isAuthenticated) return null;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-10 max-w-5xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Billing</h1>
					<p className="text-muted-foreground mt-1">Manage your plan, buy credits, and review your transactions</p>
				</div>

				{SHOW_PLANS && <PlansSection />}
				<UsageCreditsCard
						balance={subscription?.prepaid_balance ?? 0}
						description="Used once your plan allowance runs out. Top up after you hit a limit."
						onBuyCredits={() => navigate({ to: "/top-up" })}
					/>
				<TransactionHistory />
			</div>
		</div>
	);
}
