import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { useQueryState } from "nuqs";

interface TopUpAmountInputProps {
	pricingTiers: {
		id: string;
		name: string;
		price: number;
		popular?: boolean;
	}[];
	onSelectAmount: () => void;
}

export function TopUpAmountInput({ onSelectAmount }: Readonly<TopUpAmountInputProps>) {
	const [amount, setAmount] = useQueryState("amount", {
		defaultValue: "",
		parse: (value) => (value !== "" ? value : ""),
		serialize: (value) => (value !== undefined ? value.toString() : ""),
	});
	const [error, setError] = useState("");

	const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
		// Remove non-numeric characters except decimal point
		const parsedValue = e.target.value.replace(/[^\d.]/g, "");

		// Ensure only one decimal point
		const parts = parsedValue.split(".");
		let value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : parsedValue;

		// Limit to 2 decimal places
		if (parts.length === 2 && parts[1].length > 2) {
			value = `${parts[0]}.${parts[1].substring(0, 2)}`;
		}

		// For empty or partial input (like just "."), store the correct value
		// Empty string should be treated as empty, not 0
		setAmount(value === "" ? "" : value);

		// Clear error if input is valid or still being typed
		if (Number(value) >= 1) {
			setError("");
		} else if (value === "" || value === "." || value.endsWith(".")) {
			// Don't show error while user is still typing
			setError("");
		} else if (value.includes(".") && Number(value) < 1) {
			// Show error for completed decimal inputs less than $1
			setError("Minimum amount is $1");
		} else {
			setError("Minimum amount is $1");
		}
	};

	const handleSubmit = () => {
		const parsedAmount = Number(amount);
		if (isNaN(parsedAmount) || parsedAmount < 1) {
			setError("Please enter a valid amount (minimum $1)");
			return;
		}

		// Round to 2 decimal places for final submission
		const roundedAmount = Math.round(parsedAmount * 100) / 100;
		setAmount(roundedAmount.toString());
		onSelectAmount();
	};

	// const handleSelectTier = (price: number) => {
	// 	setAmount(price.toString());
	// 	setError("");
	// };

	// Usage estimate data
	// const usageEstimates = [
	// 	{ id: "apiCalls", label: "API calls:", multiplier: 20 },
	// 	{ id: "basicQueries", label: "Basic queries:", multiplier: 80 },
	// 	{ id: "advancedQueries", label: "Advanced queries:", multiplier: 40 },
	// ];

	return (
		<div className="space-y-6">
			<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
				<h3 className="text-lg font-semibold mb-4">Enter amount to top up</h3>

				<div className="space-y-4">
					<div className="relative">
						<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
							<DollarSign className="h-5 w-5 text-muted-foreground" />
						</div>

						<Input
							type="text"
							value={amount}
							onChange={handleAmountChange}
							className="pl-10 text-lg font-medium h-12"
							placeholder="Enter amount"
							aria-label="Custom amount"
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button
						onClick={handleSubmit}
						className="w-full h-12 text-lg"
						disabled={!amount || Number(amount) < 1 || !!error}
					>
						Top Up
					</Button>

					{/*<div className="bg-card/50 p-3 rounded-lg mt-3 border border-border">*/}
					{/*	<p className="text-sm font-medium mb-2">Usage Estimates:</p>*/}
					{/*	{amount !== "" && Number(amount) >= 1 ? (*/}
					{/*		<div className="space-y-1 text-sm">*/}
					{/*			{usageEstimates.map((estimate) => (*/}
					{/*				<div key={estimate.id} className="flex justify-between">*/}
					{/*					<span className="text-muted-foreground">{estimate.label}</span>*/}
					{/*					<span className="font-medium">*/}
					{/*						~{Math.round(Number(amount) * estimate.multiplier).toLocaleString()}*/}
					{/*					</span>*/}
					{/*				</div>*/}
					{/*			))}*/}
					{/*		</div>*/}
					{/*	) : (*/}
					{/*		<p className="text-sm text-muted-foreground">Enter an amount to see usage estimates</p>*/}
					{/*	)}*/}
					{/*</div>*/}
				</div>
			</div>

			{/*<div className="space-y-4">*/}
			{/*	<h3 className="text-lg font-medium">Or select a plan</h3>*/}

			{/*	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">*/}
			{/*		{pricingTiers.map((tier) => (*/}
			{/*			<div*/}
			{/*				key={tier.id}*/}
			{/*				className={`relative bg-card/50 backdrop-blur-sm rounded-xl border ${*/}
			{/*					amount === tier.price.toString() ? "border-primary ring-2 ring-primary/20" : "border-border"*/}
			{/*				} hover:border-primary transition-all`}*/}
			{/*			>*/}
			{/*				{tier.popular && (*/}
			{/*					<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-full">*/}
			{/*						Popular*/}
			{/*					</div>*/}
			{/*				)}*/}

			{/*				<div className="p-5">*/}
			{/*					<div className="flex justify-between items-center mb-3">*/}
			{/*						<h4 className="font-medium">{tier.name}</h4>*/}
			{/*						<span className="text-xl font-bold">${tier.price}</span>*/}
			{/*					</div>*/}

			{/*					<div className="space-y-2 text-sm mb-4">*/}
			{/*						{usageEstimates.map((estimate) => (*/}
			{/*							<div key={estimate.id} className="flex justify-between">*/}
			{/*								<span className="text-muted-foreground">{estimate.label}</span>*/}
			{/*								<span className="font-medium">~{tier.price * estimate.multiplier}</span>*/}
			{/*							</div>*/}
			{/*						))}*/}
			{/*					</div>*/}

			{/*					<Button*/}
			{/*						onClick={() => handleSelectTier(tier.price)}*/}
			{/*						variant={amount === tier.price.toString() ? "default" : "outline"}*/}
			{/*						className="w-full mt-2"*/}
			{/*					>*/}
			{/*						Select*/}
			{/*					</Button>*/}
			{/*				</div>*/}
			{/*			</div>*/}
			{/*		))}*/}
			{/*	</div>*/}
			{/*</div>*/}
		</div>
	);
}
