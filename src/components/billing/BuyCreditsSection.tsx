import { useMemo, useState } from "react";
import { Coins, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CryptoCheckout } from "@/components/billing/CryptoCheckout";
import { useBillingActions, usePaymentProviders } from "@/hooks/data/use-payments";

export function BuyCreditsSection() {
	const { data: providers } = usePaymentProviders();
	const { topup } = useBillingActions();
	const [method, setMethod] = useState<"card" | "crypto">("card");
	const [amount, setAmount] = useState("10");

	const fiatProvider = useMemo(() => providers?.find((p) => p.kind === "fiat"), [providers]);

	return (
		<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
			<div className="flex items-center gap-3 mb-1">
				<Coins className="h-5 w-5 text-primary" />
				<h2 className="text-xl font-semibold">Buy prepaid credits</h2>
			</div>
			<p className="text-sm text-muted-foreground mb-5">
				One-off credits that never expire — used once your plan allowance runs out.
			</p>

			{/* Method tabs */}
			<div className="inline-flex rounded-lg border border-border p-1 bg-background mb-6">
				<Button variant={method === "card" ? "default" : "ghost"} size="sm" onClick={() => setMethod("card")}>
					<CreditCard className="h-4 w-4 mr-2" /> Card
				</Button>
				<Button variant={method === "crypto" ? "default" : "ghost"} size="sm" onClick={() => setMethod("crypto")}>
					<Wallet className="h-4 w-4 mr-2" /> Crypto
				</Button>
			</div>

			{method === "card" ? (
				<div className="max-w-md">
					{fiatProvider ? (
						<>
							<label className="text-sm text-muted-foreground">Amount (USD)</label>
							<div className="flex items-center gap-3 mt-2">
								<div className="flex items-center gap-2 flex-1">
									<span className="text-muted-foreground">$</span>
									<Input
										type="number"
										min="1"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
									/>
								</div>
								<Button
									onClick={() => topup.mutate({ provider: fiatProvider.id, amount: Number(amount) })}
									disabled={topup.isPending || Number(amount) <= 0}
								>
									<CreditCard className="h-4 w-4 mr-2" /> Pay with card
								</Button>
							</div>
							<p className="text-xs text-muted-foreground mt-3">
								You'll be redirected to {fiatProvider.label} to complete payment securely.
							</p>
						</>
					) : (
						<p className="text-sm text-muted-foreground">Card payments are not yet configured.</p>
					)}
				</div>
			) : (
				<CryptoCheckout />
			)}
		</div>
	);
}
