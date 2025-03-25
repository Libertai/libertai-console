import { createFileRoute } from "@tanstack/react-router";
import AccountButton from "@/components/AccountButton";
import { PayEmbed } from "thirdweb/react";
import { thirdwebClient } from "@/config/thirdweb.ts";
import { base } from "thirdweb/chains";
import env from "@/config/env.ts";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			<AccountButton />
			<PayEmbed
				client={thirdwebClient}
				payOptions={{
					mode: "direct_payment",
					buyWithFiat: false,
					paymentInfo: {
						chain: base,
						sellerAddress: env.PAYMENT_PROCESSOR_CONTRACT_BASE_ADDRESS,
						amount: "1",
						token: {
							name: "USDC",
							symbol: "USDC",
							address: env.USDC_BASE_ADDRESS,
						},
					},
				}}
			/>
		</div>
	);
}
