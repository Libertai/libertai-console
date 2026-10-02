import { ReactNode, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ExternalLink, Key, Loader2, Rocket } from "lucide-react";
import { Badge } from "@libertai/ui/badge";
import { Button } from "@libertai/ui/button";
import { Card, CardHeader } from "@libertai/ui/card";
import { SUPPORT_EMAIL } from "@libertai/lib/support";
import { CodeBlock } from "@/components/CodeBlock";
import { Claim, ClaimApiError, errorDetail, isValidAlephAddress } from "@/lib/claim-api";
import { useClaimMutations } from "@/hooks/data/use-claim";
import { longDate } from "@/lib/time";
import { formatWholeMoney } from "@/lib/utils";
import {
	ADDRESS_IN_USE_MESSAGE,
	AlephWalletField,
	GENERIC_ERROR_MESSAGE,
	INVALID_ADDRESS_MESSAGE,
} from "./AlephWalletField";

const ALEPH_APP_URL = "https://app.aleph.cloud";

// Same endpoint and default model as the API keys page examples.
const QUICKSTART = `from openai import OpenAI
client = OpenAI(base_url="https://api.libertai.io/v1", api_key="YOUR_API_KEY")
print(client.chat.completions.create(model="glm-5.3", messages=[{"role": "user", "content": "Hello!"}]).choices[0].message.content)`;

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export function ClaimSuccess({
	claim,
	pendingTimedOut,
	onRecheck,
	isRechecking,
}: {
	claim: Claim;
	pendingTimedOut: boolean;
	onRecheck: () => void;
	isRechecking: boolean;
}) {
	return (
		<div className="space-y-6">
			<Card className="p-5 sm:p-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden />
					<h1 className="text-2xl font-bold">Credits claimed</h1>
					{claim.event_name && <p className="text-sm text-muted-foreground">{claim.event_name}</p>}
				</div>

				<div className="mt-6 divide-y divide-border rounded-lg border border-border">
					<CreditRow
						label="LibertAI credits"
						amount={claim.libertai_amount}
						badge={<Badge variant="success">Added</Badge>}
					>
						In your account. Expires {longDate(claim.libertai_expires_at)}.
					</CreditRow>
					<AlephCreditRow
						claim={claim}
						pendingTimedOut={pendingTimedOut}
						onRecheck={onRecheck}
						isRechecking={isRechecking}
					/>
				</div>

				{claim.aleph_status === "none" && <AttachWalletForm claim={claim} />}
			</Card>

			<NextSteps claim={claim} />

			<div className="text-center">
				<Button variant="ghost" asChild>
					<Link to="/">Go to dashboard</Link>
				</Button>
			</div>
		</div>
	);
}

function CreditRow({
	label,
	amount,
	badge,
	children,
}: {
	label: string;
	amount: number;
	badge: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1 p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="text-sm font-medium">{label}</div>
				<div className="shrink-0 whitespace-nowrap">{badge}</div>
			</div>
			<div className="text-2xl font-bold">{formatWholeMoney(amount)}</div>
			<div className="text-sm text-muted-foreground">{children}</div>
		</div>
	);
}

function AlephCreditRow({
	claim,
	pendingTimedOut,
	onRecheck,
	isRechecking,
}: {
	claim: Claim;
	pendingTimedOut: boolean;
	onRecheck: () => void;
	isRechecking: boolean;
}) {
	const wallet = claim.aleph_address ? (
		<span className="font-mono whitespace-nowrap text-foreground" title={claim.aleph_address}>
			{shortAddress(claim.aleph_address)}
		</span>
	) : (
		"your wallet"
	);
	const label = "Aleph Cloud credits";

	switch (claim.aleph_status) {
		case "none":
			return (
				<CreditRow label={label} amount={claim.aleph_amount} badge={<Badge>Needs a wallet</Badge>}>
					Add your wallet below to receive them, any time before {longDate(claim.libertai_expires_at)}.
				</CreditRow>
			);
		case "pending":
			return (
				<CreditRow
					label={label}
					amount={claim.aleph_amount}
					badge={
						<Badge variant="info" className="gap-1">
							<Loader2 className="h-3 w-3 animate-spin" aria-hidden />
							Sending
						</Badge>
					}
				>
					{pendingTimedOut ? (
						<span className="flex flex-wrap items-center gap-x-3 gap-y-2">
							<span>Still on its way to {wallet}. This can take a few minutes.</span>
							<Button variant="outline" size="sm" onClick={onRecheck} disabled={isRechecking}>
								{isRechecking && <Loader2 className="h-3 w-3 animate-spin" />}
								Check again
							</Button>
						</span>
					) : (
						<>On its way to {wallet}, usually within seconds.</>
					)}
				</CreditRow>
			);
		case "sent":
			return (
				<CreditRow label={label} amount={claim.aleph_amount} badge={<Badge variant="success">Sent</Badge>}>
					Sent to {wallet}
					{claim.aleph_expires_at ? `. Expires ${longDate(claim.aleph_expires_at)}.` : "."}
				</CreditRow>
			);
		case "failed": {
			const subject = `Aleph credits not received (code ${claim.code})`;
			const body = `Wallet: ${claim.aleph_address ?? "not set"}`;
			return (
				<CreditRow label={label} amount={claim.aleph_amount} badge={<Badge>Delayed</Badge>}>
					We couldn't send these to {wallet} automatically. Email{" "}
					<a
						href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
						className="text-primary-text hover:underline"
					>
						{SUPPORT_EMAIL}
					</a>{" "}
					and we'll sort it out.
				</CreditRow>
			);
		}
	}
}

function AttachWalletForm({ claim }: { claim: Claim }) {
	const { attachWallet, refetchClaim } = useClaimMutations(claim.code);
	const [address, setAddress] = useState("");
	const [fieldError, setFieldError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		const trimmed = address.trim();
		if (!isValidAlephAddress(trimmed)) {
			setFieldError(INVALID_ADDRESS_MESSAGE);
			return;
		}
		setFieldError(null);
		setSubmitting(true);
		try {
			await attachWallet.mutateAsync(trimmed);
		} catch (error) {
			const status = error instanceof ClaimApiError ? error.status : null;
			if (status === 409) {
				// A wallet may have been added from another tab (re-reading shows it), or this one
				// is already used on this code.
				const latest = await refetchClaim().catch(() => null);
				if (!latest || latest.aleph_status === "none") setFieldError(errorDetail(error) ?? ADDRESS_IN_USE_MESSAGE);
			} else if (status === 400 || status === 422) {
				setFieldError(errorDetail(error) ?? INVALID_ADDRESS_MESSAGE);
			} else if (status === 410) {
				setFieldError(errorDetail(error) ?? "These credits have expired, so a wallet can no longer be added.");
			} else {
				setFieldError(GENERIC_ERROR_MESSAGE);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			className="mt-6 space-y-3"
			onSubmit={(e) => {
				e.preventDefault();
				void handleSubmit();
			}}
		>
			<AlephWalletField
				id="attach-aleph-address"
				value={address}
				onChange={(value) => {
					setAddress(value);
					setFieldError(null);
				}}
				error={fieldError}
				disabled={submitting}
				hint="Ethereum/Base (0x…) or Solana. Use a wallet you can connect to Aleph Cloud."
			/>
			<Button type="submit" size="lg" className="w-full" disabled={submitting || !address.trim()}>
				{submitting && <Loader2 className="h-4 w-4 animate-spin" />}
				Send my Aleph Cloud credits
			</Button>
		</form>
	);
}

function NextSteps({ claim }: { claim: Claim }) {
	return (
		<Card className="p-5 sm:p-6">
			<CardHeader title="Next steps" icon={<Rocket className="h-5 w-5 text-primary" />} />
			<ol className="space-y-6">
				<Step number={1} title="Create an API key">
					<Button asChild>
						<Link to="/api-keys">
							<Key className="h-4 w-4" />
							Create an API key
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</Step>
				<Step number={2} title="Make your first call">
					<p className="text-sm text-muted-foreground">
						Works with any OpenAI-compatible SDK or agent framework. Paste your key in place of YOUR_API_KEY.
					</p>
					{/* Long lines scroll rather than wrap: wrapped at phone width, the three lines turn into ten. */}
					<CodeBlock
						value={QUICKSTART}
						copyLabel="Copy code example"
						className="[&_pre]:text-xs [&_pre]:whitespace-pre sm:[&_pre]:text-sm"
					/>
					<a
						href="https://docs.libertai.io/apis/text"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block text-sm text-primary-text hover:underline"
					>
						API documentation
					</a>
				</Step>
				<Step number={3} title="Use your Aleph Cloud credits">
					<p className="text-sm text-muted-foreground">
						{claim.aleph_status === "sent"
							? "Connect the same wallet on Aleph Cloud. Your balance shows under credits."
							: "Once they've arrived, connect the same wallet on Aleph Cloud. Your balance shows under credits."}
					</p>
					<Button variant="outline" asChild>
						<a href={ALEPH_APP_URL} target="_blank" rel="noopener noreferrer">
							Open Aleph Cloud
							<ExternalLink className="h-4 w-4" />
						</a>
					</Button>
				</Step>
			</ol>
		</Card>
	);
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
	return (
		<li className="flex gap-3">
			<span
				className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-text"
				aria-hidden
			>
				{number}
			</span>
			<div className="min-w-0 flex-1 space-y-3">
				<h3 className="font-medium leading-6">{title}</h3>
				{children}
			</div>
		</li>
	);
}
