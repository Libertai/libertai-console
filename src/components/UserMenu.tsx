import { useNavigate } from "@tanstack/react-router";
import { Coins, LogOut, UserCircle } from "lucide-react";
import { useActiveWallet, useDisconnect } from "thirdweb/react";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountStore } from "@/stores/account";
import { useMe } from "@/hooks/data/use-me";

function formatAddress(address: string) {
	return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default function UserMenu() {
	const navigate = useNavigate();
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	const account = useAccountStore((state) => state.account);
	const formattedLtaiBalance = useAccountStore((state) => state.formattedLTAIBalance());
	const logout = useAccountStore((state) => state.logout);
	const { data: me } = useMe();

	const evmWallet = useActiveWallet();
	const solanaWallet = useSolanaWallet();
	const { disconnect } = useDisconnect();

	if (!isAuthenticated) {
		return <Button onClick={() => navigate({ to: "/login" })}>Connect</Button>;
	}

	const walletAddress = account?.address ?? me?.address ?? null;
	const displayLabel =
		me?.email ?? me?.display_name ?? (walletAddress ? formatAddress(walletAddress) : "Account");

	const handleSignOut = async () => {
		await logout();
		if (evmWallet) disconnect(evmWallet);
		if (solanaWallet.wallet) await solanaWallet.disconnect();
		navigate({ to: "/" });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="h-9 w-9 dark:border-slate-600" aria-label="Account menu">
					<UserCircle className="h-[1.2rem] w-[1.2rem]" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[220px]">
				<DropdownMenuLabel className="font-normal">
					<p className="text-xs text-muted-foreground">Signed in</p>
					<p className="font-medium truncate">{displayLabel}</p>
				</DropdownMenuLabel>
				{account?.address && (
					<>
						<DropdownMenuSeparator />
						<div className="px-2 py-1.5 text-sm flex items-center">
							<Coins className="h-3 w-3 mr-1 text-primary" />
							{formattedLtaiBalance} LTAI
						</div>
					</>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive">
					<LogOut className="h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
