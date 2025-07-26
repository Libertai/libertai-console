import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, LogOut, Loader2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { thirdwebClient } from "@/config/thirdweb";
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { useAccountStore } from "@/stores/account";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { toast } from "sonner";

export default function AccountButton() {
	const account = useActiveAccount();
	const evmWallet = useActiveWallet();
	const solanaWallet = useWallet();
	const { disconnect } = useDisconnect();
	const onAccountChange = useAccountStore((state) => state.onAccountChange);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const formattedLtaiBalance = useAccountStore((state) => state.formattedLTAIBalance());
	const isAuthenticating = useAccountStore((state) => state.isAuthenticating);

	const [isInitializing, setIsInitializing] = useState(true);

	// Only show loading if there's actually a connected wallet AND we're authenticating
	const shouldShowEvmLoading = isAuthenticating && account && evmWallet;
	const shouldShowSolanaLoading = isAuthenticating && solanaWallet.wallet;

	useEffect(() => {
		onAccountChange(account, solanaWallet).then();
	}, [account, solanaWallet, onAccountChange, evmWallet]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitializing(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	evmWallet?.subscribe("accountChanged", (account) => {
		onAccountChange(account, solanaWallet).then();
	});

	// Format address to shorten it (e.g., 0x1234...5678)
	const formatAddress = (address: string | undefined) => {
		if (!address) return "";
		return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
	};

	// Show loading state while initializing
	if (isInitializing) {
		return (
			<Button variant="outline" disabled className="flex items-center gap-2 px-3 h-9 border-border">
				<Loader2 className="h-4 w-4 animate-spin" />
				Connecting...
			</Button>
		);
	}

	const handleCopyAddress = () => {
		if (account?.address) {
			navigator.clipboard?.writeText(account.address);
			toast.success("Address copied to clipboard");
		}
		console.log();
		if (solanaWallet && solanaWallet.publicKey) {
			navigator.clipboard?.writeText(solanaWallet.publicKey.toString());
			toast.success("Address copied to clipboard");
		}
	};

	if (solanaWallet.wallet !== null) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 px-3 h-9 border-border">
						<span className="flex items-center gap-2">
							{shouldShowSolanaLoading ? (
								<>
									<span className="hidden md:flex items-center text-muted-foreground text-xs">
										<Loader2 className="h-3 w-3 mr-1 animate-spin" />
										Loading...
									</span>
									<span className="h-4 w-px bg-border hidden md:block"></span>
								</>
							) : ltaiBalance >= 0 ? (
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

							<span className="text-sm">{formatAddress(solanaWallet.publicKey?.toString())}</span>
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[220px]">
					<div className="px-2 py-2 border-b border-border">
						<p className="text-xs text-muted-foreground">Connected as</p>
						<div className="flex items-center justify-between">
							<p className="font-medium truncate">{formatAddress(solanaWallet.publicKey?.toString())}</p>
							<Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0 hover:bg-muted">
								<Copy className="h-3 w-3" />
							</Button>
						</div>
					</div>

					<div className="px-2 py-2">
						<p className="text-xs text-muted-foreground">Balance</p>
						<p className="font-medium flex items-center">
							{shouldShowSolanaLoading ? (
								<>
									<Loader2 className="h-3 w-3 mr-1 animate-spin" />
									Loading...
								</>
							) : (
								<>
									<Coins className="h-3 w-3 mr-1 text-primary" />
									{formattedLtaiBalance} LTAI
								</>
							)}
						</p>
					</div>
					<DropdownMenuSeparator />
					<div className="">
						<DropdownMenuItem
							onClick={() => solanaWallet.disconnect()}
							className="cursor-pointer gap-2 text-destructive"
						>
							<LogOut className="h-4 w-4" />
							Disconnect
						</DropdownMenuItem>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	if (account !== undefined && evmWallet !== undefined) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 px-3 h-9 border-border">
						<span className="flex items-center gap-2">
							{shouldShowEvmLoading ? (
								<>
									<span className="hidden md:flex items-center text-muted-foreground text-xs">
										<Loader2 className="h-3 w-3 mr-1 animate-spin" />
										Loading...
									</span>
									<span className="h-4 w-px bg-border hidden md:block"></span>
								</>
							) : ltaiBalance >= 0 ? (
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
							<Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0 hover:bg-muted">
								<Copy className="h-3 w-3" />
							</Button>
						</div>
					</div>

					<div className="px-2 py-2">
						<p className="text-xs text-muted-foreground">Balance</p>
						<p className="font-medium flex items-center">
							{shouldShowEvmLoading ? (
								<>
									<Loader2 className="h-3 w-3 mr-1 animate-spin" />
									Loading...
								</>
							) : (
								<>
									<Coins className="h-3 w-3 mr-1 text-primary" />
									{formattedLtaiBalance} LTAI
								</>
							)}
						</p>
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => disconnect(evmWallet)} className="cursor-pointer gap-2 text-destructive">
						<LogOut className="h-4 w-4" />
						Disconnect
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<div className="relative">
			{/* Hidden components for auto-connection */}
			<div className="absolute opacity-0 pointer-events-none -z-10">
				<ConnectButton
					client={thirdwebClient}
					chain={base}
					connectButton={{
						label: "EVM & Social login",
					}}
				/>
				<WalletMultiButton />
			</div>

			{/* Visible dropdown UI */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 px-3 h-9 border-border">
						Connect Wallet
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[220px]">
					<div className="p-2">
						<ConnectButton
							client={thirdwebClient}
							chain={base}
							connectButton={{
								label: "EVM & Social login",
								className:
									"!w-full !bg-primary !hover:bg-primary/90 !text-primary-foreground !shadow-sm !h-9 !px-4 !py-2 !rounded-md !text-sm !font-medium !transition-colors !focus-visible:outline-none !focus-visible:ring-1 !focus-visible:ring-ring !disabled:pointer-events-none !disabled:opacity-50",
							}}
						/>
					</div>
					<DropdownMenuSeparator />
					<div className="p-2">
						<WalletMultiButton
							style={{
								width: "195px",
								height: "36px",
								borderRadius: "8px",
								fontSize: "14px",
								fontWeight: 500,
								fontFamily: "inherit",
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								backgroundColor: "#512da8",
								color: "#ffffff",
								boxShadow: "none",
								transition: "none",
								backgroundImage: "none",
							}}
						/>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
