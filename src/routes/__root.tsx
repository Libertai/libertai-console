import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Providers from "@/components/Providers.tsx";

export const Route = createRootRoute({
	component: () => (
		<Providers>
			<hr />
			<Outlet />
			<TanStackRouterDevtools />
		</Providers>
	),
});
