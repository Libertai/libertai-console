import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	listAgentsAgentsGet,
	createAgentAgentsPost,
	cancelSubscriptionSubscriptionsSubscriptionIdDelete,
} from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";
import { toast } from "sonner";
import { CreateAgentRequest } from "@/apis/inference/types.gen";

export function useAgents() {
	const queryClient = useQueryClient();
	const account = useAccountStore((state) => state.account);

	// Query for list of agents
	const agentsQuery = useQuery({
		queryKey: ["agents", account?.address],
		queryFn: async () => {
			if (!account) {
				return [];
			}

			const response = await listAgentsAgentsGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching agents");
			}

			return response.data || [];
		},
		enabled: !!account, // Only run the query when account exists
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Mutation to create a new agent
	const createAgentMutation = useMutation({
		mutationFn: async (agentData: CreateAgentRequest) => {
			if (!account) {
				throw new Error("No account available");
			}

			const response = await createAgentAgentsPost({
				body: agentData,
			});

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error creating agent");
			}

			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents", account?.address] });
			queryClient.invalidateQueries({ queryKey: ["credits", account?.address] }); // Refresh credits after subscription
			toast.success("Agent created successfully");
		},
		onError: (error) => {
			toast.error("Failed to create agent", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});

	// Mutation to cancel subscription
	const cancelSubscriptionMutation = useMutation({
		mutationFn: async (subscriptionId: string) => {
			if (!account) {
				throw new Error("No account available");
			}

			const response = await cancelSubscriptionSubscriptionsSubscriptionIdDelete({
				path: { subscription_id: subscriptionId },
			});

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error cancelling subscription");
			}

			return subscriptionId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents", account?.address] });
			toast.success("Subscription cancelled successfully");
		},
		onError: (error) => {
			toast.error("Failed to cancel subscription", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});


	const refreshAgents = () => {
		return queryClient.invalidateQueries({ queryKey: ["agents", account?.address] });
	};

	return {
		agents: agentsQuery.data || [],
		isLoading: agentsQuery.isLoading,
		isError: agentsQuery.isError,
		error: agentsQuery.error,
		createAgent: createAgentMutation.mutate,
		isCreating: createAgentMutation.isPending,
		cancelSubscription: cancelSubscriptionMutation.mutate,
		isCancelling: cancelSubscriptionMutation.isPending,
		refreshAgents,
	};
}
