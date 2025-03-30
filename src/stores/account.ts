import { create } from "zustand";
import { Account } from "thirdweb/wallets";
import env from "@/config/env.ts";
import { getBalance } from "thirdweb/extensions/erc20";
import { thirdwebClient } from "@/config/thirdweb.ts";
import { base } from "thirdweb/chains";
import { getAuthMessageAuthMessagePost, loginWithWalletAuthLoginPost } from "@/apis/inference/sdk.gen";
import { toast } from "sonner";

const LTAI_BASE_ADDRESS = env.LTAI_BASE_ADDRESS as `0x${string}`;

// Determine if we're in development (localhost) or production
const isDevelopment = window.location.hostname === "localhost";

type AccountStoreState = {
	alephStorage: null;
	ltaiBalance: number;
	apiCredits: number;
	formattedLTAIBalance: () => string;
	formattedAPICredits: () => string;
	account: Account | null;
	jwtToken: string | null;
	isAuthenticating: boolean;
	lastTransactionHash: string | null;

	onAccountChange: (newAccount: Account | undefined) => Promise<void>;
	signMessage: (message: string) => Promise<string>;
	getLTAIBalance: () => Promise<number>;
	getAPICredits: () => Promise<number>;
	onDisconnect: () => void;
	authenticate: (address: string) => Promise<boolean>;
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

		// Authenticate with the API
		set({ isAuthenticating: true });
		const authSuccess = await state.authenticate(newAccount.address);
		set({ isAuthenticating: false });

		if (!authSuccess) {
			set({ account: null });
			return;
		}

		set({ account: newAccount });

		// Get LTAI token balance from blockchain
		const ltaiBalance = await state.getLTAIBalance();
		set({ ltaiBalance: ltaiBalance });
	},
	signMessage: (message: string): Promise<string> => {
		const state = get();

		if (state.account === null) {
			throw Error("No account");
		}

		return state.account.signMessage({ message });
	},
	getLTAIBalance: async (): Promise<number> => {
		const state = get();

		if (state.account === null) {
			return 0;
		}

		const balance = await getBalance({
			contract: { address: LTAI_BASE_ADDRESS, client: thirdwebClient, chain: base },
			address: state.account.address,
		});

		return Number(balance.displayValue);
	},
	getAPICredits: async (): Promise<number> => {
		// This would typically come from the API after authentication
		// For now we'll return a placeholder value until we implement the proper endpoint
		return 0;
	},
	authenticate: async (address: string): Promise<boolean> => {
		const state = get();

		try {
			// Get the message to sign
			const messageResponse = await getAuthMessageAuthMessagePost({
				body: {
					address: address,
				},
			});

			if (!messageResponse.data) {
				toast.error("Authentication failed", {
					description: "Could not get message to sign",
				});
				return false;
			}

			// Sign the message
			let signature;
			if (isDevelopment) {
				const storedSignature = localStorage.getItem(`libertai_dev_signature_${address}`);
				if (storedSignature == null) {
					signature = await state.signMessage(messageResponse.data.message);
					localStorage.setItem(`libertai_dev_signature_${address}`, signature);
				} else {
					signature = storedSignature;
				}
			} else {
				signature = await state.signMessage(messageResponse.data.message);
			}

			// Login with the signature
			const loginResponse = await loginWithWalletAuthLoginPost({
				body: {
					address: address,
					signature: signature,
				},
			});

			if (loginResponse.data?.access_token) {
				// Store the JWT token
				set({ jwtToken: loginResponse.data.access_token });

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
			jwtToken: null,
			ltaiBalance: 0,
			apiCredits: 0,
			lastTransactionHash: null,
		});
	},

	setLastTransactionHash: (hash: string | null) => {
		set({ lastTransactionHash: hash });
	},
}));

// 		async initAlephStorage() {
// 			const settingsStore = useSettingsStore();
//
// 			if (this.account === null) {
// 				return;
// 			}
//
// 			const hash = settingsStore.signatureHash[this.account.address] ?? (await this.signMessage(LIBERTAI_MESSAGE));
// 			if (settingsStore.isSignatureHashStored) {
// 				settingsStore.signatureHash[this.account.address] = hash;
// 			}
//
// 			const alephStorage = await AlephPersistentStorage.initialize(hash, this.account.chain);
// 			if (!alephStorage) {
// 				return;
// 			}
//
// 			this.alephStorage = alephStorage;
// 			const settingsOnAleph = await this.alephStorage.fetchSettings();
// 			const saveOnAleph = !settingsOnAleph;
// 			await settingsStore.update(settingsOnAleph ?? {}, saveOnAleph);
// 		},
