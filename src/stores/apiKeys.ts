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
	ValidationError,
} from "@/apis/inference";
import { useAccountStore } from "./account";

// Helper function to extract FastAPI error details
const extractFastAPIError = (error?: ValidationError[] | string | undefined): string => {
	// Check for simple error message in detail field
	if (error && typeof error === "string") {
		return error;
	}

	// FastAPI validation errors are in detail array
	if (Array.isArray(error)) {
		const details: ValidationError[] = error;
		// Get the first error message or join multiple messages
		if (details.length > 0) {
			return details.map((d) => d.msg).join(", ");
		}
	}
	return "An unknown error occurred";
};

type ApiKeysState = {
	apiKeys: ApiKey[];
	isLoading: boolean;

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

	fetchApiKeys: async () => {
		const account = useAccountStore.getState().account;

		if (!account) {
			return [];
		}

		try {
			set({ isLoading: true });

			const response = await getApiKeysApiKeysAddressGet({
				path: {
					address: account.address,
				},
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.error.detail));
			}

			set({ apiKeys: response.data.keys, isLoading: false });
			return response.data.keys;
		} catch (error) {
			console.error("Error fetching API keys:", error);
			set({ isLoading: false });
			toast.error("Failed to fetch API keys", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
			return [];
		}
	},

	createApiKey: async (keyData: ApiKeyCreate) => {
		const account = useAccountStore.getState().account;

		if (!account) {
			return null;
		}

		try {
			set({ isLoading: true });

			const response = await createApiKeyApiKeysAddressPost({
				path: {
					address: account.address,
				},
				body: keyData,
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.error.detail));
			}

			// Update the local state with the new key
			set((state) => ({
				apiKeys: [...state.apiKeys, response.data],
				isLoading: false,
			}));

			return response.data;
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	updateApiKey: async (key_id: string, isActive: boolean, name?: string | null, monthlyLimit?: number | null) => {
		set({ isLoading: true });

		try {
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

			if (response.error) {
				throw new Error(extractFastAPIError(response.error.detail));
			}

			// Update the local state with the updated key
			set((state) => ({
				apiKeys: state.apiKeys.map((apiKey) => (apiKey.id === key_id ? response.data! : apiKey)),
				isLoading: false,
			}));

			return response.data;
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	deleteApiKey: async (key_id: string) => {
		try {
			set({ isLoading: true });

			const response = await deleteApiKeyApiKeysIdKeyIdDelete({
				path: {
					key_id,
				},
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.error.detail));
			}

			// Since the delete endpoint doesn't return the updated key, we'll just update the local state
			// by setting is_active to false for the key
			set((state) => ({
				apiKeys: state.apiKeys.filter((apiKey) => apiKey.id !== key_id),
				isLoading: false,
			}));

			return true;
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},
}));
