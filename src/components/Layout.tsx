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
			<Link to={to} onClick={handleClick} disabled={isActive}>
				<SidebarMenuButton tooltip={tooltip} isActive={isActive}>
					{icon}
					<span>{label}</span>
				</SidebarMenuButton>
			</Link>
		</SidebarMenuItem>
	);
}

type SidebarItem = {
	to: string;
	icon: ReactNode;
	label: string;
};

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
		<SidebarProvider defaultOpen={true}>
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
									isActive={currentPath === item.to || currentPath.startsWith(item.to + "/")}
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

					{/* Main content with padding on mobile for the fixed header */}
					<main className="flex-1 overflow-auto md:pt-0 pt-16 w-full">{children}</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
