import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Github, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountStore } from "@/stores/account";
import WalletConnectButtons from "@/components/WalletConnectButtons";

// Google/GitHub OAuth is hidden for now (only email + wallets). Flip to re-enable.
const SHOW_OAUTH = false;

// `onSuccess` overrides the default post-login redirect (used by the CLI authorize page,
// which stays on /cli to show the approve step instead of navigating to the dashboard).
export default function LoginPanel({ onSuccess }: { onSuccess?: () => void } = {}) {
	const loginWithEmail = useAccountStore((state) => state.loginWithEmail);
	const verifyEmailCode = useAccountStore((state) => state.verifyEmailCode);
	const loginWithOAuth = useAccountStore((state) => state.loginWithOAuth);
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<"email" | "code">("email");
	const [loading, setLoading] = useState(false);

	const handleSendEmail = async () => {
		if (!email) return;
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
		if (ok) {
			if (onSuccess) onSuccess();
			else navigate({ to: "/dashboard" });
		}
	};

	return (
		<div className="w-full max-w-sm space-y-4">
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
					/>
					<Button type="submit" className="w-full" disabled={loading || !email}>
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
						placeholder="123456"
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
					/>
					<Button type="submit" className="w-full" disabled={loading || code.length < 6}>
						{loading && <Loader2 className="h-4 w-4 animate-spin" />}
						Verify & sign in
					</Button>
					<button
						type="button"
						className="text-xs text-muted-foreground hover:underline"
						onClick={() => setStep("email")}
					>
						Use a different email
					</button>
				</form>
			)}

			{SHOW_OAUTH && (
				<>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="h-px flex-1 bg-border" />
						OR
						<span className="h-px flex-1 bg-border" />
					</div>

					<div className="space-y-2">
						<Button variant="outline" className="w-full" onClick={() => loginWithOAuth("google")}>
							Continue with Google
						</Button>
						<Button variant="outline" className="w-full" onClick={() => loginWithOAuth("github")}>
							<Github className="h-4 w-4" />
							Continue with GitHub
						</Button>
					</div>
				</>
			)}

			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				OR CONNECT A WALLET
				<span className="h-px flex-1 bg-border" />
			</div>

			<WalletConnectButtons />
		</div>
	);
}
