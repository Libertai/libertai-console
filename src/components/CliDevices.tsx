import { useMemo, useState } from "react";
import { Terminal } from "lucide-react";
import { Button } from "@libertai/ui/button";
import { Card, CardHeader } from "@libertai/ui/card";
import { ConfirmDialog } from "@libertai/ui/confirm-dialog";
import { ErrorCard } from "@libertai/ui/error-card";
import { Skeleton } from "@libertai/ui/skeleton";
import { ToggleGroup } from "@libertai/ui/toggle-group";
import { CliApiKey } from "@libertai/inference-sdk";
import { CodeBlock } from "@/components/CodeBlock";
import { useCliDevices } from "@/hooks/data/use-cli-keys";
import { parseDeviceName, sortDevices } from "@/lib/cli-devices";
import { daysUntil, fromNow, shortDate } from "@/lib/time";

const CODE_URL = "https://code.libertai.io";
const WINDOWS_RELEASES_URL = "https://github.com/Libertai/libertai-cli/releases/latest";
const LOGIN_COMMAND = "libertai login";
// Devices this close to expiry get a renewal nudge; past it the key vanishes from the list.
const EXPIRY_WARNING_DAYS = 30;

const INSTALL_METHODS = [
	{
		value: "unix",
		label: "Linux / macOS",
		command: "curl -fsSL https://raw.githubusercontent.com/Libertai/libertai-cli/master/packaging/install.sh | sh",
	},
	{ value: "apt", label: "Debian / Ubuntu", command: "curl -fsSL https://apt.libertai.io/install.sh | sudo bash" },
	{ value: "brew", label: "Homebrew", command: "brew install Libertai/tap/libertai" },
	{
		value: "cargo",
		label: "Rust",
		command: "cargo install --git https://github.com/Libertai/libertai-cli --branch master --locked",
	},
];

// None of the install commands run on native Windows, and the .exe build is surfaced
// nowhere else. macOS and Linux both want the first tab, so they need no detection.
function isWindows(): boolean {
	const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
	return /win/i.test(nav.userAgentData?.platform ?? nav.platform ?? "");
}

function SeeMoreLink() {
	return (
		<a href={CODE_URL} className="text-primary-text underline" target="_blank" rel="noopener noreferrer">
			See more
		</a>
	);
}

function InstallBlock() {
	const [method, setMethod] = useState(INSTALL_METHODS[0].value);
	const [windows] = useState(isWindows);
	const selected = INSTALL_METHODS.find((m) => m.value === method) ?? INSTALL_METHODS[0];

	return (
		<div className="space-y-3">
			{windows && (
				<p className="text-sm text-muted-foreground">
					No native Windows install yet — use WSL with the Linux / macOS command, or grab the{" "}
					<a
						href={WINDOWS_RELEASES_URL}
						className="text-primary-text underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						.exe from the latest release
					</a>
					.
				</p>
			)}
			<ToggleGroup
				className="flex-wrap"
				value={method}
				onValueChange={setMethod}
				options={INSTALL_METHODS.map((m) => ({ value: m.value, label: m.label }))}
			/>
			<CodeBlock value={selected.command} copyLabel={`Copy ${selected.label} install command`} />
			<p className="text-sm text-muted-foreground">Then connect this machine:</p>
			<CodeBlock value={LOGIN_COMMAND} copyLabel="Copy login command" />
		</div>
	);
}

function EmptyState() {
	return (
		<div className="space-y-4 px-6 py-4">
			<h3 className="text-lg font-semibold">Your agent. Your inference. Your machine.</h3>
			<p className="text-sm text-muted-foreground">
				Keep the coding agent you already use — <strong className="text-foreground">Claude Code, OpenCode</strong> —
				and run it on <strong className="text-foreground">open-weights models you control</strong>. Private by
				default, no vendor lock-in, no wallet. We don't replace your agent; we just swap the backend. One command.
			</p>
			<InstallBlock />
			<p className="text-sm text-muted-foreground">
				<SeeMoreLink />
			</p>
		</div>
	);
}

function DeviceRow({ device, onDisconnect }: { device: CliApiKey; onDisconnect: () => void }) {
	const { name, installId } = parseDeviceName(device.name);
	const lastUsed = fromNow(device.last_used_at);
	const connected = shortDate(device.created_at);
	const expiresIn = daysUntil(device.expires_at);

	return (
		<li className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
			<div className="flex min-w-0 items-start gap-3">
				<Terminal className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
				<div className="min-w-0 space-y-1">
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="font-medium break-all">{name}</span>
						{installId && <span className="font-mono text-xs text-muted-foreground">{installId}</span>}
					</div>
					<p className="text-sm text-muted-foreground">
						{lastUsed ? `Last used ${lastUsed} · Connected ${connected}` : `Connected ${connected} · No requests yet`}
					</p>
					{expiresIn !== null && expiresIn <= EXPIRY_WARNING_DAYS && (
						<p className="text-sm text-amber-500">
							Expires in {expiresIn} {expiresIn === 1 ? "day" : "days"} — run {LOGIN_COMMAND} on that machine to
							renew
						</p>
					)}
				</div>
			</div>
			<Button variant="outline" size="sm" onClick={onDisconnect} aria-label={`Disconnect ${name}`}>
				Disconnect
			</Button>
		</li>
	);
}

export function CliDevices() {
	const { devices, isLoading, isError, refetch, disconnectDevice } = useCliDevices();
	const [pendingDisconnect, setPendingDisconnect] = useState<CliApiKey | null>(null);
	// Survives the dialog's close animation so the description doesn't flash while it fades.
	const [pendingName, setPendingName] = useState<string | null>(null);

	const sorted = useMemo(() => sortDevices(devices), [devices]);

	return (
		<Card className="p-0 overflow-hidden">
			{/* Card hardcodes p-6, so every block inside a p-0 card carries its own padding. */}
			<div className="px-6 pt-6">
				<CardHeader
					title="Connected devices"
					icon={<Terminal className="h-5 w-5 text-primary" />}
					className="mb-2"
				/>
				<p className="text-sm text-muted-foreground">Machines signed in with the LibertAI CLI or Desktop app.</p>
			</div>

			{isLoading ? (
				<div className="space-y-2 px-6 py-4">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			) : isError && devices.length === 0 ? (
				// react-query keeps data on a failed background refetch, so an unguarded
				// isError would replace a working list with an error card.
				// ErrorCard's plain mode has no horizontal padding of its own — supply it here.
				<div className="px-6">
					<ErrorCard plain message="Couldn't load your connected devices." onRetry={refetch} />
				</div>
			) : sorted.length === 0 ? (
				<EmptyState />
			) : (
				<>
					<ul className="divide-y divide-border border-t border-border">
						{sorted.map((device) => (
							<DeviceRow
								key={device.id}
								device={device}
								onDisconnect={() => {
									setPendingDisconnect(device);
									setPendingName(parseDeviceName(device.name).name);
								}}
							/>
						))}
					</ul>
					<div className="flex flex-wrap gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground">
						<span>
							Install on another machine →{" "}
							<a href={CODE_URL} className="text-primary-text underline" target="_blank" rel="noopener noreferrer">
								code.libertai.io
							</a>
						</span>
					</div>
					<div className="px-6 pb-6">
						<CodeBlock value={LOGIN_COMMAND} copyLabel="Copy login command" />
					</div>
				</>
			)}

			<ConfirmDialog
				open={!!pendingDisconnect}
				onOpenChange={(open) => !open && setPendingDisconnect(null)}
				title="Disconnect device"
				description={`${pendingName} will stop making requests. Sign in again with libertai login on that machine to reconnect.`}
				confirmLabel="Disconnect"
				destructive
				onConfirm={() => pendingDisconnect && disconnectDevice(pendingDisconnect.id)}
			/>
		</Card>
	);
}
