import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { AlarmClock, Copy, Eye, EyeOff, Key, MoreHorizontal, Plus, Settings, Trash, Zap } from "lucide-react";
import AccountButton from "@/components/AccountButton";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/api-keys")({
	component: ApiKeys,
});

interface ApiKey {
	id: string;
	name: string;
	prefix: string;
	created: string;
	lastUsed: string | null;
	status: "active" | "expired" | "revoked";
}

function ApiKeys() {
	const account = useAccountStore((state) => state.account);
	const navigate = useNavigate();
	const [showNewKeyModal, setShowNewKeyModal] = useState(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);

	// Mock API Keys data - in a real app, these would be fetched from an API
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([
		{
			id: "key_1",
			name: "Production API Key",
			prefix: "lt_prod_K1",
			created: "2025-01-15",
			lastUsed: "2025-03-24",
			status: "active",
		},
		{
			id: "key_2",
			name: "Development API Key",
			prefix: "lt_dev_K2",
			created: "2025-02-20",
			lastUsed: "2025-03-15",
			status: "active",
		},
	]);

	// Redirect to home if not logged in
	if (!account) {
		navigate({ to: "/" });
		return null;
	}

	const handleCreateKey = () => {
		if (!newKeyName.trim()) return;

		// Generate a mock API key
		const generatedKey = `lt_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(36).substring(2, 15)}`;

		setNewGeneratedKey(generatedKey);

		// In a real app, this would call an API to create the key
		const newKey: ApiKey = {
			id: `key_${apiKeys.length + 1}`,
			name: newKeyName,
			prefix: `lt_${newKeyName.toLowerCase().substring(0, 4)}_${apiKeys.length + 1}`,
			created: new Date().toISOString().split("T")[0],
			lastUsed: null,
			status: "active",
		};

		setApiKeys([...apiKeys, newKey]);
	};

	const handleCopyKey = () => {
		if (newGeneratedKey) {
			navigator.clipboard.writeText(newGeneratedKey);
		}
	};

	const handleDoneWithKey = () => {
		setNewGeneratedKey(null);
		setNewKeyName("");
		setShowNewKeyModal(false);
	};

	const handleRevokeKey = (keyId: string) => {
		setApiKeys(apiKeys.map((key) => (key.id === keyId ? { ...key, status: "revoked" as const } : key)));
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
			<header className="border-b border-slate-700">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Zap className="h-6 w-6 text-blue-400" />
							<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
								LibertAI Dev
							</h1>
						</div>
						<AccountButton />
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="flex flex-col space-y-8">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold">API Keys</h1>
							<p className="text-slate-400 mt-1">Manage your API keys for LLM inference</p>
						</div>
						<Button
							onClick={() => setShowNewKeyModal(true)}
							className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create API Key
						</Button>
					</div>

					{/* API Keys List */}
					<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-700">
										<th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Name</th>
										<th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Prefix</th>
										<th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Created</th>
										<th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Last Used</th>
										<th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
										<th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Actions</th>
									</tr>
								</thead>
								<tbody>
									{apiKeys.map((key) => (
										<tr key={key.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
											<td className="px-6 py-4 text-sm font-medium">{key.name}</td>
											<td className="px-6 py-4 text-sm font-mono">{key.prefix}•••</td>
											<td className="px-6 py-4 text-sm text-slate-300">{key.created}</td>
											<td className="px-6 py-4 text-sm text-slate-300">{key.lastUsed || "Never"}</td>
											<td className="px-6 py-4 text-sm">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium
                          ${
														key.status === "active"
															? "bg-emerald-900/30 text-emerald-400"
															: key.status === "expired"
																? "bg-amber-900/30 text-amber-400"
																: "bg-red-900/30 text-red-400"
													}
                        `}
												>
													{key.status.charAt(0).toUpperCase() + key.status.slice(1)}
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
														<DropdownMenuItem
															onClick={() => {}}
															className="cursor-pointer"
															disabled={key.status !== "active"}
														>
															<Settings className="h-4 w-4 mr-2" />
															<span>Edit</span>
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {}}
															className="cursor-pointer"
															disabled={key.status !== "active"}
														>
															<AlarmClock className="h-4 w-4 mr-2" />
															<span>Set Expiry</span>
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleRevokeKey(key.id)}
															className="cursor-pointer text-red-400"
															disabled={key.status !== "active"}
														>
															<Trash className="h-4 w-4 mr-2" />
															<span>Revoke</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
						<div className="flex items-center gap-3 mb-4">
							<Key className="h-5 w-5 text-blue-400" />
							<h2 className="text-xl font-semibold">API Usage Instructions</h2>
						</div>
						<div className="space-y-4 text-slate-300">
							<p>To use LibertAI's LLM inference API, make requests using your API key:</p>

							<div className="bg-slate-950/50 p-4 rounded-md border border-slate-700/50">
								<pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap">
									{`curl -X POST https://api.libertai.io/v1/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "libertai-7b",
    "prompt": "Once upon a time",
    "max_tokens": 150
  }'`}
								</pre>
							</div>

							<p className="text-sm">
								For more detailed instructions and example code in various programming languages, see our{" "}
								<a href="#" className="text-blue-400 hover:underline">
									API Documentation
								</a>
								.
							</p>
						</div>
					</div>
				</div>
			</main>

			{/* Create New API Key Modal */}
			{showNewKeyModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full">
						{!newGeneratedKey ? (
							<>
								<div className="flex items-center gap-3 mb-6">
									<Key className="h-5 w-5 text-blue-400" />
									<h2 className="text-xl font-semibold">Create New API Key</h2>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<label htmlFor="key-name" className="block text-sm font-medium text-slate-300">
											Key Name
										</label>
										<input
											id="key-name"
											type="text"
											value={newKeyName}
											onChange={(e) => setNewKeyName(e.target.value)}
											placeholder="e.g. Production API Key"
											className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-white"
										/>
										<p className="text-xs text-slate-400">
											Give your API key a memorable name to easily identify its purpose
										</p>
									</div>
								</div>

								<div className="flex justify-end gap-3 mt-6">
									<Button variant="outline" onClick={() => setShowNewKeyModal(false)} className="border-slate-600">
										Cancel
									</Button>
									<Button
										onClick={handleCreateKey}
										disabled={!newKeyName.trim()}
										className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
									>
										Create Key
									</Button>
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-3 mb-6">
									<Key className="h-5 w-5 text-blue-400" />
									<h2 className="text-xl font-semibold">API Key Created</h2>
								</div>

								<div className="space-y-4">
									<p className="text-sm text-slate-300">
										Your new API key has been created. Make sure to copy it now as you won't be able to see it again.
									</p>

									<div className="relative">
										<div className="flex items-center p-3 bg-slate-900 border border-slate-600 rounded-md">
											<pre className="text-sm font-mono text-slate-300 overflow-x-auto flex-1">
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
									<Button
										onClick={handleDoneWithKey}
										className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
									>
										Done
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
