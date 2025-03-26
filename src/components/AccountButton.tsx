import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, Copy, ExternalLink, Key, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { thirdwebClient } from "@/config/thirdweb";
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { useAccountStore } from "@/stores/account";
import { useNavigate } from "@tanstack/react-router";

export default function AccountButton() {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const { disconnect } = useDisconnect();
	const navigate = useNavigate();
	const [copySuccess, setCopySuccess] = useState(false);
	const onAccountChange = useAccountStore((state) => state.onAccountChange);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);

	useEffect(() => {
		onAccountChange(account).then();
	}, [account, onAccountChange]);

	wallet?.subscribe("accountChanged", (account) => {
		onAccountChange(account).then();
	});

	// Format address to shorten it (e.g., 0x1234...5678)
	const formatAddress = (address: string | undefined) => {
		if (!address) return "";
		return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
	};

	// Copy address to clipboard
	const copyAddressToClipboard = () => {
		if (account?.address !== undefined) {
			navigator.clipboard.writeText(account.address);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		}
	};

	// View on explorer
	const viewOnExplorer = () => {
		if (account?.address !== undefined) {
			window.open(`https://basescan.org/address/${account.address}`, "_blank");
		}
	};

	if (account !== undefined && wallet !== undefined) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 px-3 h-9 border-border">
						<span className="flex items-center gap-2">
							<span className="hidden md:flex items-center text-muted-foreground text-xs">
								<Coins className="h-3 w-3 mr-1 text-primary" />
								{ltaiBalance} LTAI
							</span>
							<span className="h-4 w-px bg-border hidden md:block"></span>
							<span className="text-sm">{formatAddress(account.address)}</span>
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[220px]">
					<div className="px-2 py-2 border-b border-border">
						<p className="text-xs text-muted-foreground">Connected as</p>
						<p className="font-medium truncate">{formatAddress(account.address)}</p>
					</div>

					<div className="px-2 py-2 border-b border-border">
						<p className="text-xs text-muted-foreground">Balance</p>
						<p className="font-medium flex items-center">
							<Coins className="h-3 w-3 mr-1 text-primary" />
							{ltaiBalance} LTAI
						</p>
					</div>

					<DropdownMenuItem onClick={copyAddressToClipboard} className="cursor-pointer gap-2">
						<Copy className="h-4 w-4" />
						{copySuccess ? "Copied!" : "Copy Address"}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={viewOnExplorer} className="cursor-pointer gap-2">
						<ExternalLink className="h-4 w-4" />
						View on Explorer
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })} className="cursor-pointer gap-2">
						<LayoutDashboard className="h-4 w-4" />
						Dashboard
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate({ to: "/api-keys" })} className="cursor-pointer gap-2">
						<Key className="h-4 w-4" />
						API Keys
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => disconnect(wallet)} className="cursor-pointer gap-2 text-destructive">
						<LogOut className="h-4 w-4" />
						Disconnect
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<ConnectButton
			client={thirdwebClient}
			chain={base}
			connectButton={{
				className:
					"!bg-primary !hover:bg-primary/90 !text-primary-foreground !shadow-sm !h-9 !px-4 !py-2 !rounded-md !text-sm !font-medium !transition-colors !focus-visible:outline-none !focus-visible:ring-1 !focus-visible:ring-ring !disabled:pointer-events-none !disabled:opacity-50",
			}}
		/>
	);
}
