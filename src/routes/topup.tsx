import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, Coins, CreditCard, HelpCircle, Zap } from "lucide-react";
import AccountButton from "@/components/AccountButton";
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
		<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
			<header className="border-b border-slate-700">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Zap className="h-6 w-6 text-blue-400" />
							<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
								LibertAI Dev
							</h1>
						</div>
						<AccountButton />
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="flex flex-col space-y-8 max-w-4xl mx-auto">
					<div>
						<h1 className="text-3xl font-bold">Top Up LTAI Balance</h1>
						<p className="text-slate-400 mt-1">Purchase LTAI tokens to power your API requests</p>
					</div>

					{paymentStage === "select" && (
						<>
							<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 mb-8">
								<div className="flex items-center gap-3 mb-4">
									<Coins className="h-5 w-5 text-blue-400" />
									<h2 className="text-xl font-semibold">Your Current Balance</h2>
								</div>
								<p className="text-3xl font-bold text-blue-400">{ltaiBalance} LTAI</p>
								<p className="text-sm text-slate-400 mt-2">
									LTAI tokens are used to pay for API requests. Each token can be used for approximately 1,000 input or
									output tokens.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
								{pricingTiers.map((tier) => (
									<div
										key={tier.id}
										className={`relative bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border ${
											tier.popular ? "border-blue-500" : "border-slate-700"
										} hover:border-blue-400 transition-colors`}
									>
										{tier.popular && (
											<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs py-1 px-3 rounded-full">
												Popular
											</div>
										)}
										<h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
										<p className="text-3xl font-bold mb-4">${tier.price}</p>
										<p className="text-sm text-slate-300 mb-4">{tier.tokens.toLocaleString()} tokens</p>
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
										<Button
											onClick={() => handleSelectTier(tier)}
											className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
										>
											Select
										</Button>
									</div>
								))}
							</div>

							<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
								<div className="flex items-center gap-3 mb-4">
									<HelpCircle className="h-5 w-5 text-blue-400" />
									<h2 className="text-xl font-semibold">Pricing Details</h2>
								</div>
								<div className="space-y-4 text-slate-300">
									<p>
										LibertAI tokens (LTAI) are used to pay for API requests based on the number of tokens processed.
										Token usage is calculated based on the combined input and output tokens for each request.
									</p>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
										<div className="border border-slate-700 rounded-lg overflow-hidden">
											<div className="bg-slate-700 px-4 py-2">
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

										<div className="border border-slate-700 rounded-lg overflow-hidden">
											<div className="bg-slate-700 px-4 py-2">
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
						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex justify-between items-center mb-8">
								<div className="flex items-center gap-3">
									<CreditCard className="h-5 w-5 text-blue-400" />
									<h2 className="text-xl font-semibold">Payment</h2>
								</div>
								<Button variant="outline" size="sm" onClick={handleGoBackToSelection} className="border-slate-600">
									Back to selection
								</Button>
							</div>

							<div className="flex flex-col md:flex-row gap-8">
								<div className="flex-1">
									<h3 className="text-lg font-medium mb-4">Order Summary</h3>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-4">
										<div className="flex justify-between mb-2">
											<span className="text-slate-300">{selectedTier.name} Plan</span>
											<span>${selectedTier.price}.00</span>
										</div>
										<div className="flex justify-between mb-2 text-sm text-slate-400">
											<span>LTAI Tokens</span>
											<span>{selectedTier.tokens.toLocaleString()}</span>
										</div>
										<div className="border-t border-slate-700 my-2"></div>
										<div className="flex justify-between font-medium">
											<span>Total</span>
											<span>${selectedTier.price}.00</span>
										</div>
									</div>

									<div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
										<p className="text-sm text-blue-300">
											Your LTAI tokens will be deposited directly to your connected wallet after payment. Tokens do not
											expire and can be used anytime.
										</p>
									</div>
								</div>

								<div className="flex-1">
									<h3 className="text-lg font-medium mb-4">Payment Method</h3>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
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
										<Button
											onClick={handlePaymentSuccess}
											className="w-full mt-4 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
										>
											Simulate Successful Payment
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}

					{paymentStage === "success" && selectedTier && (
						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 text-center">
							<div className="flex flex-col items-center gap-4 mb-8">
								<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
									<CheckCircle className="h-8 w-8 text-emerald-400" />
								</div>
								<h2 className="text-2xl font-semibold">Payment Successful!</h2>
								<p className="text-slate-300">
									You have successfully purchased {selectedTier.tokens.toLocaleString()} LTAI tokens.
								</p>
							</div>

							<div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 mb-8 max-w-md mx-auto">
								<div className="flex justify-between mb-3">
									<span className="text-slate-400">Plan:</span>
									<span className="font-medium">{selectedTier.name}</span>
								</div>
								<div className="flex justify-between mb-3">
									<span className="text-slate-400">Amount Paid:</span>
									<span className="font-medium">${selectedTier.price}.00 USDC</span>
								</div>
								<div className="flex justify-between mb-3">
									<span className="text-slate-400">Tokens Purchased:</span>
									<span className="font-medium">{selectedTier.tokens.toLocaleString()} LTAI</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-400">Transaction Hash:</span>
									<span className="font-medium text-blue-400">0x1a2...3b4c</span>
								</div>
							</div>

							<Button
								onClick={handleGoToDashboard}
								size="lg"
								className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
							>
								<span>Go to Dashboard</span>
								<ChevronRight className="h-4 w-4 ml-2" />
							</Button>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
