import { createFileRoute } from "@tanstack/react-router";
import { useRequireAuth } from "@/hooks/use-auth";
import { CreditTransactionResponse } from "@/apis/inference";
import { useTransactions } from "@/hooks/data/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import { AlertCircle, Receipt } from "lucide-react";

export const Route = createFileRoute("/transactions")({
	component: Transactions,
});

function Transactions() {
	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Use transactions query hook
	const { transactions, isLoading, isError } = useTransactions();

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	// Format the transaction type/provider to be more user-friendly
	const formatProvider = (provider: string): string => {
		switch (provider) {
			case "base":
				return "LibertAI (Base)";
			case "solana":
				return "LibertAI (Solana)";
			case "thirdweb":
				return "Thirdweb";
			case "voucher":
				return "Voucher";
			case "solana":
				return "Solana";
			default:
				return provider;
		}
	};

	// Format the transaction status based on whether it's active
	const getTransactionStatus = (transaction: CreditTransactionResponse): { label: string; className: string } => {
		if (!transaction.is_active) {
			return {
				label: "Expired",
				className: "bg-orange-900/30 text-orange-400",
			};
		}

		if (transaction.amount_left <= 0) {
			return {
				label: "Used",
				className: "bg-blue-900/30 text-blue-400",
			};
		}

		return {
			label: "Active",
			className: "dark:bg-emerald-900/30 bg-emerald-900/5 text-emerald-400",
		};
	};

	// Check if there are any pending transactions
	const hasPendingTransactions = transactions.some((transaction) => transaction.status !== "completed");

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div>
					<h1 className="text-3xl font-bold">Transaction History</h1>
					<p className="text-muted-foreground mt-1">View your credit transaction history and details</p>
				</div>

				{/* Pending Transaction Alert */}
				{hasPendingTransactions && (
					<div className="flex items-center gap-3 p-4 border border-amber-400/30 rounded-lg bg-amber-950/20 text-amber-400">
						<AlertCircle className="h-5 w-5 flex-shrink-0" />
						<div>
							<p className="text-sm font-medium">You have pending transactions</p>
							<p className="text-xs text-amber-400/80">
								Your transaction is being processed and credits will be available soon. If it is not confirmed
								automatically after a few minutes, please reach out to us on{" "}
								<a href="https://t.me/libertai" className="text-primary hover:underline" target="_blank">
									Telegram
								</a>
								.
							</p>
						</div>
					</div>
				)}

				{/* Transactions List */}
				<div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border">
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Type</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Amount</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Remaining</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Expires</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
								</tr>
							</thead>
							<tbody>
								{transactions.length === 0 && !isLoading ? (
									<tr className="border-b border-border/50">
										<td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
											No transactions found.
										</td>
									</tr>
								) : isLoading ? (
									<>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
									</>
								) : isError ? (
									<tr className="border-b border-border/50">
										<td colSpan={7} className="px-6 py-8 text-center text-destructive">
											Error loading transaction history. Please try again.
										</td>
									</tr>
								) : (
									transactions.map((transaction) => {
										const status = getTransactionStatus(transaction);
										return (
											<tr key={transaction.id} className="border-b border-border/50 hover:bg-card/70">
												<td className="px-6 py-4 text-sm font-medium">
													{dayjs(transaction.created_at).format("YYYY-MM-DD HH:mm")}
												</td>
												<td className="px-6 py-4 text-sm">{formatProvider(transaction.provider)}</td>
												<td className="px-6 py-4 text-sm">
													${transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
												</td>
												<td className="px-6 py-4 text-sm">
													${transaction.amount_left.toLocaleString(undefined, { maximumFractionDigits: 4 })}
												</td>
												<td className="px-6 py-4 text-sm text-muted-foreground">
													{transaction.expired_at ? dayjs(transaction.expired_at).format("YYYY-MM-DD") : "Never"}
												</td>
												<td className="px-6 py-4 text-sm">
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
														{status.label}
													</span>
													{transaction.status !== "completed" && (
														<span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400">
															Pending
														</span>
													)}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-4">
						<Receipt className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">About Transactions</h2>
					</div>
					<div className="space-y-4 text-card-foreground">
						<p>Your transaction history shows all credit purchases:</p>
						<ul className="list-disc list-inside space-y-2 ml-4 text-sm">
							<li>
								<span className="font-medium">LibertAI (Base/Solana)</span> - Credits purchased with $LTAI on Base or
								Solana networks
							</li>
							<li>
								<span className="font-medium">Thirdweb</span> - Credits purchased using cryptocurrency via Thirdweb
							</li>
							<li>
								<span className="font-medium">Voucher</span> - Credits received from vouchers or promotional codes
							</li>
							<li>
								<span className="font-medium">Solana</span> - Credits purchased directly with $LTAI on the solana
								blockchain
							</li>
						</ul>
						<p className="text-sm mt-4">
							Credits are consumed based on usage of the API. Some credits may have expiration dates.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
