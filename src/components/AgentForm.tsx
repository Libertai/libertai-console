import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { z } from "zod";
import { CreateAgentRequest } from "@/apis/inference/types.gen";

interface AgentFormProps {
	onSubmit: (data: CreateAgentRequest) => void;
	onCancel: () => void;
	isLoading?: boolean;
	monthlyPrice: number;
	userCredits: number;
}

// Define form schema with Zod
const agentFormSchema = z.object({
	name: z.string().min(1, "Agent name is required"),
	sshPublicKey: z.string().min(1, "SSH Public Key is required"),
	agreeToTerms: z.literal(true, { error: () => ({ message: "You must agree to the subscription terms" }) }),
});

export function AgentForm({
	onSubmit,
	onCancel,
	isLoading = false,
	monthlyPrice,
	userCredits,
}: Readonly<AgentFormProps>) {
	const [name, setName] = useState("");
	const [sshPublicKey, setSshPublicKey] = useState("");
	const [agreeToTerms, setAgreeToTerms] = useState(false);
	const [errors, setErrors] = useState<{ name?: string; sshPublicKey?: string; agreeToTerms?: string }>({});

	const hasEnoughCredits = userCredits >= monthlyPrice;

	const validateForm = (): boolean => {
		try {
			agentFormSchema.parse({
				name,
				sshPublicKey,
				agreeToTerms,
			});
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors: { name?: string; sshPublicKey?: string; agreeToTerms?: string } = {};

				error.errors.forEach((err) => {
					const field = err.path[0] as keyof typeof fieldErrors;
					if (field) {
						fieldErrors[field] = err.message;
					}
				});

				setErrors(fieldErrors);
			}
			return false;
		}
	};

	const handleSubmit = () => {
		if (!validateForm()) return;
		if (!hasEnoughCredits) return;

		onSubmit({
			name: name.trim(),
			ssh_public_key: sshPublicKey.trim(),
			subscription_months: 1, // Default to 1 month
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="agent-name" className="block text-sm font-medium text-muted-foreground">
					Agent Name*
				</label>
				<Input
					id="agent-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. My AI Assistant"
					className={`w-full ${errors.name ? "border-destructive" : ""}`}
					aria-invalid={!!errors.name}
				/>
				{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
				<p className="text-xs text-muted-foreground">Give your agent a memorable name to easily identify it</p>
			</div>

			<div className="space-y-2">
				<label htmlFor="ssh-key" className="block text-sm font-medium text-muted-foreground">
					SSH Public Key*
				</label>
				<textarea
					id="ssh-key"
					value={sshPublicKey}
					onChange={(e) => setSshPublicKey(e.target.value)}
					placeholder="ssh-rsa AAAAB3Nza..."
					className={`w-full p-2 border border-border rounded-md bg-background min-h-[100px] ${
						errors.sshPublicKey ? "border-destructive" : ""
					}`}
					aria-invalid={!!errors.sshPublicKey}
				/>
				{errors.sshPublicKey && <p className="text-xs text-destructive">{errors.sshPublicKey}</p>}
				<p className="text-xs text-muted-foreground">
					You will be the only one to have access to your agent instance with this key
				</p>
			</div>

			<div className="pt-2">
				<div className="flex items-center space-x-2">
					<Switch
						id="terms"
						checked={agreeToTerms}
						onCheckedChange={setAgreeToTerms}
						className={errors.agreeToTerms ? "border-destructive cursor-pointer" : "cursor-pointer"}
					/>
					<label htmlFor="terms" className="text-sm">
						I agree to a monthly charge of ${monthlyPrice} from my credit balance
					</label>
				</div>
				{errors.agreeToTerms && <p className="text-xs text-destructive mt-1">{errors.agreeToTerms}</p>}
			</div>

			{!hasEnoughCredits && (
				<div className="flex items-center text-amber-500 bg-amber-500/10 p-3 rounded-md">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="mr-2"
					>
						<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
						<path d="M12 9v4"></path>
						<path d="M12 17h.01"></path>
					</svg>
					<span className="text-sm">You need at least ${monthlyPrice} in your balance to subscribe to an agent.</span>
				</div>
			)}

			<div className="flex justify-end gap-3 mt-6">
				<Button variant="outline" onClick={onCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isLoading || !hasEnoughCredits}>
					{isLoading ? "Creating..." : "Create Agent"}
				</Button>
			</div>
		</div>
	);
}
