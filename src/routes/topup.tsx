import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, Coins, CreditCard, HelpCircle } from "lucide-react";
import { useState } from "react";
import { thirdwebClient } from "@/config/thirdweb.ts";
import { PayEmbed, useIsAutoConnecting } from "thirdweb/react";
import { base } from "thirdweb/chains";
import env from "@/config/env.ts";

export const Route = createFileRoute("/topup")({
	component: TopUp,
});

interface PricingTier {
	id: string;
	name: string;
	tokens: number;
	price: number;
	usdcAmount: string;
	popular?: boolean;
}

function TopUp() {
	const isAutoConnecting = useIsAutoConnecting();
	const account = useAccountStore((state) => state.account);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const navigate = useNavigate();
	const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
	const [paymentStage, setPaymentStage] = useState<"select" | "payment" | "success">("select");

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

	// Redirect to home if not logged in
	if (!account && !isAutoConnecting) {
		navigate({ to: "/" });
		return null;
	}

	const handleSelectTier = (tier: PricingTier) => {
		setSelectedTier(tier);
		setPaymentStage("payment");
	};

	const handlePaymentSuccess = () => {
		setPaymentStage("success");
	};

	const handleGoBackToSelection = () => {
		setSelectedTier(null);
		setPaymentStage("select");
	};

	const handleGoToDashboard = () => {
		navigate({ to: "/dashboard" });
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Top Up LTAI Balance</h1>
					<p className="text-muted-foreground mt-1">Purchase LTAI tokens to power your API requests</p>
				</div>

				{paymentStage === "select" && (
					<>
						<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border mb-8">
							<div className="flex items-center gap-3 mb-4">
								<Coins className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Your Current Balance</h2>
							</div>
							<p className="text-3xl font-bold text-primary">{ltaiBalance} LTAI</p>
							<p className="text-sm text-muted-foreground mt-2">
								LTAI tokens are used to pay for API requests. Each token can be used for approximately 1,000 input or
								output tokens.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
							{pricingTiers.map((tier) => (
								<div
									key={tier.id}
									className={`relative bg-card/50 backdrop-blur-sm p-6 rounded-xl border ${
										tier.popular ? "border-primary" : "border-border"
									} hover:border-primary transition-colors`}
								>
									{tier.popular && (
										<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-full">
											Popular
										</div>
									)}
									<h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
									<p className="text-3xl font-bold mb-4">${tier.price}</p>
									<p className="text-sm text-muted-foreground mb-4">{tier.tokens.toLocaleString()} tokens</p>
									<ul className="space-y-2 mb-6">
										<li className="flex items-center text-sm">
											<CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
											<span>Approximately {Math.round(tier.tokens / 1000).toLocaleString()} API calls</span>
										</li>
										<li className="flex items-center text-sm">
											<CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
											<span>Access to all models</span>
										</li>
										<li className="flex items-center text-sm">
											<CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
											<span>No expiration</span>
										</li>
									</ul>
									<Button onClick={() => handleSelectTier(tier)} className="w-full">
										Select
									</Button>
								</div>
							))}
						</div>

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

				{paymentStage === "payment" && selectedTier && (
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

						<div className="flex flex-col md:flex-row gap-8">
							<div className="flex-1">
								<h3 className="text-lg font-medium mb-4">Order Summary</h3>
								<div className="bg-card/70 p-4 rounded-lg border border-border mb-4">
									<div className="flex justify-between mb-2">
										<span className="text-muted-foreground">{selectedTier.name} Plan</span>
										<span>${selectedTier.price}.00</span>
									</div>
									<div className="flex justify-between mb-2 text-sm text-muted-foreground">
										<span>LTAI Tokens</span>
										<span>{selectedTier.tokens.toLocaleString()}</span>
									</div>
									<div className="border-t border-border my-2"></div>
									<div className="flex justify-between font-medium">
										<span>Total</span>
										<span>${selectedTier.price}.00</span>
									</div>
								</div>

								<div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
									<p className="text-sm text-primary-foreground">
										Your LTAI tokens will be deposited directly to your connected wallet after payment. Tokens do not
										expire and can be used anytime.
									</p>
								</div>
							</div>

							<div className="flex-1">
								<h3 className="text-lg font-medium mb-4">Payment Method</h3>
								<div className="bg-card/70 p-4 rounded-lg border border-border">
									{/* Here we use the ThirdWeb PayEmbed component for crypto payments */}
									<PayEmbed
										client={thirdwebClient}
										payOptions={{
											mode: "direct_payment",
											buyWithFiat: false,
											onPurchaseSuccess: handlePaymentSuccess,
											paymentInfo: {
												chain: base,
												sellerAddress: env.PAYMENT_PROCESSOR_CONTRACT_BASE_ADDRESS,
												amount: selectedTier.usdcAmount,
												token: {
													name: "USDC",
													symbol: "USDC",
													address: env.USDC_BASE_ADDRESS,
												},
											},
										}}
										className="w-full!"
									/>

									{/* Add a mock button to simulate successful payment for demo purposes */}
									<Button onClick={handlePaymentSuccess} className="w-full mt-4">
										Simulate Successful Payment
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}

				{paymentStage === "success" && selectedTier && (
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border text-center">
						<div className="flex flex-col items-center gap-4 mb-8">
							<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
								<CheckCircle className="h-8 w-8 text-emerald-400" />
							</div>
							<h2 className="text-2xl font-semibold">Payment Successful!</h2>
							<p className="text-muted-foreground">
								You have successfully purchased {selectedTier.tokens.toLocaleString()} LTAI tokens.
							</p>
						</div>

						<div className="bg-card/70 p-6 rounded-lg border border-border mb-8 max-w-md mx-auto">
							<div className="flex justify-between mb-3">
								<span className="text-muted-foreground">Plan:</span>
								<span className="font-medium">{selectedTier.name}</span>
							</div>
							<div className="flex justify-between mb-3">
								<span className="text-muted-foreground">Amount Paid:</span>
								<span className="font-medium">${selectedTier.price}.00 USDC</span>
							</div>
							<div className="flex justify-between mb-3">
								<span className="text-muted-foreground">Tokens Purchased:</span>
								<span className="font-medium">{selectedTier.tokens.toLocaleString()} LTAI</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Transaction Hash:</span>
								<span className="font-medium text-primary">0x1a2...3b4c</span>
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
