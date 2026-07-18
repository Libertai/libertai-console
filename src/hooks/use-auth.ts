import { useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAccountStore } from "@libertai/auth";

export function useRequireAuth() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	// Store hydration flag: true until the startup checkSession() (or a wallet reconnect) resolves,
	// so it's a real signal rather than a fixed grace window.
	const isPending = useAccountStore((state) => state.isInitialLoad);
	const navigate = useNavigate();
	const router = useRouter();

	useEffect(() => {
		// Not authenticated (after the store has hydrated) -> send to login.
		// No toast: landing on /login via sign-out or an expired session is expected, not an error.
		// Guard against StrictMode's double effect invocation re-reading an already-redirected
		// location and wrapping it into a second, nested `redirect` param.
		if (!isPending && !isAuthenticated && router.state.location.pathname !== "/login") {
			// Bounce to login, then come back to the page that required auth.
			const { href } = router.state.location;
			navigate({ to: "/login", search: { redirect: href === "/" ? undefined : href } });
		}
	}, [isAuthenticated, navigate, router, isPending]);

	return { isAuthenticated, isPending };
}
