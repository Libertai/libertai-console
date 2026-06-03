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
				<div className="flex flex-col items-center space-y-3 text-center">
					<img src="/favicon.ico" alt="LibertAI" className="h-14 w-14 rounded-2xl shadow-sm" />
					<h1 className="text-2xl font-bold">Sign in to LibertAI</h1>
					<p className="text-sm text-muted-foreground">Use your email, a social account, or a wallet.</p>
				</div>
				<LoginPanel />
			</div>
		</div>
	);
}
