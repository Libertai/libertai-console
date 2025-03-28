import { create } from "zustand";
import { toast } from "sonner";
import {
	ApiKey,
	ApiKeyCreate,
	createApiKeyApiKeysAddressPost,
	deleteApiKeyApiKeysIdKeyIdDelete,
	FullApiKey,
	getApiKeysApiKeysAddressGet,
	updateApiKeyApiKeysIdKeyIdPut,
} from "@/apis/inference";
import { useAccountStore } from "./account";

type ApiKeysState = {
	apiKeys: ApiKey[];
	isLoading: boolean;
	error: string | null;

	// Actions
	fetchApiKeys: () => Promise<ApiKey[]>;
	createApiKey: (keyData: ApiKeyCreate) => Promise<FullApiKey | null>;
	updateApiKey: (
		key: string,
		isActive: boolean,
		name?: string | null,
		monthlyLimit?: number | null,
	) => Promise<ApiKey | null>;
	deleteApiKey: (key: string) => Promise<boolean>;
};

export const useApiKeysStore = create<ApiKeysState>((set) => ({
	apiKeys: [],
	isLoading: false,
	error: null,

	fetchApiKeys: async () => {
		const account = useAccountStore.getState().account;

		if (!account) {
			set({ error: "No account connected" });
			return [];
		}

		try {
			set({ isLoading: true, error: null });

			const response = await getApiKeysApiKeysAddressGet({
				path: {
					address: account.address,
				},
			});

			if (!response.data) {
				throw new Error("Failed to fetch API keys");
			}

			set({ apiKeys: response.data.keys, isLoading: false });
			return response.data.keys;
		} catch (error) {
			console.error("Error fetching API keys:", error);
			set({
				error: error instanceof Error ? error.message : "Failed to fetch API keys",
				isLoading: false,
			});
			toast.error("Failed to fetch API keys", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
			return [];
		}
	},

	createApiKey: async (keyData: ApiKeyCreate) => {
		const account = useAccountStore.getState().account;

		if (!account) {
			set({ error: "No account connected" });
			return null;
		}

		try {
			set({ isLoading: true, error: null });

			const response = await createApiKeyApiKeysAddressPost({
				path: {
					address: account.address,
				},
				body: keyData,
			});

			if (!response.data) {
				throw new Error("Failed to create API key");
			}

			// Update the local state with the new key
			set((state) => ({
				apiKeys: [...state.apiKeys, response.data!],
				isLoading: false,
			}));

			toast.success("API key created successfully");
			return response.data;
		} catch (error) {
			console.error("Error creating API key:", error);
			set({
				error: error instanceof Error ? error.message : "Failed to create API key",
				isLoading: false,
			});
			toast.error("Failed to create API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
			return null;
		}
	},

	updateApiKey: async (key_id: string, isActive: boolean, name?: string | null, monthlyLimit?: number | null) => {
		try {
			set({ isLoading: true, error: null });

			const response = await updateApiKeyApiKeysIdKeyIdPut({
				path: {
					key_id,
				},
				body: {
					is_active: isActive,
					name,
					monthly_limit: monthlyLimit,
				},
			});

			if (!response.data) {
				throw new Error("Failed to update API key");
			}

			// Update the local state with the updated key
			set((state) => ({
				apiKeys: state.apiKeys.map((apiKey) => (apiKey.id === key_id ? response.data! : apiKey)),
				isLoading: false,
			}));

			toast.success("API key updated successfully");
			return response.data;
		} catch (error) {
			console.error("Error updating API key:", error);
			set({
				error: error instanceof Error ? error.message : "Failed to update API key",
				isLoading: false,
			});
			toast.error("Failed to update API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
			return null;
		}
	},

	deleteApiKey: async (key_id: string) => {
		try {
			set({ isLoading: true, error: null });

			await deleteApiKeyApiKeysIdKeyIdDelete({
				path: {
					key_id,
				},
			});

			// Since the delete endpoint doesn't return the updated key, we'll just update the local state
			// by setting is_active to false for the key
			set((state) => ({
				apiKeys: state.apiKeys.filter((apiKey) => apiKey.id !== key_id),
				isLoading: false,
			}));

			toast.success("API key disabled successfully");
			return true;
		} catch (error) {
			console.error("Error disabling API key:", error);
			set({
				error: error instanceof Error ? error.message : "Failed to disable API key",
				isLoading: false,
			});
			toast.error("Failed to disable API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
			return false;
		}
	},
}));
