import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PaymentCallback } from "@libertai/auth";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/payment/callback")({
	head: () => routeHead("/payment/callback"),
	component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
	const navigate = useNavigate();
	return (
		<div className="container mx-auto px-4 py-8">
			<PaymentCallback backTo="/billing" navigate={(to) => void navigate({ to })} />
		</div>
	);
}
