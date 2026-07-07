import { createFileRoute } from "@tanstack/react-router";
import { BillingPlans } from "@/components/BillingPlans";

export const Route = createFileRoute("/plans")({
	component: BillingPlans,
});
