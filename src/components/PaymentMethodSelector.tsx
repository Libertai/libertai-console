import { Button } from "@/components/ui/button";
import { Coins, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "crypto" | "ltai";

interface PaymentMethodSelectorProps {
	onSelectMethod: (method: PaymentMethod) => void;
	selectedMethod: PaymentMethod;
	hasLTAI: boolean;
}

export function PaymentMethodSelector({
	onSelectMethod,
	selectedMethod,
	hasLTAI,
}: Readonly<PaymentMethodSelectorProps>) {
	// Payment method options
	const paymentOptions = [
		{
			id: "crypto",
			method: "crypto",
			icon: <CreditCard className="h-5 w-5 text-primary" />,
			title: "Pay with crypto",
			description: "Use USDC, ETH & more",
			disabled: false,
		},
		{
			id: "ltai",
			method: "ltai",
			icon: <Coins className="h-5 w-5 text-primary" />,
			title: "Pay with LTAI",
			description: hasLTAI ? "Use your LTAI tokens" : "No LTAI tokens available",
			disabled: !hasLTAI,
		},
	];

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium mb-2">Select Payment Method</h3>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{paymentOptions.map((option) => (
					<Button
						key={option.id}
						onClick={() => onSelectMethod(option.method as PaymentMethod)}
						variant="outline"
						className={cn(
							"h-auto py-4 justify-start",
							selectedMethod === option.method
								? "border-[2.5px] !border-primary shadow-[0_0_0_1px_rgba(var(--primary),.3)]"
								: "border border-border",
						)}
						disabled={option.disabled}
						type="button"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">{option.icon}</div>
							<div className="text-left">
								<p className="font-medium text-foreground">{option.title}</p>
								<p className="text-xs text-foreground/70 text-pretty">{option.description}</p>
							</div>
						</div>
					</Button>
				))}
			</div>
		</div>
	);
}
