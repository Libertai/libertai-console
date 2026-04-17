import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Key, MoreHorizontal, Plus, Settings, Trash, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiKey, ApiKeyCreate } from "@/apis/inference";
import { useApiKeys } from "@/hooks/data/use-api-keys";
import { useUsageStats } from "@/hooks/data/use-stats";
import { useAlephModels } from "@/hooks/data/use-models";
import { toast } from "sonner";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dayjs from "dayjs";

type CodeLang = "curl" | "python" | "typescript";

const CODE_LANG_LABELS: Record<CodeLang, string> = {
	curl: "cURL",
	python: "Python",
	typescript: "TypeScript",
};

const buildCodeSnippet = (lang: CodeLang, model: string): string => {
	switch (lang) {
		case "curl":
			return `curl -X POST https://api.libertai.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "${model}",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`;
		case "python":
			return `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.libertai.io/v1",
)

response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response.choices[0].message.content)`;
		case "typescript":
			return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_API_KEY",
  baseURL: "https://api.libertai.io/v1",
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`;
	}
};

type ToolIntegration = {
	name: string;
	description: string;
	snippet: (model: string) => string;
	language: string;
};

const TOOL_INTEGRATIONS: ToolIntegration[] = [
	{
		name: "Claude Code",
		description: "Point the Anthropic-compatible endpoint at LibertAI via environment variables.",
		language: "bash",
		snippet: (model) => `export ANTHROPIC_BASE_URL="https://api.libertai.io"
export ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"
export ANTHROPIC_DEFAULT_OPUS_MODEL="${model}"
export ANTHROPIC_DEFAULT_SONNET_MODEL="${model}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="${model}"
export CLAUDE_CODE_ATTRIBUTION_HEADER=0
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

claude`,
	},
	{
		name: "Cursor",
		description:
			"In Settings → Models, enable “Override OpenAI Base URL”, paste the URL and your key, then add the model name below.",
		language: "text",
		snippet: (model) => `Base URL: https://api.libertai.io/v1
API Key:  YOUR_API_KEY
Model:    ${model}`,
	},
	{
		name: "OpenCode",
		description: "Add LibertAI as an OpenAI-compatible provider in ~/.config/opencode/opencode.json.",
		language: "json",
		snippet: (model) => `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "libertai": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LibertAI",
      "options": {
        "baseURL": "https://api.libertai.io/v1",
        "apiKey": "{env:LIBERTAI_API_KEY}"
      },
      "models": {
        "${model}": {}
      }
    }
  }
}`,
	},
];

export const Route = createFileRoute("/api-keys")({
	component: ApiKeys,
});

function ApiKeys() {
	const [showNewKeyModal, setShowNewKeyModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);
	const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [activeLang, setActiveLang] = useState<CodeLang>("curl");
	const [copiedTool, setCopiedTool] = useState<string | null>(null);

	// Fetch available text models from Aleph
	const { data: models, isLoading: isLoadingModels } = useAlephModels("text");

	// Default to the first available model
	useEffect(() => {
		if (models && models.length > 0 && !selectedModel) {
			setSelectedModel(models[0].id);
		}
	}, [models, selectedModel]);

	// Current key being edited
	const [currentKey, setCurrentKey] = useState<ApiKey | null>(null);

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Use API keys query hook
	const { apiKeys, isLoading, createApiKey, updateApiKey, deleteApiKey } = useApiKeys();

	// Rolling 30-day usage stats
	const endDate = dayjs().format("YYYY-MM-DD");
	const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
	const { apiKeyUsage, isLoading: isLoadingUsage } = useUsageStats(startDate, endDate);
	const usageByName = useMemo(() => new Map(apiKeyUsage.map((u) => [u.name, u.cost])), [apiKeyUsage]);

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	const handleCreateKey = async (formData: { name: string; monthlyLimit: number | null }) => {
		try {
			// Create API key with backend
			const keyData: ApiKeyCreate = {
				name: formData.name,
				monthly_limit: formData.monthlyLimit,
			};

			const newKey = await createApiKey(keyData);

			if (newKey) {
				// Show the generated key to the user (only visible once)
				setNewGeneratedKey(newKey.full_key);
			}
		} catch (error) {
			console.error("Error creating API key:", error);
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
		setShowNewKeyModal(false);
	};

	const handleDeleteKey = async (keyId: string) => {
		try {
			await deleteApiKey(keyId);
		} catch (error) {
			console.error("Error deleting API key:", error);
		}
	};

	const handleOpenEditModal = (key: ApiKey) => {
		setCurrentKey(key);
		setShowEditModal(true);
	};

	const handleUpdateKey = async (formData: { name: string; monthlyLimit: number | null; isActive?: boolean }) => {
		if (!currentKey) return;

		try {
			await updateApiKey({
				keyId: currentKey.id,
				isActive: formData.isActive ?? currentKey.is_active,
				name: formData.name,
				monthlyLimit: formData.monthlyLimit,
			});

			setShowEditModal(false);
			setCurrentKey(null);
		} catch (error) {
			console.error("Error updating API key:", error);
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
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">30d Usage</th>
									<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
									<th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody>
								{apiKeys.length === 0 && !isLoading ? (
									<tr className="border-b border-border/50">
										<td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
											No API keys found. Create one to get started.
										</td>
									</tr>
								) : isLoading ? (
									<>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
										<tr className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
									</>
								) : (
									apiKeys.map((key) => (
										<tr key={key.id} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-6 py-4 text-sm font-medium">{key.name}</td>
											<td className="px-6 py-4 text-sm font-mono">{key.key}</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{dayjs(key.created_at).format("YYYY-MM-DD")}
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{key.monthly_limit ? `$${key.monthly_limit}` : "None"}
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{isLoadingUsage ? (
													<Skeleton className="h-4 w-12" />
												) : (
													`$${(usageByName.get(key.name) ?? 0).toFixed(2)}`
												)}
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
														<DropdownMenuItem onClick={() => handleOpenEditModal(key)} className="cursor-pointer">
															<Settings className="h-4 w-4 mr-2" />
															<span>Edit</span>
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleDeleteKey(key.id)}
															className="cursor-pointer text-destructive"
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

						<div className="space-y-2">
							<label htmlFor="model-select" className="block text-sm font-medium text-muted-foreground">
								Model
							</label>
							{isLoadingModels ? (
								<Skeleton className="h-9 w-full max-w-xs" />
							) : (
								<Select value={selectedModel ?? ""} onValueChange={setSelectedModel}>
									<SelectTrigger id="model-select" className="w-full max-w-xs">
										<SelectValue placeholder="Select a model" />
									</SelectTrigger>
									<SelectContent>
										{models?.map((model) => (
											<SelectItem key={model.id} value={model.id}>
												{model.name} ({model.id})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className="flex flex-wrap gap-2">
							{(Object.keys(CODE_LANG_LABELS) as CodeLang[]).map((lang) => (
								<Button
									key={lang}
									variant={activeLang === lang ? "default" : "outline"}
									size="sm"
									onClick={() => setActiveLang(lang)}
								>
									{CODE_LANG_LABELS[lang]}
								</Button>
							))}
						</div>

						<div className="bg-secondary/50 p-4 rounded-md border border-border/50 relative">
							{selectedModel ? (
								<>
									<pre id="code-example" className="text-sm font-mono overflow-x-auto whitespace-pre-wrap">
										{buildCodeSnippet(activeLang, selectedModel)}
									</pre>
									<Button
										variant="outline"
										size="icon"
										className="absolute top-2 right-2"
										onClick={() => {
											navigator.clipboard.writeText(buildCodeSnippet(activeLang, selectedModel));
											setShowCopiedTooltip(true);
											setTimeout(() => setShowCopiedTooltip(false), 1000);
										}}
									>
										<Copy className="h-4 w-4" />
									</Button>
									{showCopiedTooltip && (
										<div className="absolute top-2 right-12 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
											Copied!
										</div>
									)}
								</>
							) : (
								<Skeleton className="h-32 w-full" />
							)}
						</div>

						<p className="text-sm">
							For more detailed instructions and example code in various programming languages, see our{" "}
							<a href="https://docs.libertai.io/apis/text" className="text-primary hover:underline" target="_blank">
								API Documentation
							</a>
							.
						</p>
					</div>
				</div>

				<div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-2">
						<Settings className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">Use with your tools</h2>
					</div>
					<p className="text-sm text-muted-foreground mb-4">
						Drop LibertAI into popular coding agents and IDEs. Snippets update with the selected model above.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{TOOL_INTEGRATIONS.map((tool) => {
							const snippet = selectedModel ? tool.snippet(selectedModel) : null;
							return (
								<div key={tool.name} className="bg-secondary/50 p-4 rounded-md border border-border/50 flex flex-col gap-3">
									<div>
										<h3 className="font-semibold">{tool.name}</h3>
										<p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
									</div>
									<div className="relative">
										{snippet ? (
											<>
												<pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-background/60 p-3 rounded-md border border-border/50 pr-10">
													{snippet}
												</pre>
												<Button
													variant="outline"
													size="icon"
													className="absolute top-2 right-2 h-7 w-7"
													onClick={() => {
														navigator.clipboard.writeText(snippet);
														setCopiedTool(tool.name);
														setTimeout(() => setCopiedTool((current) => (current === tool.name ? null : current)), 1000);
													}}
												>
													<Copy className="h-3.5 w-3.5" />
												</Button>
												{copiedTool === tool.name && (
													<div className="absolute top-2 right-11 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
														Copied!
													</div>
												)}
											</>
										) : (
											<Skeleton className="h-24 w-full" />
										)}
									</div>
								</div>
							);
						})}
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

								<ApiKeyForm
									mode="create"
									onSubmit={handleCreateKey}
									onCancel={() => setShowNewKeyModal(false)}
									isLoading={isLoading}
								/>
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

			{/* Edit API Key Modal */}
			{showEditModal && currentKey && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
						<div className="flex justify-between items-center mb-6">
							<div className="flex items-center gap-3">
								<Settings className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Edit API Key</h2>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<ApiKeyForm
							mode="edit"
							onSubmit={handleUpdateKey}
							onCancel={() => setShowEditModal(false)}
							initialData={currentKey}
							isLoading={isLoading}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
