import { useQuery } from "@tanstack/react-query";
import { getTransactionHistoryCreditsTransactionsGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account";

export function useTransactions() {
	const address = useAccountStore((state) => state.address);

	// Query for transaction history
	const transactionsQuery = useQuery({
		queryKey: ["transactions", address],
		queryFn: async () => {
			if (!address) {
				return { address: "", transactions: [] };
			}

			const response = await getTransactionHistoryCreditsTransactionsGet();

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching transactions",
				);
			}

			return response.data;
		},
		enabled: !!address, // Only run the query when address exists
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
