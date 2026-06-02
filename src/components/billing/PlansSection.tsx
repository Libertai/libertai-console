import { useMemo } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillingActions, usePaymentProviders, useSubscription, useTiers } from "@/hooks/data/use-payments";

// Qualitative descriptions — we deliberately don't surface raw allowance numbers.
const TIER_TAGLINES: Record<string, string> = {
	free: "For getting started and light use",
	starter: "For regular individual use",
	pro: "For heavy, daily workloads",
	team: "Maximum limits for teams",
};

export function PlansSection() {
	const { data: subscription } = useSubscription();
	const { data: tiers } = useTiers();
	const { data: providers } = usePaymentProviders();
	const { subscribe, upgrade, downgrade, cancel } = useBillingActions();

	const fiatProvider = useMemo(() => providers?.find((p) => p.kind === "fiat"), [providers]);
	const tierOrder = useMemo(() => {
		const map: Record<string, number> = {};
		(tiers ?? []).forEach((t, i) => (map[t.name] = i));
		return map;
	}, [tiers]);

	const currentTier = subscription?.tier ?? "free";
	const hasActivePaidSub =
		!!subscription?.has_subscription && subscription?.status === "active" && currentTier !== "free";

	const handleTierAction = (tierName: string) => {
		const provider = fiatProvider?.id ?? "revolut";
		const target = tierOrder[tierName] ?? 0;
		const current = tierOrder[currentTier] ?? 0;
		if (tierName === "free") {
			downgrade.mutate({ tier: "free" });
		} else if (target > current) {
			(hasActivePaidSub ? upgrade : subscribe).mutate({ provider, tier: tierName });
		} else if (target < current) {
			downgrade.mutate({ tier: tierName });
		}
	};

	return (
		<div className="flex flex-col space-y-4">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div className="flex items-center gap-3">
					<Zap className="h-5 w-5 text-primary" />
					<h2 className="text-xl font-semibold">
						Plan: <span className="capitalize text-primary">{currentTier}</span>
					</h2>
				</div>
				{hasActivePaidSub &&
					(subscription?.cancel_at_period_end ? (
						<span className="text-sm text-muted-foreground">Cancels at period end</span>
					) : (
						<Button variant="outline" size="sm" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
							Cancel subscription
						</Button>
					))}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{(tiers ?? []).map((tier) => {
					const isCurrent = tier.name === currentTier;
					return (
						<div
							key={tier.name}
							className={`p-6 rounded-xl border ${isCurrent ? "border-primary" : "border-border"} bg-card/50 flex flex-col`}
						>
							<h3 className="text-lg font-semibold capitalize">{tier.name}</h3>
							<p className="text-2xl font-bold mt-2">
								{tier.price_cents === 0 ? "Free" : `€${(tier.price_cents / 100).toFixed(0)}`}
								{tier.price_cents > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
							</p>
							<p className="mt-4 text-sm text-muted-foreground flex-1">{TIER_TAGLINES[tier.name] ?? ""}</p>
							<Button
								className="mt-4 w-full"
								variant={isCurrent ? "outline" : "default"}
								disabled={isCurrent || (tier.is_paid && !fiatProvider)}
								onClick={() => handleTierAction(tier.name)}
							>
								{isCurrent
									? "Current plan"
									: (tierOrder[tier.name] ?? 0) > (tierOrder[currentTier] ?? 0)
										? "Upgrade"
										: "Downgrade"}
							</Button>
						</div>
					);
				})}
			</div>
			{!fiatProvider && (
				<p className="text-xs text-muted-foreground">Paid plans become available once card payments are configured.</p>
			)}
		</div>
	);
}
