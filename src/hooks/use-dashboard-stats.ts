import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsStatsDashboardGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account";

export function useDashboardStats() {
	const account = useAccountStore((state) => state.account);

	// Query for dashboard statistics
	const statsQuery = useQuery({
		queryKey: ["dashboardStats", account?.address],
		queryFn: async () => {
			if (!account) {
				return {
					address: "",
					monthly_usage: {},
					current_month: {
						inference_calls: 0,
						total_tokens: 0,
						input_tokens: 0,
						output_tokens: 0,
						credits_used: 0,
					},
				};
			}

			const response = await getDashboardStatsStatsDashboardGet();

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching dashboard stats",
				);
			}

			return response.data;
		},
		enabled: !!account, // Only run the query when account exists
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Transform monthly_usage data for chart
	const chartData = Object.entries(statsQuery.data?.monthly_usage || {}).map(([month, cost]) => ({
		month,
		cost,
	}));

	return {
		stats: statsQuery.data,
		chartData,
		apiCalls: statsQuery.data?.current_month.inference_calls || 0,
		tokensUsed: statsQuery.data?.current_month.total_tokens || 0,
		isLoading: statsQuery.isLoading,
		isError: statsQuery.isError,
		error: statsQuery.error,
	};
}
