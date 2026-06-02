import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserBalanceCreditsBalanceGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";
import { toast } from "sonner";

export function useCredits() {
	const queryClient = useQueryClient();
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);

	// Query for credits balance
	const creditsQuery = useQuery({
		queryKey: ["credits"],
		queryFn: async () => {
			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		enabled: isAuthenticated, // Run for any authenticated user (wallet or email/OAuth)
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Mutation to refresh balance
	const refreshCreditsMutation = useMutation({
		mutationFn: async () => {
			const response = await getUserBalanceCreditsBalanceGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching credits");
			}

			return response.data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["credits"], data);
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
