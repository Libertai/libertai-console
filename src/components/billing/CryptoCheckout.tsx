import { useState } from "react";
import { useQueryState } from "nuqs";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUpAmountInput } from "@/components/payment/TopUpAmountInput";
import { PaymentStage } from "@/components/payment/stages/PaymentStage";
import { useCredits } from "@/hooks/data/use-credits";
import { useAccountStore } from "@/stores/account";

/** The crypto credit-purchase flow ($LTAI / ERC-20 / Solana), embedded in Billing. */
export function CryptoCheckout() {
	const { refreshCredits } = useCredits();
	const account = useAccountStore((state) => state.account);
	const lastTransactionHash = useAccountStore((state) => state.lastTransactionHash);
	const setLastTransactionHash = useAccountStore((state) => state.setLastTransactionHash);

	const [stage, setStage] = useState<"select" | "payment" | "success">("select");
	const [amount, setAmount] = useQueryState("amount", {
		defaultValue: "",
		parse: (value) => (value !== "" ? value : ""),
		serialize: (value) => (value !== undefined ? value.toString() : ""),
	});

	if (stage === "payment") {
		return (
			<PaymentStage
				usdAmount={Number(amount)}
				handleGoBackToSelection={() => {
					setAmount(null);
					setStage("select");
				}}
				handlePaymentSuccess={() => {
					setStage("success");
					refreshCredits();
				}}
			/>
		);
	}

	if (stage === "success") {
		return (
			<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border text-center">
				<div className="flex flex-col items-center gap-4 mb-8">
					<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
						<CheckCircle className="h-8 w-8 text-emerald-400" />
					</div>
					<h2 className="text-2xl font-semibold">Payment Successful!</h2>
					<p className="text-muted-foreground">Your credits will be added to your account shortly.</p>
				</div>
				<div className="bg-card p-6 rounded-lg border border-border mb-8 max-w-md mx-auto">
					<div className="flex justify-between mb-3">
						<span className="text-muted-foreground">Amount Paid:</span>
						<span className="font-medium">${Number(amount).toFixed(2)} USD</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Transaction Hash:</span>
						{lastTransactionHash ? (
							<a
								href={`https://${account?.chain === "solana" ? "explorer.solana.com" : "basescan.org"}/tx/${lastTransactionHash}`}
								target="_blank"
								className="font-medium text-primary hover:underline overflow-hidden text-ellipsis"
							>
								{lastTransactionHash.slice(0, 6)}...{lastTransactionHash.slice(-6)}
								<span className="ml-1 text-xs">↗</span>
							</a>
						) : (
							<span className="font-medium text-primary">Transaction pending</span>
						)}
					</div>
				</div>
				<Button
					onClick={() => {
						setAmount(null);
						setLastTransactionHash(null);
						setStage("select");
					}}
				>
					<span>Buy more credits</span>
					<ChevronRight className="h-4 w-4 ml-2" />
				</Button>
			</div>
		);
	}

	return (
		<TopUpAmountInput
			onSelectAmount={() => {
				setLastTransactionHash(null);
				setStage("payment");
			}}
		/>
	);
}
