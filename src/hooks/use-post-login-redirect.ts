import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Where to send the user after login. Persisted in sessionStorage (not just the /login
 * `redirect` search param) because OAuth and magic-link flows leave the site entirely and
 * come back on /auth/callback or /auth/verify — the param wouldn't survive the round-trip.
 */
const REDIRECT_STORAGE_KEY = "libertai-post-login-redirect";

/** Internal app paths only — full URLs and protocol-relative ("//host") values are discarded. */
function sanitizeRedirect(path: string | null | undefined): string | null {
	return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
}

/**
 * Remember (or clear, when undefined) the post-login destination. Called by the /login page
 * with its `redirect` search param; clearing on a plain /login visit prevents a stale target
 * from a previous abandoned sign-in from leaking into this one.
 */
export function rememberPostLoginRedirect(path: string | undefined) {
	const safe = sanitizeRedirect(path);
	if (safe) sessionStorage.setItem(REDIRECT_STORAGE_KEY, safe);
	else sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
}

/** Redirect out of the login flow, back to the remembered destination (dashboard by default). */
export function usePostLoginRedirect() {
	const router = useRouter();

	return useCallback(() => {
		const target = sanitizeRedirect(sessionStorage.getItem(REDIRECT_STORAGE_KEY)) ?? "/dashboard";
		sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
		// history.push (not navigate) — the target is a dynamic href (may include a search
		// string), which the typed `to` option doesn't accept.
		router.history.push(target);
	}, [router]);
}
