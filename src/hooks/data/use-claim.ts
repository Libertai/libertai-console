import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountStore } from "@libertai/auth";
import { attachAlephWallet, Claim, ClaimApiError, createClaim, getCampaign, getMyClaim } from "@/lib/claim-api";

// An Aleph transfer normally lands within seconds; poll a pending one for about a minute,
// then leave it to the user to check again (the backend keeps retrying on its side).
const PENDING_POLL_INTERVAL_MS = 5_000;
const PENDING_POLL_WINDOW_MS = 60_000;

const claimKey = (code: string) => ["claim", code] as const;

// A missing response or a 5xx is worth one more try; a 4xx answer won't change.
const retryTransient = (failureCount: number, error: Error) =>
	failureCount < 1 && !(error instanceof ClaimApiError && error.status !== null && error.status < 500);

export function useCampaign(code: string | undefined) {
	return useQuery({
		queryKey: ["claim-campaign", code],
		queryFn: () => getCampaign(code!),
		enabled: !!code,
		staleTime: 60 * 1000,
		retry: retryTransient,
	});
}

export function useMyClaim(code: string | undefined) {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	// Each manual re-check opens a new polling round; a round expires after the poll window.
	const [pollRound, setPollRound] = useState(0);
	const [expiredRound, setExpiredRound] = useState<number | null>(null);
	const pollExpired = expiredRound === pollRound;

	const query = useQuery({
		queryKey: claimKey(code ?? ""),
		queryFn: () => getMyClaim(code!),
		enabled: !!code && isAuthenticated,
		retry: retryTransient,
		refetchInterval: (query) =>
			query.state.data?.aleph_status === "pending" && !pollExpired ? PENDING_POLL_INTERVAL_MS : false,
	});

	const isAlephPending = query.data?.aleph_status === "pending";
	useEffect(() => {
		if (!isAlephPending) return;
		const timer = setTimeout(() => setExpiredRound(pollRound), PENDING_POLL_WINDOW_MS);
		return () => clearTimeout(timer);
	}, [isAlephPending, pollRound]);

	return {
		...query,
		// Polling gave up while the transfer is still pending: the UI offers a manual re-check.
		pendingTimedOut: isAlephPending && pollExpired,
		recheck: () => {
			setPollRound((round) => round + 1);
			return query.refetch();
		},
	};
}

/** Claim, or attach a wallet to an existing claim. Either way the result replaces the cached claim. */
export function useClaimMutations(code: string) {
	const queryClient = useQueryClient();
	const onSuccess = (claim: Claim) => queryClient.setQueryData(claimKey(code), claim);

	const claim = useMutation({
		mutationFn: (alephAddress: string | null) => createClaim(code, alephAddress),
		onSuccess,
	});
	const attachWallet = useMutation({
		mutationFn: (alephAddress: string) => attachAlephWallet(code, alephAddress),
		onSuccess,
	});

	return {
		claim,
		attachWallet,
		/** Re-read the claim from the server; resolves to it, or null if there is none. */
		// staleTime 0: the cached "no claim yet" is exactly what's being re-checked.
		refetchClaim: () =>
			queryClient.fetchQuery({ queryKey: claimKey(code), queryFn: () => getMyClaim(code), staleTime: 0 }),
		refetchCampaign: () => queryClient.invalidateQueries({ queryKey: ["claim-campaign", code] }),
	};
}
