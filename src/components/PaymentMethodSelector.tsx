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
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium mb-2">Select Payment Method</h3>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Button
					onClick={() => onSelectMethod("crypto")}
					variant="outline"
					className={cn(
						"h-auto py-4 justify-start",
						selectedMethod === "crypto"
							? "border-[2.5px] !border-primary shadow-[0_0_0_1px_rgba(var(--primary),.3)]"
							: "border border-border",
					)}
					type="button"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
							<CreditCard className="h-5 w-5 text-primary" />
						</div>
						<div className="text-left">
							<p className="font-medium text-foreground">Pay with crypto</p>
							<p className="text-xs text-foreground/70">Use USDC, ETH & more</p>
						</div>
					</div>
				</Button>

				<Button
					onClick={() => onSelectMethod("ltai")}
					variant="outline"
					className={cn(
						"h-auto py-4 justify-start",
						selectedMethod === "ltai"
							? "border-[2.5px] !border-primary shadow-[0_0_0_1px_rgba(var(--primary),.3)]"
							: "border border-border",
					)}
					disabled={!hasLTAI}
					type="button"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
							<Coins className="h-5 w-5 text-primary" />
						</div>
						<div className="text-left">
							<p className="font-medium text-foreground">Pay with LTAI</p>
							<p className="text-xs text-foreground/70">
								{hasLTAI ? "Use your LTAI tokens" : "No LTAI tokens available"}
							</p>
						</div>
					</div>
				</Button>
			</div>
		</div>
	);
}
