import { useState } from "react";
import { Github, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAccountStore } from "@libertai/auth";
import { Button } from "@libertai/ui/button";
import { Input } from "@libertai/ui/input";
import { rememberPostLoginRedirect } from "@/hooks/use-post-login-redirect";

/**
 * Email-code and GitHub sign-in for the claim page, laid out like the shared LoginPanel minus
 * its wallet sign-in: a claim is tied to the account's email, so a wallet-only account would
 * sign in only to be refused.
 *
 * The 6-digit code signs in right here and the page moves on by itself. GitHub (and the email's
 * magic link, when opened in this same tab) leave the site and come back through /auth/callback
 * or /auth/verify, so `returnTo` is stored as the post-login destination before they start.
 */
export function ClaimSignIn({ returnTo }: { returnTo: string }) {
	const loginWithEmail = useAccountStore((state) => state.loginWithEmail);
	const verifyEmailCode = useAccountStore((state) => state.verifyEmailCode);
	const loginWithOAuth = useAccountStore((state) => state.loginWithOAuth);

	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<"email" | "code">("email");
	const [loading, setLoading] = useState(false);

	const handleSendEmail = async () => {
		if (!email) return;
		rememberPostLoginRedirect(returnTo);
		setLoading(true);
		const ok = await loginWithEmail(email);
		setLoading(false);
		if (ok) {
			setStep("code");
			toast.success("Check your email for a 6-digit code");
		}
	};

	const handleVerify = async () => {
		setLoading(true);
		const ok = await verifyEmailCode(email, code);
		setLoading(false);
		// Signed in on this page: drop the stored destination so it can't hijack a later sign-in.
		if (ok) rememberPostLoginRedirect(undefined);
	};

	return (
		<div className="space-y-4">
			{step === "email" ? (
				<form
					className="space-y-3"
					onSubmit={(e) => {
						e.preventDefault();
						handleSendEmail();
					}}
				>
					<Input
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						aria-label="Email address"
					/>
					<Button type="submit" size="lg" className="w-full" disabled={loading || !email}>
						{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
						Continue with email
					</Button>
				</form>
			) : (
				<form
					className="space-y-3"
					onSubmit={(e) => {
						e.preventDefault();
						handleVerify();
					}}
				>
					<p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {email}</p>
					<Input
						inputMode="numeric"
						autoComplete="one-time-code"
						placeholder="123456"
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
						aria-label="6-digit code"
						autoFocus
					/>
					<Button type="submit" size="lg" className="w-full" disabled={loading || code.length < 6}>
						{loading && <Loader2 className="h-4 w-4 animate-spin" />}
						Verify & sign in
					</Button>
					<button
						type="button"
						className="text-xs text-muted-foreground hover:underline"
						onClick={() => {
							setStep("email");
							setCode("");
						}}
					>
						Use a different email
					</button>
				</form>
			)}

			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				OR
				<span className="h-px flex-1 bg-border" />
			</div>

			<Button
				variant="outline"
				size="lg"
				className="w-full"
				onClick={() => {
					rememberPostLoginRedirect(returnTo);
					loginWithOAuth("github");
				}}
			>
				<Github className="h-4 w-4" />
				Continue with GitHub
			</Button>
		</div>
	);
}
