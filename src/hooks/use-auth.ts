import { useEffect, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAccountStore } from "@libertai/auth";

export function useRequireAuth() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const isInitialLoad = useAccountStore((state) => state.isInitialLoad);
	const navigate = useNavigate();
	const router = useRouter();
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
		// Not authenticated (after the initial-load grace window) -> send to login.
		// No toast: landing on /login via sign-out or an expired session is expected, not an error.
		if ((hasWaited || !isInitialLoad) && !isAuthenticated) {
			// Bounce to login, then come back to the page that required auth.
			const { href } = router.state.location;
			navigate({ to: "/login", search: { redirect: href === "/" ? undefined : href } });
		}
	}, [isAuthenticated, navigate, router, isInitialLoad, hasWaited]);

	return { isAuthenticated };
}
