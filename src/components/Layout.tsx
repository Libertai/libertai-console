import { ReactNode, useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { LibertaiLogo } from "@libertai/branding";
import ConnectButton from "./ConnectButton";
import AccountFooter from "./AccountFooter";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@libertai/ui/sidebar";

// Component that wraps menu items to auto-close sidebar on mobile
function SidebarMenuItemWithAutoClose({
	to,
	tooltip,
	isActive,
	icon,
	label,
}: Readonly<{
	to: string;
	tooltip: string;
	isActive: boolean;
	icon: ReactNode;
	label: string;
}>) {
	const { isMobile, setOpenMobile } = useSidebar();

	const handleClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild tooltip={tooltip} isActive={isActive}>
				<Link to={to} onClick={handleClick}>
					{icon}
					<span>{label}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

type SidebarItem = {
	to: string;
	icon: ReactNode;
	label: string;
	// Extra paths that should also highlight this item (e.g. sibling routes under the same section).
	activePaths?: string[];
};

function isPathActive(currentPath: string, path: string): boolean {
	return currentPath === path || currentPath.startsWith(path + "/");
}

export function Layout({
	children,
	sidebarItems,
}: Readonly<{
	children: ReactNode;
	sidebarItems: SidebarItem[];
}>) {
	const router = useRouter();
	const [currentPath, setCurrentPath] = useState(router.state.location.pathname);

	// Update the current path whenever the route changes
	useEffect(() => {
		// Initial state
		setCurrentPath(router.state.location.pathname);

		// Subscribe to route changes
		const unsubscribe = router.subscribe("onResolved", () => {
			setCurrentPath(router.state.location.pathname);
		});

		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
		};
	}, [router]);

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row w-full">
				{/* Mobile Header */}
				<header className="fixed z-20 top-0 left-0 right-0 h-16 border-b border-border px-4 flex items-center justify-between md:hidden bg-background">
					<SidebarTrigger />
					<Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
						<LibertaiLogo className="h-5 w-auto text-foreground" />
					</Link>
					<ConnectButton />
				</header>

				{/* Desktop Sidebar */}
				<Sidebar className="border-r-0">
					<SidebarHeader className="h-16 flex items-center justify-center">
						<Link to="/">
							<LibertaiLogo className="h-6 w-auto text-foreground" />
						</Link>
					</SidebarHeader>

					<SidebarContent>
						<SidebarMenu>
							{sidebarItems.map((item) => (
								<SidebarMenuItemWithAutoClose
									to={item.to}
									tooltip={item.label}
									isActive={[item.to, ...(item.activePaths ?? [])].some((path) => isPathActive(currentPath, path))}
									icon={item.icon}
									label={item.label}
									key={item.to}
								/>
							))}
						</SidebarMenu>
					</SidebarContent>

					<SidebarFooter>
						<AccountFooter />
					</SidebarFooter>
				</Sidebar>

				<SidebarInset className="w-full">
					{/* Desktop Header */}
					<header className="sticky top-0 z-10 h-16 border-b border-border px-4 hidden md:flex items-center justify-between bg-background">
						<SidebarTrigger />
						<ConnectButton />
					</header>

					{/* Content wrapper (SidebarInset is the <main> landmark); mobile padding clears the fixed header */}
					{/* The scroll container: the router owns its scroll position via scrollRestoration. */}
					<div data-scroll-restoration-id="content" className="flex-1 overflow-auto md:pt-0 pt-16 w-full">
						{children}
					</div>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
