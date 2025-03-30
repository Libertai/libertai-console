import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, CreditCard, HelpCircle, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { thirdwebClient } from "@/config/thirdweb.ts";
import { PayEmbed, useIsAutoConnecting } from "thirdweb/react";
import { base } from "thirdweb/chains";
import env from "@/config/env.ts";
import { TopUpAmountInput } from "@/components/TopUpAmountInput";
import { useCredits } from "@/hooks/data/use-credits";
import { PaymentMethod, PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { LTAIPaymentForm } from "@/components/LTAIPaymentForm";
import { useQueryState } from "nuqs";

export const Route = createFileRoute("/topup")({
	component: TopUp,
});

type PricingTier = {
	id: string;
	name: string;
	tokens: number;
	price: number;
	usdcAmount: string;
	popular?: boolean;
};

function TopUp() {
	const isAutoConnecting = useIsAutoConnecting();

	const account = useAccountStore((state) => state.account);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const lastTransactionHash = useAccountStore((state) => state.lastTransactionHash);
	const setLastTransactionHash = useAccountStore((state) => state.setLastTransactionHash);

	const { formattedCredits } = useCredits();
	const navigate = useNavigate();

	// Use nuqs for URL state
	const [stage, setStage] = useQueryState("stage", {
		defaultValue: "select",
		parse: (value): "select" | "payment" | "success" => {
			if (value === "payment" || value === "success") return value;
			return "select";
		},
	});
	const [amount, setAmount] = useQueryState("amount", {
		defaultValue: "",
		parse: (value) => (value !== "" ? value : ""),
		serialize: (value) => (value !== undefined ? value.toString() : ""),
	});
	const [method, setMethod] = useQueryState("method", {
		defaultValue: "crypto",
		parse: (value): PaymentMethod => {
			if (value === "ltai") return "ltai";
			return "crypto";
		},
	});

	const { refreshCredits } = useCredits();
	const hasLTAI = ltaiBalance > 0;

	// Effect to set initial payment method
	useEffect(() => {
		// Default to crypto payment if user has no LTAI tokens and no method is set
		if (!hasLTAI && method === "crypto") {
			setMethod("crypto");
		}
	}, [hasLTAI, method, setMethod]);

	// Pricing tiers
	const pricingTiers: PricingTier[] = [
		{
			id: "starter",
			name: "Starter",
			tokens: 100000,
			price: 5,
			usdcAmount: "5",
		},
		{
			id: "pro",
			name: "Professional",
			tokens: 500000,
			price: 20,
			usdcAmount: "20",
			popular: true,
		},
		{
			id: "business",
			name: "Business",
			tokens: 2000000,
			price: 75,
			usdcAmount: "75",
		},
		{
			id: "enterprise",
			name: "Enterprise",
			tokens: 10000000,
			price: 350,
			usdcAmount: "350",
		},
	];

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated && !isAutoConnecting) {
		return null;
	}

	const handleSelectAmount = () => {
		// The input amount is already in the URL via useQueryState
		setStage("payment");
		// Reset transaction hash when starting a new payment
		setLastTransactionHash(null);
	};

	const handlePaymentSuccess = () => {
		setStage("success");
		refreshCredits();
	};

	const handleGoBackToSelection = () => {
		setAmount(null);
		setStage("select");
	};

	const handleGoToDashboard = () => {
		navigate({ to: "/dashboard" });
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8 max-w-5xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Top Up balance</h1>
					<p className="text-muted-foreground mt-1">Purchase credits to power your API requests</p>
				</div>

				{stage === "select" && (
					<>
						<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border mb-8">
							<div className="flex flex-col md:flex-row gap-6">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-4">
										<Zap className="h-5 w-5 text-primary" />
										<h2 className="text-xl font-semibold">Credits balance</h2>
									</div>
									<p className="text-3xl font-bold text-primary">${formattedCredits}</p>
									<p className="text-sm text-muted-foreground mt-2">
										API credits are used for API requests and are available immediately after purchase.
										<br />
										You can buy credits with $LTAI or main ERC-20 tokens on multiple chains.
									</p>
								</div>
							</div>
						</div>

						{/* Custom amount input component */}
						<TopUpAmountInput pricingTiers={pricingTiers} onSelectAmount={handleSelectAmount} />

						<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
							<div className="flex items-center gap-3 mb-4">
								<HelpCircle className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Pricing Details</h2>
							</div>
							<div className="space-y-4 text-card-foreground">
								<p>
									LibertAI tokens (LTAI) are used to pay for API requests based on the number of tokens processed. Token
									usage is calculated based on the combined input and output tokens for each request.
								</p>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
									<div className="border border-border rounded-lg overflow-hidden">
										<div className="bg-secondary px-4 py-2">
											<h3 className="font-medium">Base Model (libertai-7b)</h3>
										</div>
										<div className="p-4">
											<p className="flex justify-between mb-2">
												<span>Input tokens:</span>
												<span className="font-medium">0.0001 LTAI / token</span>
											</p>
											<p className="flex justify-between">
												<span>Output tokens:</span>
												<span className="font-medium">0.0002 LTAI / token</span>
											</p>
										</div>
									</div>

									<div className="border border-border rounded-lg overflow-hidden">
										<div className="bg-secondary px-4 py-2">
											<h3 className="font-medium">Advanced Model (libertai-34b)</h3>
										</div>
										<div className="p-4">
											<p className="flex justify-between mb-2">
												<span>Input tokens:</span>
												<span className="font-medium">0.0002 LTAI / token</span>
											</p>
											<p className="flex justify-between">
												<span>Output tokens:</span>
												<span className="font-medium">0.0004 LTAI / token</span>
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}

				{stage === "payment" && (
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex justify-between items-center mb-8">
							<div className="flex items-center gap-3">
								<CreditCard className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Payment</h2>
							</div>
							<Button variant="outline" size="sm" onClick={handleGoBackToSelection}>
								Back to selection
							</Button>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div>
								<h3 className="text-lg font-medium mb-4">Order Summary</h3>
								<div className="bg-card p-4 rounded-lg border border-border mb-4">
									<div className="flex justify-between mb-2">
										<span className="text-muted-foreground">Credits top-up</span>
										<span>${Number(amount).toFixed(2)}</span>
									</div>
									<div className="border-t border-border my-2"></div>
									<div className="flex justify-between font-medium">
										<span>Total</span>
										<span>${Number(amount).toFixed(2)}</span>
									</div>
								</div>

								<div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
									<p className="text-sm text-foreground">
										Your credits will be deposited directly to your connected wallet after payment. Credits do not
										expire and can be used anytime.
									</p>
								</div>

								{/* Payment Method Selector */}
								<div className="mt-6">
									<PaymentMethodSelector
										onSelectMethod={setMethod}
										selectedMethod={method as PaymentMethod}
										hasLTAI={hasLTAI}
									/>
								</div>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Payment Method</h3>
								<div className="bg-card p-4 rounded-lg border border-border">
									{method === "crypto" ? (
										/* ThirdWeb PayEmbed component for crypto payments */
										<PayEmbed
											client={thirdwebClient}
											payOptions={{
												mode: "direct_payment",
												buyWithFiat: false,
												onPurchaseSuccess: (data) => {
													// Store transaction hash if available
													if (data.type === "transaction") {
														setLastTransactionHash(data.transactionHash);
													}
													handlePaymentSuccess();
												},
												purchaseData: {
													userAddress: account?.address,
												},
												paymentInfo: {
													chain: base,
													sellerAddress: env.PAYMENT_PROCESSOR_CONTRACT_BASE_ADDRESS,
													amount: amount.toString(),
													token: {
														name: "USDC",
														symbol: "USDC",
														address: env.USDC_BASE_ADDRESS,
													},
												},
											}}
											className="!w-full"
										/>
									) : (
										/* LTAI Payment Form */
										<LTAIPaymentForm usdAmount={Number(amount)} onPaymentSuccess={handlePaymentSuccess} />
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{stage === "success" && (
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
								<span className="font-medium">
									${Number(amount).toFixed(2)} {method === "ltai" ? "in LTAI" : "USDC"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Transaction Hash:</span>
								{lastTransactionHash ? (
									<a
										href={`https://basescan.org/tx/${useAccountStore.getState().lastTransactionHash}`}
										target="_blank"
										className="font-medium text-primary hover:underline overflow-hidden text-ellipsis"
									>
										{lastTransactionHash}
										<span className="ml-1 text-xs">↗</span>
									</a>
								) : (
									<span className="font-medium text-primary">Transaction pending</span>
								)}
							</div>
						</div>

						<Button onClick={handleGoToDashboard} size="lg">
							<span>Go to Dashboard</span>
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
