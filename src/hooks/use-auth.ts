import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";

export function useRequireAuth() {
	const account = useActiveAccount();
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
