import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAccountStore } from "@/stores/account.ts";

export function useRequireAuth() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const account = useAccountStore((state) => state.account);
	const isAuthenticating = useAccountStore((state) => state.isAuthenticating);
	const navigate = useNavigate();

	useEffect(() => {
		// Give thirdweb provider time to initialize on page reload
		const authCheckTimer = setTimeout(() => {
			// Only redirect if we're not loading, not authenticated, and not currently authenticating
			if (!isAuthenticating && !isAuthenticated && !account) {
				toast.error("Authentication Required", {
					description: "Please connect your wallet & sign the message to access this page",
					duration: 5000,
				});
				navigate({ to: "/" });
			}
		}, 500); // Wait 0.5 second before checking auth status

		return () => clearTimeout(authCheckTimer);
	}, [isAuthenticated, account, isAuthenticating, navigate]);

	return { isAuthenticated };
}
