import { createRootRoute, Outlet } from "@tanstack/react-router";
import Providers from "@/components/Providers";
import { Layout } from "@/components/Layout";
import { Coins, Key, LayoutDashboard, LineChart, PieChart } from "lucide-react";

const developersSidebarItems = [
	{ to: "/", icon: <LayoutDashboard className="h-4 w-4" />, label: "Home" },
	{ to: "/dashboard", icon: <PieChart className="h-4 w-4" />, label: "Dashboard" },
	{ to: "/api-keys", icon: <Key className="h-4 w-4" />, label: "API Keys" },
	{ to: "/usage", icon: <LineChart className="h-4 w-4" />, label: "Usage" },
	{ to: "/topup", icon: <Coins className="h-4 w-4" />, label: "Top Up" },
];

export const Route = createRootRoute({
	component: () => (
		<Providers>
			<Layout sidebarItems={developersSidebarItems}>
				<Outlet />
			</Layout>
		</Providers>
	),
});
