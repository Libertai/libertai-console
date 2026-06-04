import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { cliCodeAuthCliCodePost } from "@/apis/inference/sdk.gen";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import LoginPanel from "@/components/LoginPanel";

export const Route = createFileRoute("/cli")({
	component: CliAuthorize,
});

// Only loopback redirect targets are accepted — the one-time code must come back to a
// local CLI server on this machine, never to an arbitrary host (defends against a crafted
// /cli link phishing a logged-in user's code).
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function parseRedirectUri(raw: string | null): URL | null {
	if (!raw) return null;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	if (url.protocol !== "http:") return null;
	if (!LOOPBACK_HOSTS.has(url.hostname)) return null;
	return url;
}

function CliAuthorize() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);

	const { redirectUri, state, challenge, client } = useMemo(() => {
		const params = new URLSearchParams(window.location.search);
		const clientRaw = params.get("client")?.trim();
		return {
			redirectUri: parseRedirectUri(params.get("redirect_uri")),
			state: params.get("state") ?? "",
			challenge: params.get("challenge") ?? "",
			// Human label of the app that started the flow (e.g. "LibertAI CLI",
			// "LibertAI Desktop"). Length-capped; React escapes it on render.
			client: clientRaw ? clientRaw.slice(0, 40) : "the LibertAI CLI",
		};
	}, []);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const paramsValid = redirectUri !== null && state !== "" && challenge !== "";

	const handleApprove = async () => {
		if (!redirectUri) return;
		setSubmitting(true);
		setError(null);
		const response = await createCliCode(challenge);
		if (!response) {
			setSubmitting(false);
			setError("Could not authorize the CLI. Please try again.");
			return;
		}
		// Hand the one-time code back to the CLI's local loopback server.
		redirectUri.searchParams.set("code", response);
		redirectUri.searchParams.set("state", state);
		window.location.href = redirectUri.toString();
	};

	return (
		<div className="container mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4 py-12 text-center">
			<div className="mb-6 flex flex-col items-center gap-3">
				<img src="/favicon.ico" alt="LibertAI" className="h-14 w-14 rounded-2xl shadow-sm" />
				<h1 className="text-xl font-semibold">Authorize {client}</h1>
			</div>

			{!paramsValid ? (
				<p className="text-sm text-muted-foreground">This link is invalid. Try signing in again from the app.</p>
			) : !isAuthenticated ? (
				<div className="w-full space-y-4">
					<p className="text-sm text-muted-foreground">Sign in to connect {client} to your account.</p>
					{/* Stay on /cli after sign-in; the page reacts to isAuthenticated and shows Approve. */}
					<div className="flex justify-center">
						<LoginPanel onSuccess={() => {}} />
					</div>
				</div>
			) : (
				<div className="w-full space-y-3">
					<p className="text-sm text-muted-foreground">Connect this device to your account.</p>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button className="w-full" onClick={handleApprove} disabled={submitting}>
						{submitting && <Loader2 className="h-4 w-4 animate-spin" />}
						Authorize
					</Button>
					<p className="text-xs text-muted-foreground">Only continue if you started this sign-in yourself.</p>
				</div>
			)}
		</div>
	);
}

/** Mint a PKCE-bound one-time code for the CLI; returns the code or null on failure.
 * Auth (Bearer token or wallet cookie) is attached by the shared inference client. */
async function createCliCode(challenge: string): Promise<string | null> {
	try {
		const response = await cliCodeAuthCliCodePost({ body: { challenge } });
		if (response.error) return null;
		return response.data?.code ?? null;
	} catch {
		return null;
	}
}
