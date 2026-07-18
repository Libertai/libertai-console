import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	ApiKeyCreate,
	createApiKeyApiKeysPost,
	deleteApiKeyApiKeysKeyIdDelete,
	getApiKeysApiKeysGet,
	updateApiKeyApiKeysKeyIdPut,
} from "@libertai/inference-sdk";
import { useAccountStore } from "@libertai/auth";

// Maps an HTTP status to user-facing copy. Never surfaces raw backend `detail` text —
// FastAPI validation/DB error messages aren't meant for end users.
const extractFastAPIError = (status?: number): string => {
	if (status === 400 || status === 409) {
		return "A key with this name already exists.";
	}
	if (status === 422) {
		return "That input isn't valid.";
	}
	return "Something went wrong. Try again.";
};

export function useApiKeys() {
	const queryClient = useQueryClient();
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);

	// Query for fetching API keys
	const query = useQuery({
		queryKey: ["apiKeys"],
		queryFn: async () => {
			const response = await getApiKeysApiKeysGet();

			if (response.error) {
				throw new Error(extractFastAPIError(response.status));
			}

			return response.data;
		},
		enabled: isAuthenticated, // Run for any authenticated user (wallet or email/OAuth)
	});

	// Mutation for creating a new API key
	const createMutation = useMutation({
		mutationFn: async (keyData: ApiKeyCreate) => {
			const response = await createApiKeyApiKeysPost({
				body: keyData,
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.status));
			}

			return response.data;
		},
		onSuccess: async () => {
			toast.success("API key created successfully");
			await queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
		},
		onError: (error) => {
			toast.error("Failed to create API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});

	// Mutation for updating an API key
	const updateMutation = useMutation({
		mutationFn: async ({
			keyId,
			isActive,
			name,
			monthlyLimit,
		}: {
			keyId: string;
			isActive: boolean;
			name?: string | null;
			monthlyLimit?: number | null;
		}) => {
			const response = await updateApiKeyApiKeysKeyIdPut({
				path: {
					key_id: keyId,
				},
				body: {
					is_active: isActive,
					name,
					monthly_limit: monthlyLimit,
				},
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.status));
			}

			return response.data;
		},
		onSuccess: async () => {
			toast.success("API key updated successfully");
			await queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
		},
		onError: (error) => {
			toast.error("Failed to update API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});

	// Mutation for deleting an API key
	const deleteMutation = useMutation({
		mutationFn: async (keyId: string) => {
			const response = await deleteApiKeyApiKeysKeyIdDelete({
				path: {
					key_id: keyId,
				},
			});

			if (response.error) {
				throw new Error(extractFastAPIError(response.status));
			}

			return true;
		},
		onSuccess: async () => {
			toast.success("API key deleted successfully");
			await queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
		},
		onError: (error) => {
			toast.error("Failed to delete API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});

	return {
		apiKeys: query.data?.keys || [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		createApiKey: createMutation.mutateAsync,
		updateApiKey: updateMutation.mutateAsync,
		deleteApiKey: deleteMutation.mutateAsync,
		createApiKeyStatus: createMutation.status,
		updateApiKeyStatus: updateMutation.status,
		deleteApiKeyStatus: deleteMutation.status,
	};
}
