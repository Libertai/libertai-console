import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAccountStore } from "@/stores/account.ts";

export function useRequireAuth() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const isInitialLoad = useAccountStore((state) => state.isInitialLoad);
	const navigate = useNavigate();
	const [hasWaited, setHasWaited] = useState(false);

	useEffect(() => {
		// Give time for authentication to complete on initial load
		if (isInitialLoad && !hasWaited) {
			const timer = setTimeout(() => {
				setHasWaited(true);
			}, 1000); // Wait 1 second for auth to complete

			return () => clearTimeout(timer);
		}
	}, [isInitialLoad, hasWaited]);

	useEffect(() => {
		// Authenticated via either a bearer token (email/OAuth) or a wallet signature.
		if ((hasWaited || !isInitialLoad) && !isAuthenticated) {
			if (!isInitialLoad) {
				toast.error("Authentication Required", {
					description: "Please sign in to access this page",
					duration: 5000,
				});
			}
			navigate({ to: "/" });
		}
	}, [isAuthenticated, navigate, isInitialLoad, hasWaited]);

	return { isAuthenticated };
}
