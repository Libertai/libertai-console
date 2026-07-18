import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
	value,
	label = "Copy to clipboard",
	onCopied,
}: {
	value: string;
	label?: string;
	onCopied?: () => void;
}) {
	const [copied, setCopied] = useState(false);
	const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(resetTimer.current), []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			onCopied?.();
			clearTimeout(resetTimer.current);
			resetTimer.current = setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Couldn't copy to clipboard");
		}
	};

	return (
		<Button variant="ghost" size="icon" onClick={handleCopy} aria-label={label}>
			{copied ? <Check className="h-4 w-4 text-emerald-500" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
		</Button>
	);
}
