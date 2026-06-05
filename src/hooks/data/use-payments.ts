import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	cancelPaymentsCancelPost,
	downgradePaymentsDowngradePost,
	getSubscriptionPaymentsSubscriptionGet,
	listProvidersPaymentsProvidersGet,
	listTiersPaymentsTiersGet,
	subscribePaymentsSubscribePost,
	topupPaymentsTopupPost,
	upgradePaymentsUpgradePost,
} from "@libertai/inference-sdk";
import { useAccountStore } from "@libertai/auth";

const unwrap = <T>(response: { data?: T; error?: unknown }, fallback: string): T => {
	if (response.error) {
		const detail = (response.error as { detail?: unknown })?.detail;
		throw new Error(detail ? detail.toString() : fallback);
	}
	return response.data as T;
};

/** Providers available to the current user (fiat for everyone, the matching chain provider for wallet users). */
export function usePaymentProviders() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	return useQuery({
		queryKey: ["paymentProviders"],
		queryFn: async () => unwrap(await listProvidersPaymentsProvidersGet(), "Failed to load payment providers"),
		enabled: isAuthenticated,
	});
}

/** Subscription tiers + pricing/allowances (public). */
export function useTiers() {
	return useQuery({
		queryKey: ["paymentTiers"],
		queryFn: async () => unwrap(await listTiersPaymentsTiersGet(), "Failed to load tiers"),
		staleTime: 60 * 60 * 1000,
	});
}

/** Current subscription state + dual-window allowance snapshot. */
export function useSubscription() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	return useQuery({
		queryKey: ["subscription"],
		queryFn: async () => unwrap(await getSubscriptionPaymentsSubscriptionGet(), "Failed to load subscription"),
		enabled: isAuthenticated,
	});
}

/** Billing actions. Checkout flows redirect the browser to the provider's hosted page. */
export function useBillingActions() {
	const queryClient = useQueryClient();

	const redirectTo = (url?: string) => {
		if (url) window.location.href = url;
	};

	const onError = (action: string) => (error: unknown) =>
		toast.error(`Failed to ${action}`, {
			description: error instanceof Error ? error.message : "Unknown error occurred",
		});

	const topup = useMutation({
		mutationFn: async ({ provider, amount }: { provider: string; amount: number }) =>
			unwrap(await topupPaymentsTopupPost({ body: { provider, amount } }), "Failed to start top-up"),
		onSuccess: (data) => redirectTo(data.checkout_url),
		onError: onError("start top-up"),
	});

	const subscribe = useMutation({
		mutationFn: async ({ provider, tier }: { provider: string; tier: string }) =>
			unwrap(await subscribePaymentsSubscribePost({ body: { provider, tier } }), "Failed to subscribe"),
		onSuccess: (data) => redirectTo(data.checkout_url),
		onError: onError("subscribe"),
	});

	const upgrade = useMutation({
		mutationFn: async ({ provider, tier }: { provider: string; tier: string }) =>
			unwrap(await upgradePaymentsUpgradePost({ body: { provider, tier } }), "Failed to upgrade"),
		onSuccess: (data) => redirectTo(data.checkout_url),
		onError: onError("upgrade"),
	});

	const cancel = useMutation({
		mutationFn: async () => unwrap(await cancelPaymentsCancelPost(), "Failed to cancel"),
		onSuccess: async (data) => {
			toast.success(data.message);
			await queryClient.invalidateQueries({ queryKey: ["subscription"] });
		},
		onError: onError("cancel subscription"),
	});

	const downgrade = useMutation({
		mutationFn: async ({ tier }: { tier: string }) =>
			unwrap(await downgradePaymentsDowngradePost({ body: { tier } }), "Failed to downgrade"),
		onSuccess: async () => {
			toast.success("Downgrade scheduled for the end of the billing period");
			await queryClient.invalidateQueries({ queryKey: ["subscription"] });
		},
		onError: onError("downgrade"),
	});

	return { topup, subscribe, upgrade, cancel, downgrade };
}
