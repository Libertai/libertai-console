import env from "@/config/env";
import idl from "@/lib/solana/libert_ai_payment_processor.json"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { LibertAiPaymentProcessor } from "@/lib/solana/libert_ai_payment_processor";
import { useAccountStore } from "@/stores/account";
import { toast } from "sonner";
import { approve } from "thirdweb/extensions/erc20";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/config/thirdweb";
import { useLTAIPrice } from "@/hooks/use-ltai-price";
import { eth_getTransactionReceipt, getRpcClient, prepareContractCall, sendTransaction } from "thirdweb";
import { parseUnits } from "viem";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor"
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

interface LTAIPaymentFormProps {
	usdAmount: number;
	onPaymentSuccess: () => void;
}

const solanaConnection = new Connection(env.SOLANA_RPC, "confirmed");
const solanaProgram = new Program(idl as LibertAiPaymentProcessor, {
  connection: solanaConnection,
});
const solanaTokenMint = new PublicKey(env.LTAI_SOLANA_ADDRESS)


/**
 * Helper function to wait for transaction confirmation
 */
const waitForTransaction = async (transactionHash: `0x${string}`, maxAttempts = 20) => {
	const rpcClient = getRpcClient({ client: thirdwebClient, chain: base });
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const receipt = await eth_getTransactionReceipt(rpcClient, {
				hash: transactionHash,
			});

			// Receipt might be null if transaction is not yet mined
			if (receipt && receipt.status === "success") {
				return receipt;
			}

			// Wait before next attempt
			await new Promise((resolve) => setTimeout(resolve, 3000));
		} catch (_error) {
			// Receipt might not be available yet
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}
	}
	throw new Error("Transaction confirmation timeout");
};

export function LTAIPaymentForm({ usdAmount, onPaymentSuccess }: Readonly<LTAIPaymentFormProps>) {
	const baseAccount = useAccountStore((state) => state.baseAccount);
	const solanaAccount = useAccountStore((state) => state.solanaAccount);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const getLTAIBalance = useAccountStore((state) => state.getLTAIBalance);
	const setLastTransactionHash = useAccountStore((state) => state.setLastTransactionHash);

	const [isApproving, setIsApproving] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isApproved, setIsApproved] = useState(!!(solanaAccount && solanaAccount.publicKey));

	const { price: ltaiPrice, isLoading, getRequiredLTAI } = useLTAIPrice();
	const originalLtaiAmount = getRequiredLTAI(usdAmount, false);
	const discountedLtaiAmount = getRequiredLTAI(usdAmount, true);

	const LTAI_BASE_CONTRACT_ADDRESS = env.LTAI_BASE_ADDRESS as `0x${string}`;
	const PAYMENT_PROCESSOR_ADDRESS = env.PAYMENT_PROCESSOR_CONTRACT_BASE_ADDRESS as `0x${string}`;

	const handleApprovePayment = async () => {
		if (!baseAccount || !ltaiPrice || !discountedLtaiAmount) return;

		// Approving a bit more than required in case of price fluctuations
		const amountToApprove = discountedLtaiAmount * 1.1;

		setIsApproving(true);
		if (baseAccount) {
			try {
				// Approve the payment processor to spend LTAI tokens
				const tx = approve({
					contract: {
						address: LTAI_BASE_CONTRACT_ADDRESS,
						chain: base,
						client: thirdwebClient,
					},
					spender: PAYMENT_PROCESSOR_ADDRESS,
					amount: amountToApprove.toString(),
				});

				// Send the transaction and get the hash
				const { transactionHash } = await sendTransaction({ transaction: tx, account: baseAccount });

				// Create a pending toast
				const toastId = toast.loading("Waiting for approval confirmation...");

				try {
					// Wait for the transaction to be confirmed
					await waitForTransaction(transactionHash);

					// Update the toast
					toast.success("Approval successful", {
						id: toastId,
						description: "Now you can proceed with the payment",
					});

					// Set approval state to true
					setIsApproved(true);

					// After approval, update the LTAI balance
					await getLTAIBalance();
				} catch (confirmError) {
					console.error("Approval confirmation error:", confirmError);
					toast.error("Approval confirmation failed", {
						id: toastId,
						description:
							confirmError instanceof Error ? confirmError.message : "Transaction may not have been confirmed",
					});
				}
			} catch (error) {
				console.error("Approval error:", error);
				toast.error("Approval failed", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
			} finally {
				setIsApproving(false);
			}
		}
	};

	const handleProcessPayment = async () => {
		if ((!baseAccount && (!solanaAccount || !solanaAccount.publicKey)) || !ltaiPrice || !discountedLtaiAmount) return;

		setIsProcessing(true);
		if (baseAccount) {
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
					params: [parseUnits(discountedLtaiAmount.toString(), 18)],
				});

				// Send the transaction
				const { transactionHash } = await sendTransaction({
					transaction,
					account: baseAccount,
				});

				// Store the transaction hash for display
				setLastTransactionHash(transactionHash);

				// Create a pending toast
				const toastId = toast.loading("Waiting for payment confirmation...");

				try {
					// Wait for the transaction to be confirmed
					await waitForTransaction(transactionHash);

					// Update the toast
					toast.success("Payment successful", {
						id: toastId,
					});

					// After successful payment, update the LTAI balance and call the success handler
					await getLTAIBalance();
					onPaymentSuccess();
				} catch (confirmError) {
					console.error("Payment confirmation error:", confirmError);
					toast.error("Payment confirmation failed", {
						id: toastId,
						description:
							confirmError instanceof Error ? confirmError.message : "Transaction may not have been confirmed",
					});
				}
			} catch (error) {
				console.error("Payment error:", error);
				toast.error("Payment failed", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
			} finally {
				setIsProcessing(false);
			}
		} else if (solanaAccount && solanaAccount.publicKey) {
			try {
				const amount = parseUnits(discountedLtaiAmount.toString(), 9);
				console.log("Payment amount:", amount.toString());

				const userTokenAccount = await getAssociatedTokenAddress(
					solanaTokenMint,
					solanaAccount.publicKey
				);
				console.log("User token account:", userTokenAccount.toString());

				// Check if user token account exists
				const accountInfo = await solanaConnection.getAccountInfo(userTokenAccount);
				if (!accountInfo) {
					throw new Error("Associated token account does not exist. Please create it first.");
				}

				const [programTokenAccountPDA] = PublicKey.findProgramAddressSync(
					[
						Buffer.from("program_token_account"),
						solanaTokenMint.toBuffer()
					],
					solanaProgram.programId
				);
				console.log("Program token account PDA:", programTokenAccountPDA.toString());
				
				const ix = await solanaProgram.methods
					.processPayment(new BN(amount))
					.accounts({
						user: solanaAccount.publicKey,
						userTokenAccount: userTokenAccount,
						programTokenAccount: programTokenAccountPDA,
						tokenMint: solanaTokenMint,
						tokenProgram: TOKEN_PROGRAM_ID,
					})
					.instruction();
				const tx = new Transaction().add(ix);

				// Get recent blockhash
				const { blockhash } = await solanaConnection.getLatestBlockhash();
				tx.recentBlockhash = blockhash;
				tx.feePayer = solanaAccount.publicKey;

				console.log("Sending transaction...");
				
				// Try to simulate the transaction first
				try {
					const simulation = await solanaConnection.simulateTransaction(tx);
					console.log("Transaction simulation:", simulation);
					if (simulation.value.err) {
						throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
					}
				} catch (simError) {
					console.error("Simulation error:", simError);
					throw new Error(`Transaction simulation failed: ${simError.message}`);
				}
				const sig = await solanaAccount.sendTransaction(tx, solanaConnection, {
					skipPreflight: true, // Skip preflight since we already simulated
					preflightCommitment: "confirmed",
					maxRetries: 3
				});

				// Store the transaction hash for display
				setLastTransactionHash(sig);

				// Create a pending toast
				const toastId = toast.loading("Waiting for payment confirmation...");
				const latestBlockHash = await solanaConnection.getLatestBlockhash()
				try {
					// Wait for the transaction to be confirmed
					await solanaConnection.confirmTransaction({
						blockhash: blockhash,
						lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
						signature: sig
					}, "confirmed");

					// Update the toast
					toast.success("Payment successful", {
						id: toastId,
					});

					// After successful payment, update the LTAI balance and call the success handler
					await getLTAIBalance();
					onPaymentSuccess();
				} catch (confirmError) {
					console.error("Payment confirmation error:", confirmError);
					toast.error("Payment confirmation failed", {
						id: toastId,
						description:
							confirmError instanceof Error ? confirmError.message : "Transaction may not have been confirmed",
					});
				}
			} catch (error) {
				console.error("Payment error:", error);
				toast.error("Payment failed", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
			} finally {
				setIsProcessing(false)
			}
		}
	}
		if (isLoading) {
			return (
				<div className="space-y-6">
					<div className="bg-card p-4 rounded-lg border border-border">
						<div className="flex justify-between mb-2">
							<Skeleton className="h-5 w-24" />
							<Skeleton className="h-5 w-16" />
						</div>
						<div className="flex justify-between mb-2">
							<Skeleton className="h-5 w-24" />
							<Skeleton className="h-5 w-32" />
						</div>
						<div className="border-t border-border my-2"></div>
						<div className="flex justify-between font-medium">
							<Skeleton className="h-5 w-28" />
							<Skeleton className="h-5 w-20" />
						</div>
						<div className="flex justify-between mt-2 text-xs">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>

					<div className="space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			);
		}

		const hasEnoughLTAI = ltaiBalance >= discountedLtaiAmount;

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
						<div className="flex flex-col items-end">
							<span className="line-through text-muted-foreground text-sm">{originalLtaiAmount.toFixed(2)} LTAI</span>
							<div className="flex items-center">
								<span className="text-green-600 mr-1 text-sm">20% OFF</span>
								<span className="font-bold">{discountedLtaiAmount.toFixed(2)} LTAI</span>
							</div>
						</div>
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
					{solanaAccount && solanaAccount.publicKey ? (
						<></>
					) : (
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
					)}

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
							`${solanaAccount && solanaAccount.publicKey ? "" : "2. "}Pay with LTAI`
						)}
					</Button>
				</div>

				<div
					className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 text-sm text-foreground">
					<p>
						Please note that with price variations, you might not get the exact amount of credits as displayed.
						<br />
						If you need an exact amount of credits, use the crypto payment method.
					</p>
				</div>
			</div>
		);
	}