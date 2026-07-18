import { Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AccountMenu } from "@libertai/auth";
import { useSidebar } from "@libertai/ui/sidebar";

/**
 * Console's sidebar-footer account menu. Thin adapter over the shared <AccountMenu> (same component the
 * chat app uses) so the account UI is coherent across LibertAI apps. Sign-in lives in the header
 * (<ConnectButton />), so no `onSignIn` is passed: the footer shows the account dropdown when signed in
 * and nothing when signed out. Console has no ENS client or extra items beyond Settings.
 */
export default function AccountFooter() {
	const navigate = useNavigate();
	const { isMobile, setOpenMobile } = useSidebar();

	return (
		<AccountMenu
			onUpgrade={() => navigate({ to: "/billing" })}
			items={[
				{
					label: "Settings",
					icon: <Settings className="h-4 w-4" />,
					onSelect: () => navigate({ to: "/settings" }),
				},
			]}
			onSignedOut={() => navigate({ to: "/" })}
			onAction={() => {
				if (isMobile) setOpenMobile(false);
			}}
		/>
	);
}
