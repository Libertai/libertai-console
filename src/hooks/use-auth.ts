import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAccountStore } from "@/stores/account.ts";

export function useRequireAuth() {
	const account = useAccountStore((state) => state.account);
	const navigate = useNavigate();

	useEffect(() => {
		if (!account) {
			toast.error("Authentication Required", {
				description: "Please connect your wallet to access this page",
				duration: 5000,
			});
			navigate({ to: "/" });
		}
	}, [account, navigate]);

	return { isAuthenticated: !!account };
}
