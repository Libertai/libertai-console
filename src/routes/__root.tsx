import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Providers from "@/components/Providers";

export const Route = createRootRoute({
	component: () => (
		<Providers>
			<Outlet />
			<TanStackRouterDevtools />
		</Providers>
	),
});
