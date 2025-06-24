import { create } from "zustand";
import { Account } from "thirdweb/wallets";
import env from "@/config/env.ts";
import { base } from "thirdweb/chains";
import {
	checkAuthStatusAuthStatusGet,
	getAuthMessageAuthMessagePost, getSolanaLtaiBalanceCreditsLtaiSolanaBalanceGet,
	loginWithWalletAuthLoginPost
} from "@/apis/inference/sdk.gen";
import { toast } from "sonner";
import { ethers } from "ethers";
import {WalletContextState} from "@solana/wallet-adapter-react"
import { Buffer } from "buffer";

const LTAI_BASE_ADDRESS = env.LTAI_BASE_ADDRESS as `0x${string}`;

type AccountStoreState = {
	alephStorage: null;
	ltaiBalance: number;
	apiCredits: number;
	formattedLTAIBalance: () => string;
	formattedAPICredits: () => string;
	baseAccount: Account | null;
	solanaAccount: WalletContextState | null;
	isAuthenticated: boolean;
	isAuthenticating: boolean;
	lastTransactionHash: string | null;
	isInitialLoad: boolean;
	onAccountChange: (newBaseAccount: Account | undefined, newSolanaAccount: WalletContextState | undefined) => Promise<void>;
	getLTAIBalance: () => Promise<number>;
	getAPICredits: () => Promise<number>;
	onDisconnect: () => void;
	authenticate: (baseAccount: Account | undefined, solanaAccount: WalletContextState | undefined, showErrors?: boolean) => Promise<boolean>;
	checkAuthStatus: (accountAddress: string) => Promise<boolean>;
	setLastTransactionHash: (hash: string | null) => void;
	setInitialLoadComplete: () => void;
};

export const useAccountStore = create<AccountStoreState>((set, get) => ({
	alephStorage: null,
	ltaiBalance: 0,
	apiCredits: 0,
	formattedLTAIBalance: () => get().ltaiBalance.toFixed(0),
	formattedAPICredits: () => get().apiCredits.toFixed(0),
	baseAccount: null,
	solanaAccount: null,
	isAuthenticated: false,
	isAuthenticating: false,
	lastTransactionHash: null,
	isInitialLoad: true,

	onAccountChange: async (newBaseAccount: Account | undefined, newSolanaAccount: WalletContextState | undefined) => {
		const state = get();


		// Check if both accounts are undefined/null - this indicates disconnection
		if (newBaseAccount === undefined && (newSolanaAccount === undefined || !newSolanaAccount.publicKey)) {
			// Potential disconnection
			state.onDisconnect();
			return;
		}

		// Check if base account is already connected with the same address
		if (state.baseAccount !== null && newBaseAccount !== undefined && state.baseAccount.address === newBaseAccount.address) {
			// Account already connected with the same address
			return
		}

		// Check if solana account is already connected with the same address
		if (state.solanaAccount !== null && newSolanaAccount !== undefined && newSolanaAccount.publicKey && 
			state.solanaAccount.publicKey?.toString() === newSolanaAccount.publicKey.toString()) {
			// Solana account already connected with the same address
			return
		}


		if (state.isAuthenticating) {
			// Prevent multiple simultaneous authentication attempts
			return;
		}


		// Set the account first so UI shows connected state
		if (newBaseAccount !== undefined) {
			set({ baseAccount: newBaseAccount });
			set({ solanaAccount: null });
		} else if (newSolanaAccount !== undefined && newSolanaAccount.publicKey) {
			set({ solanaAccount: newSolanaAccount });
			set({ baseAccount: null });
		}


		// First check if we're already authenticated with this wallet
		set({ isAuthenticating: true });

		try {
			const adr = newSolanaAccount?.publicKey?.toString() || newBaseAccount?.address || "";
			const isAlreadyAuthenticated = await state.checkAuthStatus(adr);

			let authSuccess = isAlreadyAuthenticated;
			if (!isAlreadyAuthenticated) {
				// Only try to authenticate if this isn't an initial page load reconnection
				// or if user manually clicked connect
				const shouldShowErrors = !state.isInitialLoad;
				authSuccess = await state.authenticate(newBaseAccount, newSolanaAccount, shouldShowErrors);
			}


			set({ 
				isAuthenticating: false, 
				isAuthenticated: authSuccess 
			});

			// Get LTAI token balance from blockchain regardless of auth status
			const ltaiBalance = await state.getLTAIBalance();
			set({ ltaiBalance: ltaiBalance });


			// Mark initial load as complete
			if (state.isInitialLoad) {
				set({ isInitialLoad: false });
			}


		} catch (error) {
			console.error("Account change error:", error);
			set({ 
				isAuthenticating: false,
				isAuthenticated: false 
			});
			
			// Still get balance even if auth fails
			try {
				const ltaiBalance = await state.getLTAIBalance();
				set({ ltaiBalance: ltaiBalance });
			} catch (balanceError) {
				console.error("Balance fetch error:", balanceError);
			}

			// Mark initial load as complete even on error
			if (state.isInitialLoad) {
				set({ isInitialLoad: false });
			}
		}
	},
	getLTAIBalance: async (): Promise<number> => {
		const state = get();
    let balance: string = "0";
    const hexBalanceOfFunction = "0x70a08231";

		if (state.baseAccount === null && state.solanaAccount === null) {
			return 0;
		}

		if (state.baseAccount) {
			const address = state.baseAccount.address.startsWith("0x") ? state.baseAccount.address.slice(2) : state.baseAccount.address;
			const paddedAddress = address.padStart(64, "0");
			const body = {
				"jsonrpc":"2.0",
				"method":"eth_call",
				"params": [
					{
						"to": LTAI_BASE_ADDRESS,
						"data": `${hexBalanceOfFunction}${paddedAddress}`
					},
					"latest"
				],
				"id": base.id
			}

			try {
				const response = await fetch("https://mainnet.base.org", {
					method: "POST",
					body: JSON.stringify(body),
					headers: {
						"Content-Type": "application/json"
					}
				});

				const json = await response.json();
				const weiBalance = ethers.getBigInt(json.result);
				balance = ethers.formatEther(weiBalance);
			} catch (error) {
				console.error("Error fetching balance:", error);
			}
		} else if (state.solanaAccount && state.solanaAccount.publicKey) {

			try {
				const messageResponse = await getSolanaLtaiBalanceCreditsLtaiSolanaBalanceGet({
					query: {
						address: state.solanaAccount.publicKey.toString(),
					}
				});
				balance = String(messageResponse.data ? messageResponse.data : 0);
			} catch (error) {
				console.error("Error fetching Solana balance:", error);
			}
		}
		return Number(balance);
	},
	getAPICredits: async (): Promise<number> => {
		// This would typically come from the API after authentication
		// For now we'll return a placeholder value until we implement the proper endpoint
		return 0;
	},
	checkAuthStatus: async (accountAddress: string): Promise<boolean> => {
		try {
			const response = await checkAuthStatusAuthStatusGet();

			return !!(response.data?.authenticated && response.data.address === accountAddress);
		} catch (error) {
			console.error("Auth status check error:", error);
			return false;
		}
	},
	authenticate: async (baseAccount: Account | undefined, solanaAccount: WalletContextState | undefined, showErrors?: boolean): Promise<boolean> => {
		const state = get();

		if (baseAccount !== undefined) {
			try {
				// Get the message to sign
				const messageResponse = await getAuthMessageAuthMessagePost({
					body: {
						address: baseAccount.address,
					},
				});

				if (!messageResponse.data?.message) {
					console.error("No message received from server");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Could not get message to sign",
						});
					}
					return false;
				}

				// Sign the message
				const signature = await baseAccount.signMessage({ message: messageResponse.data.message });

				if (!signature) {
					console.error("No signature generated");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Could not sign message",
						});
					}
					return false;
				}

				// Login with the signature
				const loginResponse = await loginWithWalletAuthLoginPost({
					body: {
						address: baseAccount.address,
						signature: signature,
						chain: "base"
					},
				});

				if (loginResponse.data?.access_token) {
					// Store the JWT token
					set({ isAuthenticated: true });

					// Update API credits
					const apiCredits = await state.getAPICredits();
					set({ apiCredits });

					return true;
				} else {
					console.error("No access token received");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Invalid response from server",
						});
					}
					return false;
				}
			} catch (error) {
				console.error("Authentication error:", error);

				// Only show toast if we should show errors
				if (showErrors) {
					toast.error("Authentication failed", {
						description: error instanceof Error ? error.message : "Unknown error",
					});
				}
				return false;
			}
		} else if (solanaAccount !== undefined && solanaAccount.publicKey && solanaAccount.signMessage) {
			try {
				const address = solanaAccount.publicKey.toString();

				// Get the message to sign
				const messageResponse = await getAuthMessageAuthMessagePost({
					body: {
						address: address,
					},
				});

				if (!messageResponse.data?.message) {
					console.error("No message received from server");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Could not get message to sign",
						});
					}
					return false;
				}

				// Sign the message using Solana wallet
				const messageBytes = new TextEncoder().encode(messageResponse.data.message);
				const signature = await solanaAccount.signMessage(messageBytes);

				if (!signature) {
					console.error("No signature generated");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Could not sign message",
						});
					}
					return false;
				}

				const signatureBase64 = Buffer.from(signature).toString('base64');

				// Login with the signature
				const loginResponse = await loginWithWalletAuthLoginPost({
					body: {
						address: address,
						signature: signatureBase64,
						chain: "solana"
					},
				});

				if (loginResponse.data?.access_token) {
					// Store the JWT token
					set({ isAuthenticated: true });

					// Update API credits
					const apiCredits = await state.getAPICredits();
					set({ apiCredits });

					return true;
				} else {
					console.error("No access token received");
					if (showErrors) {
						toast.error("Authentication failed", {
							description: "Invalid response from server",
						});
					}
					return false;
				}
			} catch (error) {
				console.error("Solana authentication error:", error);

				// Only show toast if we should show errors
				if (showErrors) {
					toast.error("Authentication failed", {
						description: error instanceof Error ? error.message : "Unknown error",
					});
				}
				return false;
			}
		}
		return false;
	},
	onDisconnect: () => {
		set({
			baseAccount: null,
			solanaAccount: null,
			alephStorage: null,
			isAuthenticated: false,
			ltaiBalance: 0,
			apiCredits: 0,
			lastTransactionHash: null,
			isInitialLoad: true,
		});
	},

	setLastTransactionHash: (hash: string | null) => {
		set({ lastTransactionHash: hash });
	},

	setInitialLoadComplete: () => {
		set({ isInitialLoad: false });
	},
}));
