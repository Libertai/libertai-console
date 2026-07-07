import { useLocation, useNavigate } from "@tanstack/react-router";
import { PlansSection, TransactionHistory, UsageCreditsCard, useAccountStore, useSubscription } from "@libertai/auth";

// Shared by the /billing and /plans routes. Signed-out visitors can browse plans;
// any billing action bounces to login and returns here.
export function BillingPlans() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const { data: subscription } = useSubscription();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-10 max-w-5xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Billing</h1>
					<p className="text-muted-foreground mt-1">Manage your plan, buy credits, and review your transactions</p>
				</div>

				<PlansSection onRequireAuth={() => navigate({ to: "/login", search: { redirect: pathname } })} />

				{/* Balance + transactions only make sense for a signed-in user; plans stay visible to all. */}
				{isAuthenticated && (
					<>
						<UsageCreditsCard
							balance={subscription?.prepaid_balance ?? 0}
							description="Used once your plan allowance runs out. Top up after you hit a limit."
							onBuyCredits={() => navigate({ to: "/top-up" })}
						/>
						<TransactionHistory />
					</>
				)}
			</div>
		</div>
	);
}
