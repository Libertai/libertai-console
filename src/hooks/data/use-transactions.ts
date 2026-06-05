import { useQuery } from "@tanstack/react-query";
import { getTransactionHistoryCreditsTransactionsGet } from "@libertai/inference-sdk";
import { useAccountStore } from "@libertai/auth";

export function useTransactions() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);

	// Query for transaction history
	const transactionsQuery = useQuery({
		queryKey: ["transactions"],
		queryFn: async () => {
			const response = await getTransactionHistoryCreditsTransactionsGet();

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching transactions",
				);
			}

			return response.data;
		},
		enabled: isAuthenticated, // Run for any authenticated user (wallet or email/OAuth)
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	return {
		transactions: transactionsQuery.data?.transactions || [],
		address: transactionsQuery.data?.address || "",
		isLoading: transactionsQuery.isLoading,
		isError: transactionsQuery.isError,
		error: transactionsQuery.error,
	};
}
