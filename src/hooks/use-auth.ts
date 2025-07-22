import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAccountStore } from "@/stores/account.ts";

export function useRequireAuth() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const baseAccount = useAccountStore((state) => state.baseAccount);
	const solanaAccount = useAccountStore((state) => state.solanaAccount);
	const isInitialLoad = useAccountStore((state) => state.isInitialLoad);
	const account = baseAccount || (solanaAccount?.publicKey ? solanaAccount : null);
	const navigate = useNavigate();

	useEffect(() => {
		// Don't show toast during initial load to prevent premature authentication warnings
		if (!isInitialLoad && (!isAuthenticated || !account)) {
			toast.error("Authentication Required", {
				description: "Please connect your wallet & sign the message to access this page",
				duration: 5000,
			});
			navigate({ to: "/" });
		}
	}, [isAuthenticated, account, navigate, isInitialLoad]);

	return { isAuthenticated };
}
