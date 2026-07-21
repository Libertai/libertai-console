import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@libertai/auth";
import { ThemeToggle } from "@libertai/ui/theme-toggle";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/settings")({
	head: () => routeHead("/settings"),
	component: SettingsPage,
});

function SettingsPage() {
	// Console has no thirdweb ENS client, so no ens prop — the shared page handles that gracefully.
	return <AccountSettings appearance={<ThemeToggle />} />;
}
