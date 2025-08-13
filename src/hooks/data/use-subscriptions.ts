import { useQuery } from "@tanstack/react-query";
import { getSubscriptionByUserAddressSubscriptionsUserAddressGet, getSubscriptionTransactionsSubscriptionsSubscriptionIdTransactionsGet } from "@/apis/inference";
import { useAccountStore } from "@/stores/account.ts";

export interface Subscription {
	id: string;
	user_address: string;
	subscription_type: string;
	amount: number;
	status: 'active' | 'cancelled' | 'inactive';
	created_at: string;
	last_charged_at: string;
	next_charge_at: string;
	related_id: string;
}

export interface SubscriptionTransaction {
	id: string;
	subscription_id: string;
	amount: number;
	status: string;
	notes: string;
	created_at: string;
}

export function useSubscriptions() {
	const account = useAccountStore((state) => state.account);

	// Query for user subscriptions
	const subscriptionsQuery = useQuery({
		queryKey: ["subscriptions", account?.address],
		queryFn: async () => {
			if (!account?.address) {
				throw new Error("No user address available");
			}

			const response = await getSubscriptionByUserAddressSubscriptionsUserAddressGet({
				path: {
					user_address: account.address,
				},
			});

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching subscriptions",
				);
			}

			return response.data as Subscription[];
		},
		enabled: !!account?.address,
	});

	return {
		subscriptions: subscriptionsQuery.data || [],
		isLoading: subscriptionsQuery.isLoading,
		isError: subscriptionsQuery.isError,
		error: subscriptionsQuery.error,
	};
}

export function useSubscriptionTransactions(subscriptionId?: string) {
	const account = useAccountStore((state) => state.account);

	// Query for subscription transactions
	const transactionsQuery = useQuery({
		queryKey: ["subscriptionTransactions", subscriptionId],
		queryFn: async () => {
			if (!subscriptionId) {
				throw new Error("No subscription ID provided");
			}

			const response = await getSubscriptionTransactionsSubscriptionsSubscriptionIdTransactionsGet({
				path: {
					subscription_id: subscriptionId,
				},
			});

			if (response.error) {
				throw new Error(
					response.error.detail ? response.error.detail.toString() : "Unknown error fetching transactions",
				);
			}

			return response.data as SubscriptionTransaction[];
		},
		enabled: !!subscriptionId && !!account?.address,
	});

	return {
		transactions: transactionsQuery.data || [],
		isLoading: transactionsQuery.isLoading,
		isError: transactionsQuery.isError,
		error: transactionsQuery.error,
	};
}

export function useAllSubscriptionTransactions(subscriptions: Subscription[]) {
	const account = useAccountStore((state) => state.account);

	// Query for all transactions across subscriptions
	const allTransactionsQuery = useQuery({
		queryKey: ["allSubscriptionTransactions", subscriptions.map(s => s.id)],
		queryFn: async () => {
			if (!subscriptions.length) {
				return [];
			}

			const allTransactions: SubscriptionTransaction[] = [];

			// Fetch transactions for each subscription
			for (const subscription of subscriptions) {
				try {
					const response = await getSubscriptionTransactionsSubscriptionsSubscriptionIdTransactionsGet({
						path: {
							subscription_id: subscription.id,
						},
					});

					if (response.data) {
						allTransactions.push(...(response.data as SubscriptionTransaction[]));
					}
				} catch (error) {
					console.error(`Error fetching transactions for subscription ${subscription.id}:`, error);
				}
			}

			// Sort by created_at date (newest first)
			return allTransactions.sort((a, b) => 
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			);
		},
		enabled: !!account?.address && subscriptions.length > 0,
	});

	return {
		allTransactions: allTransactionsQuery.data || [],
		isLoading: allTransactionsQuery.isLoading,
		isError: allTransactionsQuery.isError,
		error: allTransactionsQuery.error,
	};
}