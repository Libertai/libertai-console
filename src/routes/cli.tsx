import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cliCodeAuthCliCodePost } from "@libertai/inference-sdk/sdk.gen";
import { useAccountStore, LoginPanel } from "@libertai/auth";
import { LibertaiLogo } from "@libertai/branding";
import { Button } from "@libertai/ui/button";
import { CopyButton } from "@libertai/ui/copy-button";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/cli")({
	head: () => routeHead("/cli"),
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
	const [code, setCode] = useState<string | null>(null);

	const paramsValid = redirectUri !== null && state !== "" && challenge !== "";

	// Full loopback URL carrying the minted code, used both by the background delivery
	// frame and by the manual "open it yourself" link.
	const callbackUrl = useMemo(() => {
		if (!redirectUri || !code) return null;
		const url = new URL(redirectUri.toString());
		url.searchParams.set("code", code);
		url.searchParams.set("state", state);
		return url.toString();
	}, [redirectUri, code, state]);

	const handleApprove = async () => {
		setSubmitting(true);
		setError(null);
		const response = await createCliCode(challenge);
		setSubmitting(false);
		if (!response) {
			setError("Could not authorize the CLI. Please try again.");
			return;
		}
		setCode(response);
	};

	return (
		<div className="container mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4 py-12 text-center">
			<div className="mb-6 flex flex-col items-center gap-3">
				<LibertaiLogo className="h-10 w-auto text-foreground" />
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
			) : code && callbackUrl ? (
				<CodeHandoff code={code} callbackUrl={callbackUrl} client={client} />
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

/** Post-approval view: hands the code to the CLI's loopback server in the background while
 * keeping it on screen, so a user whose browser can't reach the loopback can paste it instead. */
function CodeHandoff({ code, callbackUrl, client }: { code: string; callbackUrl: string; client: string }) {
	return (
		<div className="w-full space-y-4">
			{/* Best-effort delivery. A frame navigation isn't subject to CORS, unlike fetch, so the
			    CLI server needs no extra headers — but a cross-origin frame's load event fires for
			    error pages too, so we can't report success from here: the CLI's terminal does that. */}
			<iframe title="CLI callback" src={callbackUrl} sandbox="" className="hidden" aria-hidden="true" />

			<p className="text-sm text-muted-foreground">
				{client} has been authorized. Go back to your terminal — it should already be signed in.
			</p>

			<div className="space-y-2 text-left">
				<p className="text-xs text-muted-foreground">If nothing happened, paste this code into your terminal:</p>
				<div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
					<pre className="flex-1 overflow-x-auto text-xs break-all whitespace-pre-wrap">{code}</pre>
					<CopyButton value={code} label="Copy code" onCopied={() => toast.success("Code copied to clipboard")} />
				</div>
			</div>

			{/* New tab so the code stays on screen here if the loopback server is already gone. */}
			<a
				href={callbackUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
			>
				Or open the callback URL directly
			</a>
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
