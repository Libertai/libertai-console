import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, TerminalSquare } from "lucide-react";
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

	const { redirectUri, state, challenge } = useMemo(() => {
		const params = new URLSearchParams(window.location.search);
		return {
			redirectUri: parseRedirectUri(params.get("redirect_uri")),
			state: params.get("state") ?? "",
			challenge: params.get("challenge") ?? "",
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
		<div className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12 text-center">
			<div className="mb-6 flex flex-col items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<TerminalSquare className="h-6 w-6 text-primary" />
				</div>
				<h1 className="text-xl font-semibold">Authorize the LibertAI CLI</h1>
			</div>

			{!paramsValid ? (
				<p className="text-muted-foreground">
					This authorization link is invalid or incomplete. Run <code>libertai login</code> again from your
					terminal.
				</p>
			) : !isAuthenticated ? (
				<div className="w-full space-y-4">
					<p className="text-sm text-muted-foreground">Sign in to connect your terminal to LibertAI.</p>
					{/* Stay on /cli after sign-in; the page reacts to isAuthenticated and shows Approve. */}
					<div className="flex justify-center">
						<LoginPanel onSuccess={() => {}} />
					</div>
				</div>
			) : (
				<div className="w-full space-y-4">
					<p className="text-muted-foreground">
						A device wants to sign in to LibertAI as you and create a CLI API key on this machine.
					</p>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button className="w-full" onClick={handleApprove} disabled={submitting}>
						{submitting && <Loader2 className="h-4 w-4 animate-spin" />}
						Authorize this device
					</Button>
					<p className="text-xs text-muted-foreground">
						Only approve this if you just started <code>libertai login</code> yourself.
					</p>
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
