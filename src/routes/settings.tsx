import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@libertai/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	// Console has no thirdweb ENS client, so no ens prop — the shared page handles that gracefully.
	return <AccountSettings appearance={<ThemeToggle />} />;
}
