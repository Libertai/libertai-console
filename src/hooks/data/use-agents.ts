import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	listAgentsAgentsGet,
	createAgentAgentsPost,
	cancelSubscriptionSubscriptionsSubscriptionIdDelete,
	reallocateAgentAgentsAgentIdReallocatePost,
} from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";
import { toast } from "sonner";
import { CreateAgentRequest } from "@/apis/inference/types.gen";

export function useAgents() {
	const queryClient = useQueryClient();
	const address = useAccountStore((state) => state.address);

	// Query for list of agents
	const agentsQuery = useQuery({
		queryKey: ["agents", address],
		queryFn: async () => {
			if (!address) {
				return [];
			}

			const response = await listAgentsAgentsGet();

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error fetching agents");
			}

			return response.data || [];
		},
		enabled: !!address, // Only run the query when address exists
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});

	// Mutation to create a new agent
	const createAgentMutation = useMutation({
		mutationFn: async (agentData: CreateAgentRequest) => {
			if (!address) {
				throw new Error("No address available");
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
			queryClient.invalidateQueries({ queryKey: ["agents", address] });
			queryClient.invalidateQueries({ queryKey: ["credits", address] }); // Refresh credits after subscription
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
			if (!address) {
				throw new Error("No address available");
			}

			const response = await cancelSubscriptionSubscriptionsSubscriptionIdDelete({
				path: { subscription_id: subscriptionId },
			});

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error cancelling subscription",
				);
			}

			return subscriptionId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents", address] });
			toast.success("Subscription cancelled successfully");
		},
		onError: (error) => {
			toast.error("Failed to cancel subscription", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});

	// Mutation to reallocate agent
	const reallocateAgentMutation = useMutation({
		mutationFn: async (agentId: string) => {
			if (!account) {
				throw new Error("No account available");
			}

			const response = await reallocateAgentAgentsAgentIdReallocatePost({
				path: { agent_id: agentId },
			});

			if (response.error) {
				throw new Error(response.error.detail ? response.error.detail.toString() : "Unknown error reallocating agent");
			}

			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents", account?.address] });
			toast.success("Agent instance reallocated successfully", {
				description: "Your agent is being moved to a new instance. This may take a few minutes.",
			});
		},
		onError: (error) => {
			toast.error("Failed to reallocate agent", {
				description: error instanceof Error ? error.message : "Unknown error occurred",
			});
		},
	});

	const refreshAgents = () => {
		return queryClient.invalidateQueries({ queryKey: ["agents", address] });
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
		reallocateAgent: reallocateAgentMutation.mutate,
		isReallocating: reallocateAgentMutation.isPending,
		refreshAgents,
	};
}
