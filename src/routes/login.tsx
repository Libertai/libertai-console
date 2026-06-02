import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccountStore } from "@/stores/account";
import LoginPanel from "@/components/LoginPanel";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) navigate({ to: "/dashboard" });
	}, [isAuthenticated, navigate]);

	return (
		<div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-bold">Sign in to LibertAI</h1>
					<p className="text-sm text-muted-foreground">Use your email, a social account, or a wallet.</p>
				</div>
				<LoginPanel />
			</div>
		</div>
	);
}
