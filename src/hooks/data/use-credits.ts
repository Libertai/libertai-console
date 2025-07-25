import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserBalanceCreditsBalanceGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";
import { toast } from "sonner";

export function useCredits() {
	const queryClient = useQueryClient();
	const address = useAccountStore((state) => state.address);

	// Query for credits balance
	const creditsQuery = useQuery({
		queryKey: ["credits", address],
		queryFn: async () => {
			if (!address) {
				return { balance: 0 };
			}

			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		enabled: !!address, // Only run the query when address exists
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Mutation to refresh balance
	const refreshCreditsMutation = useMutation({
		mutationFn: async () => {
			if (!address) {
				throw new Error("No address available");
			}

			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["credits", address], data);
		},
		onError: (error) => {
			toast.error("Failed to update credits balance", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});

	return {
		credits: creditsQuery.data?.balance ?? 0,
		formattedCredits: creditsQuery.data
			? creditsQuery.data.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })
			: "0",
		isLoading: creditsQuery.isLoading,
		isError: creditsQuery.isError,
		error: creditsQuery.error,
		refreshCredits: refreshCreditsMutation.mutate,
		isRefreshing: refreshCreditsMutation.isPending,
	};
}
