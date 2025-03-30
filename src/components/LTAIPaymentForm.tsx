import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccountStore } from "@/stores/account";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { approve } from "thirdweb/extensions/erc20";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/config/thirdweb";
import env from "@/config/env";
import { useLTAIPrice } from "@/hooks/use-ltai-price";
import { prepareContractCall, sendTransaction } from "thirdweb";

interface LTAIPaymentFormProps {
	usdAmount: number;
	onPaymentSuccess: () => void;
}

export function LTAIPaymentForm({ usdAmount, onPaymentSuccess }: Readonly<LTAIPaymentFormProps>) {
	const [isApproving, setIsApproving] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isApproved, setIsApproved] = useState(false);

	const account = useAccountStore((state) => state.account);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const getLTAIBalance = useAccountStore((state) => state.getLTAIBalance);
	const setLastTransactionHash = useAccountStore((state) => state.setLastTransactionHash);

	const { price: ltaiPrice, isLoading, getRequiredLTAI } = useLTAIPrice();
	const ltaiAmount = getRequiredLTAI(usdAmount);

	const LTAI_CONTRACT_ADDRESS = env.LTAI_BASE_ADDRESS as `0x${string}`;
	const PAYMENT_PROCESSOR_ADDRESS = env.PAYMENT_PROCESSOR_CONTRACT_BASE_ADDRESS as `0x${string}`;

	const handleApprovePayment = async () => {
		if (!account || !ltaiPrice || !ltaiAmount) return;

		setIsApproving(true);
		try {
			// Approve the payment processor to spend LTAI tokens
			const tx = approve({
				contract: {
					address: LTAI_CONTRACT_ADDRESS,
					chain: base,
					client: thirdwebClient,
				},
				spender: PAYMENT_PROCESSOR_ADDRESS,
				amount: ltaiAmount.toString(),
			});

			await sendTransaction({ transaction: tx, account });

			toast.success("Approval successful", {
				description: "Now you can proceed with the payment",
			});

			// Set approval state to true
			setIsApproved(true);

			// After approval, update the LTAI balance
			await getLTAIBalance();
		} catch (error) {
			console.error("Approval error:", error);
			toast.error("Approval failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsApproving(false);
		}
	};

	const handleProcessPayment = async () => {
		if (!account || !ltaiPrice || !ltaiAmount) return;

		setIsProcessing(true);
		try {
			// Call the processPayment function using method directly
			const transaction = prepareContractCall({
				contract: {
					address: PAYMENT_PROCESSOR_ADDRESS,
					abi: [
						{
							inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
							name: "processPayment",
							outputs: [],
							stateMutability: "nonpayable",
							type: "function",
						},
					],
					chain: base,
					client: thirdwebClient,
				},
				method: "processPayment",
				params: [BigInt(ltaiAmount * 10 ** 18)],
			});

			// Send the transaction
			const { transactionHash } = await sendTransaction({
				transaction,
				account,
			});

			// Store the transaction hash for display
			setLastTransactionHash(transactionHash);

			toast.success("Payment successful", {
				description: "Your credits will be added to your account shortly",
			});

			// After successful payment, update the LTAI balance and call the success handler
			await getLTAIBalance();
			onPaymentSuccess();
		} catch (error) {
			console.error("Payment error:", error);
			toast.error("Payment failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-6">
				<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
				<p>Calculating LTAI amount...</p>
			</div>
		);
	}

	const hasEnoughLTAI = ltaiBalance >= ltaiAmount;

	return (
		<div className="space-y-6">
			<div className="bg-card p-4 rounded-lg border border-border">
				<div className="flex justify-between mb-2">
					<span className="text-muted-foreground">USD Amount</span>
					<span>${usdAmount.toFixed(2)}</span>
				</div>
				<div className="flex justify-between mb-2">
					<span className="text-muted-foreground">LTAI Price</span>
					<span>${ltaiPrice.toFixed(4)} per LTAI</span>
				</div>
				<div className="border-t border-border my-2"></div>
				<div className="flex justify-between font-medium">
					<span>LTAI Required</span>
					<span>{ltaiAmount.toFixed(2)} LTAI</span>
				</div>
				<div className="flex justify-between mt-2 text-xs">
					<span>Your LTAI Balance</span>
					<span className={!hasEnoughLTAI ? "text-destructive" : ""}>{ltaiBalance.toFixed(2)} LTAI</span>
				</div>
			</div>

			{!hasEnoughLTAI && (
				<div className="bg-destructive/10 p-4 rounded-lg border border-destructive/30 text-sm">
					You don't have enough LTAI tokens for this payment. Please select another payment method.
				</div>
			)}

			<div className="space-y-4">
				<Button
					onClick={handleApprovePayment}
					className="w-full"
					disabled={isApproving || isProcessing || !hasEnoughLTAI || isApproved}
				>
					{isApproving ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Approving...
						</>
					) : (
						"1. Approve LTAI Spending"
					)}
				</Button>

				<Button
					onClick={handleProcessPayment}
					className="w-full"
					disabled={isProcessing || isApproving || !hasEnoughLTAI || !isApproved}
				>
					{isProcessing ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing Payment...
						</>
					) : (
						"2. Pay with LTAI"
					)}
				</Button>
			</div>

			<div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 text-sm text-foreground">
				<p>
					Please note that with price variations, you might not get the exact amount of credits as displayed.
					<br />
					If you need an exact amount of credits, use the crypto payment method.
				</p>
			</div>
		</div>
	);
}
