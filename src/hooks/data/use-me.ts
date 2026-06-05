import { useQuery } from "@tanstack/react-query";
import { getMeAuthMeGet } from "@libertai/inference-sdk";
import { useAccountStore } from "@libertai/auth";

/** Current user's profile (email/OAuth or wallet). */
export function useMe() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	return useQuery({
		queryKey: ["me"],
		queryFn: async () => {
			const response = await getMeAuthMeGet();
			if (response.error) {
				throw new Error("Failed to load profile");
			}
			return response.data;
		},
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000,
	});
}
