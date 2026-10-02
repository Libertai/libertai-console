import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { Button } from "@libertai/ui/button";
import { ClaimApiError, errorDetail, isValidAlephAddress } from "@/lib/claim-api";
import { useClaimMutations } from "@/hooks/data/use-claim";
import {
	ADDRESS_IN_USE_MESSAGE,
	AlephWalletField,
	GENERIC_ERROR_MESSAGE,
	INVALID_ADDRESS_MESSAGE,
} from "./AlephWalletField";

/**
 * The claim itself. On success the claim lands in the query cache and the page swaps to the
 * success view; failures that change what the page should show (no email, already claimed, offer
 * no longer open) are handed back to the page rather than shown here.
 */
export function ClaimForm({
	code,
	totalLabel,
	onNoEmail,
}: {
	code: string;
	totalLabel: string;
	onNoEmail: () => void;
}) {
	const { claim, refetchClaim, refetchCampaign } = useClaimMutations(code);
	const [address, setAddress] = useState("");
	const [fieldError, setFieldError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	// Covers the follow-up re-read after a 409 too, so the button can't be pressed in between.
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		const trimmed = address.trim();
		if (trimmed && !isValidAlephAddress(trimmed)) {
			setFieldError(INVALID_ADDRESS_MESSAGE);
			return;
		}
		setFieldError(null);
		setFormError(null);
		setSubmitting(true);
		try {
			await claim.mutateAsync(trimmed || null);
		} catch (error) {
			const status = error instanceof ClaimApiError ? error.status : null;
			if (status === 403) {
				onNoEmail();
			} else if (status === 409) {
				// Either this account already claimed (re-reading the claim shows it) or the wallet was
				// already used on this code by someone else.
				const existing = await refetchClaim().catch(() => null);
				if (!existing) setFieldError(errorDetail(error) ?? ADDRESS_IN_USE_MESSAGE);
			} else if (status === 400 || status === 422) {
				setFieldError(errorDetail(error) ?? INVALID_ADDRESS_MESSAGE);
			} else if (status === 404 || status === 410) {
				// Unknown code, or the window closed / filled up since the page loaded: re-reading the
				// campaign swaps the page to the matching state; the message covers the gap.
				setFormError(errorDetail(error) ?? "This offer isn't open right now.");
				void refetchCampaign();
			} else {
				setFormError(GENERIC_ERROR_MESSAGE);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			className="space-y-5"
			onSubmit={(e) => {
				e.preventDefault();
				void handleSubmit();
			}}
		>
			<AlephWalletField
				id="claim-aleph-address"
				value={address}
				onChange={(value) => {
					setAddress(value);
					setFieldError(null);
				}}
				error={fieldError}
				optional
				disabled={submitting}
				hint="Your Aleph Cloud credits are sent to this wallet. No wallet handy? Leave it empty and add one later."
			/>

			{formError && (
				<p className="text-sm text-destructive" role="alert">
					{formError}
				</p>
			)}

			<Button type="submit" size="lg" className="h-12 w-full text-base" disabled={submitting}>
				{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
				Claim {totalLabel} in credits
			</Button>
		</form>
	);
}
