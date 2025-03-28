import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Key, MoreHorizontal, Plus, Settings, Trash } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiKeyCreate } from "@/apis/inference";
import { useApiKeysStore } from "@/stores/apiKeys";
import { toast } from "sonner";

export const Route = createFileRoute("/api-keys")({
	component: ApiKeys,
});

function ApiKeys() {
	const [showNewKeyModal, setShowNewKeyModal] = useState(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Use API keys store
	const { apiKeys, isLoading, fetchApiKeys, createApiKey, deleteApiKey } = useApiKeysStore();

	// Fetch API keys when component mounts
	useEffect(() => {
		if (isAuthenticated) {
			fetchApiKeys();
		}
	}, [isAuthenticated, fetchApiKeys]);

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	const handleCreateKey = async () => {
		if (!newKeyName.trim()) return;

		try {
			// Create API key with backend
			const keyData: ApiKeyCreate = {
				name: newKeyName,
				monthly_limit: null,
			};

			const newKey = await createApiKey(keyData);

			if (newKey) {
				// Show the generated key to the user (only visible once)
				setNewGeneratedKey(newKey.full_key);
			}
		} catch (error) {
			console.error("Error creating API key:", error);
			toast.error("Failed to create API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	const handleCopyKey = () => {
		if (newGeneratedKey) {
			navigator.clipboard.writeText(newGeneratedKey);
			toast.success("API key copied to clipboard");
		}
	};

	const handleDoneWithKey = () => {
		setNewGeneratedKey(null);
		setNewKeyName("");
		setShowNewKeyModal(false);
	};

	const handleDeleteKey = async (keyId: string) => {
		try {
			await deleteApiKey(keyId);
		} catch (error) {
			console.error("Error deleting API key:", error);
			toast.error("Failed to delete API key", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">API Keys</h1>
						<p className="text-muted-foreground mt-1">Manage your API keys for LLM inference</p>
					</div>
					<Button onClick={() => setShowNewKeyModal(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Create API Key
					</Button>
				</div>

				{/* API Keys List */}
				<div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border">
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Name</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Prefix</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Created</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Limit</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
									<th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody>
								{apiKeys.length === 0 && !isLoading ? (
									<tr className="border-b border-border/50">
										<td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
											No API keys found. Create one to get started.
										</td>
									</tr>
								) : isLoading ? (
									<tr className="border-b border-border/50">
										<td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
											Loading API keys...
										</td>
									</tr>
								) : (
									apiKeys.map((key) => (
										<tr key={key.id} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-6 py-4 text-sm font-medium">{key.name}</td>
											<td className="px-6 py-4 text-sm font-mono">{key.key}</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">{key.created_at}</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{key.monthly_limit ? `${key.monthly_limit} $` : "None"}
											</td>
											<td className="px-6 py-4 text-sm">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium
                          ${
														key.is_active
															? "dark:bg-emerald-900/30 bg-emerald-900/5 text-emerald-400"
															: "bg-red-900/30 text-red-400"
													}
                        `}
												>
													{key.is_active ? "Active" : "Disabled"}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-44">
														<DropdownMenuItem onClick={() => {}} className="cursor-pointer" disabled={!key.is_active}>
															<Settings className="h-4 w-4 mr-2" />
															<span>Edit</span>
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleDeleteKey(key.id)}
															className="cursor-pointer text-destructive"
															disabled={!key.is_active}
														>
															<Trash className="h-4 w-4 mr-2" />
															<span>Delete</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-4">
						<Key className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">API Usage Instructions</h2>
					</div>
					<div className="space-y-4 text-card-foreground">
						<p>To use LibertAI's LLM inference API, make requests using your API key:</p>

						<div className="bg-secondary/50 p-4 rounded-md border border-border/50">
							<pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap">{`curl -X POST https://api.libertai.io/v1/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "libertai-7b",
    "prompt": "Once upon a time",
    "max_tokens": 150
  }'`}</pre>
						</div>

						<p className="text-sm">
							For more detailed instructions and example code in various programming languages, see our{" "}
							<a href="https://docs.libertai.io" className="text-primary hover:underline" target="_blank">
								API Documentation
							</a>
							.
						</p>
					</div>
				</div>
			</div>

			{/* Create New API Key Modal */}
			{showNewKeyModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
						{!newGeneratedKey ? (
							<>
								<div className="flex items-center gap-3 mb-6">
									<Key className="h-5 w-5 text-primary" />
									<h2 className="text-xl font-semibold">Create New API Key</h2>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<label htmlFor="key-name" className="block text-sm font-medium text-muted-foreground">
											Key Name
										</label>
										<input
											id="key-name"
											type="text"
											value={newKeyName}
											onChange={(e) => setNewKeyName(e.target.value)}
											placeholder="e.g. Production API Key"
											className="w-full p-2 bg-secondary border border-border rounded-md"
										/>
										<p className="text-xs text-muted-foreground">
											Give your API key a memorable name to easily identify its purpose
										</p>
									</div>
								</div>

								<div className="flex justify-end gap-3 mt-6">
									<Button variant="outline" onClick={() => setShowNewKeyModal(false)} disabled={isLoading}>
										Cancel
									</Button>
									<Button onClick={handleCreateKey} disabled={!newKeyName.trim() || isLoading}>
										{isLoading ? "Creating..." : "Create Key"}
									</Button>
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-3 mb-6">
									<Key className="h-5 w-5 text-primary" />
									<h2 className="text-xl font-semibold">API Key Created</h2>
								</div>

								<div className="space-y-4">
									<p className="text-sm text-muted-foreground">
										Your new API key has been created. Make sure to copy it now as you won't be able to see it again.
									</p>

									<div className="relative">
										<div className="flex items-center p-3 bg-secondary border border-border rounded-md">
											<pre className="text-sm font-mono overflow-x-auto flex-1">
												{showKey ? newGeneratedKey : "••••••••••••••••••••••••••••••••••••••••"}
											</pre>
											<Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="ml-2">
												{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</Button>
											<Button variant="ghost" size="icon" onClick={handleCopyKey} className="ml-2">
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>

								<div className="flex justify-end mt-6">
									<Button onClick={handleDoneWithKey}>Done</Button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
