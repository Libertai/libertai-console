import { ReactNode, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CircleOff, Mail, QrCode, SearchX, Users } from "lucide-react";
import { useAccountStore } from "@libertai/auth";
import { LibertaiLogo } from "@libertai/branding";
import { Badge } from "@libertai/ui/badge";
import { Button } from "@libertai/ui/button";
import { Card } from "@libertai/ui/card";
import { ErrorCard } from "@libertai/ui/error-card";
import { Skeleton } from "@libertai/ui/skeleton";
import { ClaimForm } from "@/components/claim/ClaimForm";
import { ClaimSignIn } from "@/components/claim/ClaimSignIn";
import { ClaimSuccess } from "@/components/claim/ClaimSuccess";
import { useCampaign, useMyClaim } from "@/hooks/data/use-claim";
import { useMe } from "@/hooks/data/use-me";
import { Campaign, ClaimApiError } from "@/lib/claim-api";
import { routeHead } from "@/lib/route-titles";
import { localDateTime, longDate } from "@/lib/time";
import { formatWholeMoney } from "@/lib/utils";

// Landing page for the event QR code (libertai.io/claim?e=<code> sends people here). Mostly
// opened on a phone at a booth, often by someone without an account yet.
export const Route = createFileRoute("/claim")({
	validateSearch: (search: Record<string, unknown>): { e?: string } => ({ e: parseCode(search.e) }),
	head: () => routeHead("/claim"),
	component: ClaimPage,
});

// The router JSON-parses search values, so an all-digit code would arrive as a number.
function parseCode(raw: unknown): string | undefined {
	const value = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
	return value || undefined;
}

function ClaimPage() {
	const { e: code } = Route.useSearch();

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8 sm:py-12">
			<Link to="/" className="mb-8 self-center" aria-label="LibertAI console">
				<LibertaiLogo className="h-8 w-auto text-foreground" />
			</Link>
			{code ? <ClaimFlow code={code} /> : <NoCode />}
		</div>
	);
}

function ClaimFlow({ code }: { code: string }) {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const isAuthPending = useAccountStore((state) => state.isInitialLoad);
	const campaign = useCampaign(code);
	const myClaim = useMyClaim(code);
	const me = useMe();
	const [refusedNoEmail, setRefusedNoEmail] = useState(false);
	// A 403 is about the account that got it: forget it once signed out, so the next account starts clean.
	if (refusedNoEmail && !isAuthenticated) setRefusedNoEmail(false);

	// Where sign-in should land: this exact page, rebuilt rather than copied from the location.
	const returnTo = `/claim?e=${encodeURIComponent(code)}`;

	// Signed in, wait for the claim and the profile too, or a wallet-only account would see the
	// claim form flash before the no-email notice replaces it.
	if (campaign.isPending || isAuthPending || (isAuthenticated && (myClaim.isPending || me.isPending))) {
		return <ClaimSkeleton />;
	}

	if (campaign.isError) {
		return (
			<ErrorCard
				message="Couldn't load this offer. Check your connection and try again."
				onRetry={() => void campaign.refetch()}
			/>
		);
	}

	const offer = campaign.data;
	if (!offer) {
		return (
			<Notice icon={<SearchX />} title="This code isn't valid">
				Check that you scanned the whole QR code, or ask someone at the booth.
			</Notice>
		);
	}

	// An existing claim shows whatever the offer's state now, so people can come back for it later.
	if (myClaim.data) {
		return (
			<ClaimSuccess
				claim={myClaim.data}
				pendingTimedOut={myClaim.pendingTimedOut}
				onRecheck={() => void myClaim.recheck()}
				isRechecking={myClaim.isFetching}
			/>
		);
	}

	if (offer.status !== "open") {
		return <OfferClosed offer={offer} signInRedirect={isAuthenticated ? null : returnTo} />;
	}

	if (!isAuthenticated) {
		return (
			<div className="space-y-8">
				<OfferHeader offer={offer} title={`Sign in to claim ${totalLabel(offer)} in credits`} />
				<Card className="p-5 sm:p-6">
					<ClaimSignIn returnTo={returnTo} />
				</Card>
			</div>
		);
	}

	// Claims are tied to the account's email, so wallet-only accounts are refused (403). Their
	// profile already says so; the 403 covers a profile that couldn't be read.
	const noEmail =
		refusedNoEmail ||
		(myClaim.error instanceof ClaimApiError && myClaim.error.status === 403) ||
		(me.data !== undefined && !me.data.email);
	if (noEmail) {
		return (
			<Notice icon={<Mail />} title="Sign in with email or GitHub to claim" action={<SignOutButton primary />}>
				You're signed in with a wallet. Each claim is tied to an email address, so sign out and continue with your email
				or GitHub account.
			</Notice>
		);
	}

	if (myClaim.isError) {
		return <ErrorCard message="Couldn't check your claim. Try again." onRetry={() => void myClaim.refetch()} />;
	}

	return (
		<div className="space-y-8">
			<OfferHeader offer={offer} title={`Claim ${totalLabel(offer)} in credits`} />
			<Card className="space-y-5 p-5 sm:p-6">
				<ClaimForm code={code} totalLabel={totalLabel(offer)} onNoEmail={() => setRefusedNoEmail(true)} />
				{me.data?.email && (
					<p className="text-center text-xs text-muted-foreground">
						Signed in as <span className="text-foreground">{me.data.email}</span>. Not you? <SignOutButton />
					</p>
				)}
			</Card>
		</div>
	);
}

const totalLabel = (offer: Campaign) => formatWholeMoney(offer.libertai_amount + offer.aleph_amount);

function OfferHeader({ offer, title }: { offer: Campaign; title: string }) {
	return (
		<div className="space-y-5 text-center">
			<div className="space-y-3">
				{offer.event && <Badge variant="info">{offer.event.name}</Badge>}
				<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
			</div>
			<div className="grid grid-cols-2 gap-3 text-left">
				<AmountTile amount={offer.libertai_amount} label="LibertAI credits" detail="Private AI inference API" />
				<AmountTile amount={offer.aleph_amount} label="Aleph Cloud credits" detail="Decentralized cloud compute" />
			</div>
			<p className="text-sm text-muted-foreground">Valid for {offer.credit_validity_days} days after you claim.</p>
		</div>
	);
}

function AmountTile({ amount, label, detail }: { amount: number; label: string; detail: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<div className="text-2xl font-bold text-primary-text">{formatWholeMoney(amount)}</div>
			<div className="mt-1 text-sm font-medium">{label}</div>
			<div className="text-xs text-muted-foreground">{detail}</div>
		</div>
	);
}

function OfferClosed({ offer, signInRedirect }: { offer: Campaign; signInRedirect: string | null }) {
	const event = offer.event;
	const signIn = signInRedirect && (
		<Link to="/login" search={{ redirect: signInRedirect }} className="text-sm text-primary-text hover:underline">
			Already claimed? Sign in to see your credits
		</Link>
	);

	if (offer.status === "upcoming") {
		return (
			<Notice icon={<CalendarClock />} title="Claims open soon" footer={signIn}>
				{event
					? `Claims for ${event.name} open ${localDateTime(event.starts_at)}.`
					: "Claims for this offer haven't opened yet."}{" "}
				Come back then: this same link will work.
			</Notice>
		);
	}
	if (offer.status === "full") {
		return (
			<Notice icon={<Users />} title="All claims have been taken" footer={signIn}>
				{event ? `Every claim for ${event.name} has been used.` : "Every claim for this offer has been used."}
			</Notice>
		);
	}
	return (
		<Notice icon={<CircleOff />} title="This offer has ended" footer={signIn}>
			{event ? `Claims for ${event.name} closed on ${longDate(event.ends_at)}.` : "This code isn't accepting claims."}
		</Notice>
	);
}

function NoCode() {
	return (
		<Notice icon={<QrCode />} title="Scan the QR code at the booth">
			This page claims event credits. Scan the QR code on the LibertAI banner to get started.
		</Notice>
	);
}

/** A centered single-message state: icon, title, copy, then one action (the console by default). */
function Notice({
	icon,
	title,
	children,
	action,
	footer,
}: {
	icon: ReactNode;
	title: string;
	children: ReactNode;
	action?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<Card className="flex flex-col items-center gap-4 p-5 text-center sm:p-6">
			<span className="text-primary-text [&_svg]:h-10 [&_svg]:w-10" aria-hidden>
				{icon}
			</span>
			<h1 className="text-xl font-semibold">{title}</h1>
			<p className="text-sm text-muted-foreground">{children}</p>
			{action ?? (
				<Button variant="outline" asChild>
					<Link to="/">Go to the console</Link>
				</Button>
			)}
			{footer}
		</Card>
	);
}

/** Like the account menu's sign-out: end the session, then drop any connected wallet, or the
 * wallet would sign straight back in on the next visit. The page then shows the sign-in panel. */
function SignOutButton({ primary = false }: { primary?: boolean }) {
	const logout = useAccountStore((state) => state.logout);

	const handleSignOut = async () => {
		await logout();
		// The disconnect goes through the shared WalletSync, which drops every connected wallet when
		// this flag is set. Calling thirdweb's hooks from here doesn't work: console code resolves a
		// second copy of thirdweb (pnpm peer variant) whose context the shared provider never fills.
		useAccountStore.setState({ staleWalletConnection: true });
	};

	return primary ? (
		<Button size="lg" className="w-full" onClick={() => void handleSignOut()}>
			Sign out and switch account
		</Button>
	) : (
		<button type="button" className="text-primary-text hover:underline" onClick={() => void handleSignOut()}>
			Sign out
		</button>
	);
}

function ClaimSkeleton() {
	return (
		<div className="space-y-8">
			<div className="flex flex-col items-center space-y-3">
				<Skeleton className="h-6 w-40 rounded-full" />
				<Skeleton className="h-9 w-64" />
				<div className="grid w-full grid-cols-2 gap-3">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
			</div>
			<Card className="space-y-3 p-5 sm:p-6">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-12 w-full" />
			</Card>
		</div>
	);
}
