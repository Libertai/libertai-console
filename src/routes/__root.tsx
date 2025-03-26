import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Providers from "@/components/Providers";
import { Layout } from "@/components/Layout";

export const Route = createRootRoute({
	component: () => (
		<Providers>
			<Layout>
				<Outlet />
				<TanStackRouterDevtools />
			</Layout>
		</Providers>
	),
});
