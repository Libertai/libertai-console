import { create } from "zustand";
import { Account } from "thirdweb/wallets";
import env from "@/config/env.ts";
import { base } from "thirdweb/chains";
import {
	checkAuthStatusAuthStatusGet,
	getAuthMessageAuthMessagePost,
	loginWithWalletAuthLoginPost,
} from "@/apis/inference/sdk.gen";
import { toast } from "sonner";
import { ethers } from "ethers";

const LTAI_BASE_ADDRESS = env.LTAI_BASE_ADDRESS as `0x${string}`;

type AccountStoreState = {
	alephStorage: null;
	ltaiBalance: number;
	apiCredits: number;
	formattedLTAIBalance: () => string;
	formattedAPICredits: () => string;
	account: Account | null;
	isAuthenticated: boolean;
	isAuthenticating: boolean;
	lastTransactionHash: string | null;

	onAccountChange: (newAccount: Account | undefined) => Promise<void>;
	getLTAIBalance: () => Promise<number>;
	getAPICredits: () => Promise<number>;
	onDisconnect: () => void;
	authenticate: (account: Account) => Promise<boolean>;
	checkAuthStatus: (accountAddress: string) => Promise<boolean>;
	setLastTransactionHash: (hash: string | null) => void;
};

export const useAccountStore = create<AccountStoreState>((set, get) => ({
	alephStorage: null,
	ltaiBalance: 0,
	apiCredits: 0,
	formattedLTAIBalance: () => get().ltaiBalance.toFixed(0),
	formattedAPICredits: () => get().apiCredits.toFixed(0),
	account: null,
	jwtToken: null,
	isAuthenticated: false,
	isAuthenticating: false,
	lastTransactionHash: null,

	onAccountChange: async (newAccount: Account | undefined) => {
		const state = get();

		if (newAccount === undefined) {
			// Potential disconnection
			state.onDisconnect();
			return;
		}

		if (state.account !== null && state.account.address === newAccount.address) {
			// Account already connected with the same address
			return;
		}

		if (state.isAuthenticating) {
			// Prevent multiple simultaneous authentication attempts
			return;
		}

		// First check if we're already authenticated with this wallet
		set({ isAuthenticating: true });
		const isAlreadyAuthenticated = await state.checkAuthStatus(newAccount.address);

		let authSuccess = isAlreadyAuthenticated;
		if (!isAlreadyAuthenticated) {
			// Need to authenticate with a signature
			authSuccess = await state.authenticate(newAccount);
		}

		set({ isAuthenticating: false });

		if (!authSuccess) {
			set({ account: null, isAuthenticated: false });
			return;
		}

		set({ account: newAccount, isAuthenticated: true });

		// Get LTAI token balance from blockchain
		const ltaiBalance = await state.getLTAIBalance();
		set({ ltaiBalance: ltaiBalance });
	},
	getLTAIBalance: async (): Promise<number> => {
		const state = get();
    let balance: string = "0";
    const hexBalanceOfFunction = "0x70a08231";

		if (state.account === null) {
			return 0;
		}

    const address = state.account.address.startsWith("0x") ? state.account.address.slice(2) : state.account.address;
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
	authenticate: async (account: Account): Promise<boolean> => {
		const state = get();

		try {
			// Get the message to sign
			const messageResponse = await getAuthMessageAuthMessagePost({
				body: {
					address: account.address,
				},
			});

			if (!messageResponse.data) {
				toast.error("Authentication failed", {
					description: "Could not get message to sign",
				});
				return false;
			}

			// Sign the message
			const signature = await account.signMessage({ message: messageResponse.data.message });

			// Login with the signature
			const loginResponse = await loginWithWalletAuthLoginPost({
				body: {
					address: account.address,
					signature: signature,
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
				toast.error("Authentication failed", {
					description: "Invalid response from server",
				});
				return false;
			}
		} catch (error) {
			console.error("Authentication error:", error);
			toast.error("Authentication failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
			return false;
		}
	},
	onDisconnect: () => {
		set({
			account: null,
			alephStorage: null,
			isAuthenticated: false,
			ltaiBalance: 0,
			apiCredits: 0,
			lastTransactionHash: null,
		});
	},

	setLastTransactionHash: (hash: string | null) => {
		set({ lastTransactionHash: hash });
	},
}));
