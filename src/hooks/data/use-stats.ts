import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsStatsDashboardGet, getUsageStatsStatsUsageGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";

export function useStats() {
	const baseAccount = useAccountStore((state) => state.baseAccount);
	const solanaAccount = useAccountStore((state) => state.solanaAccount);
	const account = baseAccount || (solanaAccount?.publicKey ? solanaAccount : null);
	const accountAddress = baseAccount?.address || solanaAccount?.publicKey?.toString();

	// Query for dashboard statistics
	const statsQuery = useQuery({
		queryKey: ["dashboardStats", accountAddress],
		queryFn: async () => {
			const response = await getDashboardStatsStatsDashboardGet();

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching dashboard stats",
				);
			}

			return response.data;
		},
		enabled: !!account, // Only run the query when account exists
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

export function useUsageStats(startDate: string, endDate: string) {
	const baseAccount = useAccountStore((state) => state.baseAccount);
	const solanaAccount = useAccountStore((state) => state.solanaAccount);
	const account = baseAccount || (solanaAccount?.publicKey ? solanaAccount : null);
	const accountAddress = baseAccount?.address || solanaAccount?.publicKey?.toString();

	// Query for detailed usage statistics
	const usageQuery = useQuery({
		queryKey: ["usageStats", accountAddress, startDate, endDate],
		queryFn: async () => {
			const response = await getUsageStatsStatsUsageGet({
				query: {
					start_date: startDate,
					end_date: endDate,
				},
			});

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching usage stats",
				);
			}

			return response.data;
		},
		enabled: !!account && !!startDate && !!endDate, // Only run when account and dates exist
	});

	// Transform daily_usage data for chart
	const dailyChartData = Object.entries(usageQuery.data?.daily_usage || {})
		.map(([date, tokens]) => ({
			date,
			input_tokens: tokens.input_tokens,
			output_tokens: tokens.output_tokens,
			tokens: tokens.input_tokens + tokens.output_tokens,
		}))
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return {
		stats: usageQuery.data,
		dailyChartData,
		totalRequests: usageQuery.data?.inference_calls || 0,
		inputTokens: usageQuery.data?.input_tokens || 0,
		outputTokens: usageQuery.data?.output_tokens || 0,
		totalTokens: usageQuery.data?.total_tokens || 0,
		totalCost: usageQuery.data?.cost || 0,
		modelUsage: usageQuery.data?.usage_by_model || [],
		apiKeyUsage: usageQuery.data?.usage_by_api_key || [],
		isLoading: usageQuery.isLoading,
		isError: usageQuery.isError,
		error: usageQuery.error,
	};
}
