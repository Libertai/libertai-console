import { Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AccountMenu } from "@libertai/auth";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Console's sidebar-footer account menu. Thin adapter over the shared <AccountMenu> (same component
 * the chat app uses) so the account UI is coherent across LibertAI apps. Console has no ENS client or
 * settings page, so no ENS data / extra items are passed.
 */
export default function AccountFooter() {
	const navigate = useNavigate();
	const { isMobile, setOpenMobile } = useSidebar();

	return (
		<AccountMenu
			items={[
				{
					label: "Settings",
					icon: <Settings className="h-4 w-4" />,
					onSelect: () => navigate({ to: "/settings" }),
				},
			]}
			onSignIn={() => navigate({ to: "/login" })}
			onSignedOut={() => navigate({ to: "/" })}
			onAction={() => {
				if (isMobile) setOpenMobile(false);
			}}
		/>
	);
}
