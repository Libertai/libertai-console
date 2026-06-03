import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import Providers from "@/components/Providers";
import { Layout } from "@/components/Layout";
import WalletSync from "@/components/WalletSync";
import { CreditCard, Image, Key, LayoutDashboard, LineChart, PieChart } from "lucide-react";

const developersSidebarItems = [
	{ to: "/", icon: <LayoutDashboard className="h-4 w-4" />, label: "Home" },
	{ to: "/dashboard", icon: <PieChart className="h-4 w-4" />, label: "Dashboard" },
	{
		to: "/images",
		icon: <Image className="h-4 w-4" />,
		label: "Images",
		badge: (
			<span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full ml-auto">
				NEW
			</span>
		),
	},
	{ to: "/api-keys", icon: <Key className="h-4 w-4" />, label: "API Keys" },
	{ to: "/usage", icon: <LineChart className="h-4 w-4" />, label: "Usage" },
	{ to: "/billing", icon: <CreditCard className="h-4 w-4" />, label: "Billing" },
];

// Routes rendered standalone, without the app sidebar/header chrome.
const CHROMELESS_ROUTES = ["/login", "/auth/callback", "/auth/verify"];

function RootComponent() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const chromeless = CHROMELESS_ROUTES.includes(pathname);

	return (
		<Providers>
			{/* Keeps wallet sessions in sync globally, independent of the chrome */}
			<WalletSync />
			{chromeless ? (
				<Outlet />
			) : (
				<Layout sidebarItems={developersSidebarItems}>
					<Outlet />
				</Layout>
			)}
		</Providers>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
