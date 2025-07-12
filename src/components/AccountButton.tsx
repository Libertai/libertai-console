import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, LogOut, Copy } from "lucide-react";
import { useEffect } from "react";
import { thirdwebClient } from "@/config/thirdweb";
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { useAccountStore } from "@/stores/account";
import { toast } from "sonner";

export default function AccountButton() {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const { disconnect } = useDisconnect();
	const onAccountChange = useAccountStore((state) => state.onAccountChange);
	const formattedLtaiBalance = useAccountStore((state) => state.formattedLTAIBalance());

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

	const handleCopyAddress = () => {
		if (account?.address) {
			navigator.clipboard.writeText(account.address);
			toast.success("Address copied to clipboard");
		}
	};

	if (account !== undefined && wallet !== undefined) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 px-3 h-9 border-border">
						<span className="flex items-center gap-2">
							{formattedLtaiBalance !== "0" ? (
								<>
									<span className="hidden md:flex items-center text-muted-foreground text-xs">
										<Coins className="h-3 w-3 mr-1 text-primary" />
										{formattedLtaiBalance} LTAI
									</span>
									<span className="h-4 w-px bg-border hidden md:block"></span>
								</>
							) : (
								<></>
							)}

							<span className="text-sm">{formatAddress(account.address)}</span>
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[220px]">
					<div className="px-2 py-2 border-b border-border">
						<p className="text-xs text-muted-foreground">Connected as</p>
						<div className="flex items-center justify-between">
							<p className="font-medium truncate">{formatAddress(account.address)}</p>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCopyAddress}
								className="h-6 w-6 p-0 hover:bg-muted"
							>
								<Copy className="h-3 w-3" />
							</Button>
						</div>
					</div>

					<div className="px-2 py-2">
						<p className="text-xs text-muted-foreground">Balance</p>
						<p className="font-medium flex items-center">
							<Coins className="h-3 w-3 mr-1 text-primary" />
							{formattedLtaiBalance} LTAI
						</p>
					</div>
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
