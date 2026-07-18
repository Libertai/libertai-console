import { createFileRoute } from "@tanstack/react-router";
import { BillingPlans } from "@/components/BillingPlans";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/billing")({
	head: () => routeHead("/billing"),
	component: BillingPlans,
});
