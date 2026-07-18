import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopUpFlow, PaymentConfigProvider } from "@libertai/auth";
import { paymentConfig } from "@/config/payment";
import { useRequireAuth } from "@/hooks/use-auth";
import { PageSkeleton } from "@libertai/ui/page-skeleton";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/top-up")({
	head: () => routeHead("/top-up"),
	component: TopUp,
});

function TopUp() {
	const { isAuthenticated, isPending } = useRequireAuth();
	const navigate = useNavigate();
	if (isPending) return <PageSkeleton />;
	if (!isAuthenticated) return null;
	return (
		<PaymentConfigProvider config={paymentConfig}>
			<TopUpFlow onDone={() => navigate({ to: "/billing" })} />
		</PaymentConfigProvider>
	);
}
