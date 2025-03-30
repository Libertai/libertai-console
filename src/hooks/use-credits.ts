import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserBalanceCreditsBalanceGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account";
import { toast } from "sonner";

export function useCredits() {
	const queryClient = useQueryClient();
	const account = useAccountStore((state) => state.account);

	// Query for credits balance
	const creditsQuery = useQuery({
		queryKey: ["credits", account?.address],
		queryFn: async () => {
			if (!account) {
				return { balance: 0 };
			}

			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		enabled: !!account, // Only run the query when account exists
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Mutation to refresh balance
	const refreshCreditsMutation = useMutation({
		mutationFn: async () => {
			if (!account) {
				throw new Error("No account available");
			}

			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["credits", account?.address], data);
			toast.success("Credits balance updated");
		},
		onError: (error) => {
			toast.error("Failed to update credits balance", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});

	return {
		credits: creditsQuery.data?.balance || 0,
		formattedCredits: creditsQuery.data ? creditsQuery.data.balance.toFixed(2) : "0",
		isLoading: creditsQuery.isLoading,
		isError: creditsQuery.isError,
		error: creditsQuery.error,
		refreshCredits: refreshCreditsMutation.mutate,
		isRefreshing: refreshCreditsMutation.isPending,
	};
}

// Fetch the LTAI token price from CoinGecko API
export async function fetchLTAIPrice(): Promise<number> {
	try {
		const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=libertai&vs_currencies=usd');
		const data = await response.json();
		
		if (data && data.libertai && data.libertai.usd) {
			return data.libertai.usd;
		} else {
			// Fallback price if the API doesn't return the expected data
			console.warn('Failed to fetch LTAI price from CoinGecko, using fallback price');
			return 0.05; // Fallback price in USD
		}
	} catch (error) {
		console.error('Error fetching LTAI price:', error);
		// Return a fallback price if the API call fails
		return 0.05; // Fallback price in USD
	}
}

// Calculate the amount of LTAI tokens needed for a given USD amount
export function calculateLTAIAmount(usdAmount: number, ltaiPrice: number): number {
	if (!ltaiPrice || ltaiPrice <= 0) return 0;
	return usdAmount / ltaiPrice;
}