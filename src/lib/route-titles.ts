// Single source for route labels — feeds both the document <title> (via each route's
// `head` option) and the desktop header's current-page label in Layout.tsx.
export const ROUTE_TITLES: Record<string, string> = {
	"/": "Dashboard",
	"/api-keys": "API keys",
	"/usage": "Usage",
	"/images": "Images",
	"/billing": "Billing",
	"/plans": "Billing",
	"/top-up": "Buy credits",
	"/settings": "Settings",
	"/login": "Sign in",
	"/cli": "Authorize CLI",
	"/auth/callback": "Signing in",
	"/auth/verify": "Signing in",
	"/payment/callback": "Payment",
};

export function routeLabel(pathname: string): string | undefined {
	return ROUTE_TITLES[pathname];
}

// Root has no page name in the title bar; every other known route is "<Label> — LibertAI console".
export function documentTitle(pathname: string): string {
	const label = routeLabel(pathname);
	return label && pathname !== "/" ? `${label} — LibertAI console` : "LibertAI console";
}

export function routeHead(pathname: string): { meta: Array<{ title: string }> } {
	return { meta: [{ title: documentTitle(pathname) }] };
}
