import { ReactNode } from "react";
import { Input } from "@libertai/ui/input";
import { Label } from "@libertai/ui/label";

export const INVALID_ADDRESS_MESSAGE = "Enter an Ethereum/Base address (0x…) or a Solana address.";
export const ADDRESS_IN_USE_MESSAGE = "This wallet has already been used for this offer.";
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Try again.";

export function AlephWalletField({
	id,
	value,
	onChange,
	error,
	hint,
	optional = false,
	disabled = false,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error: string | null;
	hint: ReactNode;
	optional?: boolean;
	disabled?: boolean;
}) {
	const messageId = `${id}-message`;
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				Aleph Cloud wallet address
				{optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
			</Label>
			{/* Addresses are case-sensitive: keep mobile keyboards from capitalizing or "correcting" them. */}
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="0x… or Solana address"
				className={value ? "font-mono" : undefined}
				autoComplete="off"
				autoCapitalize="none"
				autoCorrect="off"
				spellCheck={false}
				disabled={disabled}
				aria-invalid={!!error}
				aria-describedby={messageId}
			/>
			{error ? (
				<p id={messageId} className="text-sm text-destructive" role="alert">
					{error}
				</p>
			) : (
				<p id={messageId} className="text-xs text-muted-foreground">
					{hint}
				</p>
			)}
		</div>
	);
}
