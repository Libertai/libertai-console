import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteApiKeyApiKeysKeyIdDelete, getCliApiKeysApiKeysCliGet } from "@libertai/inference-sdk";
import { useAccountStore } from "@libertai/auth";

export function useCliDevices() {
	const queryClient = useQueryClient();
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);

	const query = useQuery({
		queryKey: ["cliDevices"],
		queryFn: async () => {
			const response = await getCliApiKeysApiKeysCliGet();

			if (response.error) {
				throw new Error("Couldn't load your connected devices.");
			}

			return response.data;
		},
		enabled: isAuthenticated,
		// The flow is: run `libertai login` in a terminal, tab back here. The global
		// 5-minute staleTime would leave the list wrong for the whole of that window.
		staleTime: 30_000,
		refetchOnWindowFocus: true,
	});

	const disconnectMutation = useMutation({
		mutationFn: async (keyId: string) => {
			const response = await deleteApiKeyApiKeysKeyIdDelete({ path: { key_id: keyId } });

			if (response.error) {
				throw new Error("Something went wrong. Try again.");
			}

			return true;
		},
		onSuccess: async () => {
			toast.success("Device disconnected");
			await queryClient.invalidateQueries({ queryKey: ["cliDevices"] });
		},
		onError: (error) => {
			toast.error("Failed to disconnect device", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});

	return {
		devices: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		disconnectDevice: disconnectMutation.mutateAsync,
	};
}
