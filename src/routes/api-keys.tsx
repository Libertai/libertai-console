import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@libertai/ui/button";
import { Eye, EyeOff, Key, MoreHorizontal, Plus, Settings, Trash } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@libertai/ui/dropdown-menu";
import { ApiKey, ApiKeyCreate } from "@libertai/inference-sdk";
import { useApiKeys } from "@/hooks/data/use-api-keys";
import { useUsageStats } from "@/hooks/data/use-stats";
import { useAlephModels } from "@/hooks/data/use-models";
import { toast } from "sonner";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { Skeleton } from "@libertai/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libertai/ui/select";
import { Card, CardHeader } from "@libertai/ui/card";
import { PageHeader } from "@libertai/ui/page-header";
import { PageSkeleton } from "@libertai/ui/page-skeleton";
import { Badge } from "@libertai/ui/badge";
import { ErrorCard } from "@libertai/ui/error-card";
import {
	SortableTableHead,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@libertai/ui/table";
import { CopyButton } from "@libertai/ui/copy-button";
import { ConfirmDialog } from "@libertai/ui/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@libertai/ui/dialog";
import { Label } from "@libertai/ui/label";
import dayjs from "dayjs";
import { routeHead } from "@/lib/route-titles";

type CodeLang = "curl" | "python" | "typescript";

type SortColumn = "name" | "created" | "limit" | "usage" | "status";
type SortDirection = "asc" | "desc";

// Direction applied when a column is first selected. `status` desc puts active keys first.
const DEFAULT_SORT_DIRECTION: Record<SortColumn, SortDirection> = {
	name: "asc",
	created: "desc",
	limit: "desc",
	usage: "desc",
	status: "desc",
};

const DEFAULT_EXAMPLE_MODEL = "glm-5.2";

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
	head: () => routeHead("/api-keys"),
	component: ApiKeys,
});

function ApiKeys() {
	const [showNewKeyModal, setShowNewKeyModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [activeLang, setActiveLang] = useState<CodeLang>("curl");
	const [keyPendingDelete, setKeyPendingDelete] = useState<ApiKey | null>(null);

	// Fetch available text models from Aleph
	const {
		data: models,
		isLoading: isLoadingModels,
		isError: isErrorModels,
		refetch: refetchModels,
	} = useAlephModels("text");

	// Default to GLM-5.2 when available, else the first available model
	useEffect(() => {
		if (models && models.length > 0 && !selectedModel) {
			const preferred = models.find((model) => model.id === DEFAULT_EXAMPLE_MODEL);
			setSelectedModel((preferred ?? models[0]).id);
		}
	}, [models, selectedModel]);

	// Current key being edited
	const [currentKey, setCurrentKey] = useState<ApiKey | null>(null);

	// Use auth hook to require authentication
	const { isAuthenticated, isPending } = useRequireAuth();

	// Use API keys query hook
	const { apiKeys, isLoading, isError, refetch, createApiKey, updateApiKey, deleteApiKey } = useApiKeys();

	// Rolling 30-day usage stats
	const endDate = dayjs().format("YYYY-MM-DD");
	const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
	const { apiKeyUsage, isLoading: isLoadingUsage, isError: isUsageError } = useUsageStats(startDate, endDate);
	const usageByName = useMemo(() => new Map(apiKeyUsage.map((u) => [u.name, u.cost])), [apiKeyUsage]);

	// Table sorting — defaults to status with active keys first.
	const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
		column: "status",
		direction: "desc",
	});

	const handleSort = (column: SortColumn) => {
		setSort((prev) =>
			prev.column === column
				? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
				: { column, direction: DEFAULT_SORT_DIRECTION[column] },
		);
	};

	const sortedApiKeys = useMemo(() => {
		const factor = sort.direction === "asc" ? 1 : -1;
		const compare: Record<SortColumn, (a: ApiKey, b: ApiKey) => number> = {
			name: (a, b) => a.name.localeCompare(b.name),
			created: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			limit: (a, b) => (a.monthly_limit ?? 0) - (b.monthly_limit ?? 0),
			usage: (a, b) => (usageByName.get(a.name) ?? 0) - (usageByName.get(b.name) ?? 0),
			status: (a, b) => Number(a.is_active) - Number(b.is_active),
		};
		return [...apiKeys].sort((a, b) => {
			const primary = compare[sort.column](a, b) * factor;
			return primary !== 0 ? primary : a.name.localeCompare(b.name);
		});
	}, [apiKeys, sort, usageByName]);

	if (isPending) {
		return <PageSkeleton />;
	}

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

	const handleDoneWithKey = () => {
		handleNewKeyModalOpenChange(false);
	};

	// Closing the modal (ESC/overlay/Done) after a key was generated must also clear the one-time secret.
	const handleNewKeyModalOpenChange = (open: boolean) => {
		setShowNewKeyModal(open);
		if (!open) {
			setNewGeneratedKey(null);
			setShowKey(false);
		}
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
				<PageHeader
					title="API keys"
					description="Manage your API keys for LLM inference"
					action={
						<Button onClick={() => setShowNewKeyModal(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Create API key
						</Button>
					}
				/>

				{isError ? (
					<ErrorCard message="Couldn't load your API keys." onRetry={refetch} />
				) : (
					<Card className="p-0 overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow>
									<SortableTableHead
										label="Name"
										active={sort.column === "name"}
										direction={sort.direction}
										onSort={() => handleSort("name")}
									/>
									<TableHead>Prefix</TableHead>
									<SortableTableHead
										label="Created"
										active={sort.column === "created"}
										direction={sort.direction}
										onSort={() => handleSort("created")}
									/>
									<SortableTableHead
										label="Limit"
										active={sort.column === "limit"}
										direction={sort.direction}
										onSort={() => handleSort("limit")}
									/>
									<SortableTableHead
										label="Usage (30d)"
										active={sort.column === "usage"}
										direction={sort.direction}
										onSort={() => handleSort("usage")}
									/>
									<SortableTableHead
										label="Status"
										active={sort.column === "status"}
										direction={sort.direction}
										onSort={() => handleSort("status")}
									/>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{apiKeys.length === 0 && !isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
											No API keys found. Create one to get started.
										</TableCell>
									</TableRow>
								) : isLoading ? (
									<>
										<TableRow>
											<TableCell colSpan={7} className="py-2">
												<Skeleton className="h-10 w-full my-1" />
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell colSpan={7} className="py-2">
												<Skeleton className="h-10 w-full my-1" />
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell colSpan={7} className="py-2">
												<Skeleton className="h-10 w-full my-1" />
											</TableCell>
										</TableRow>
									</>
								) : (
									sortedApiKeys.map((key) => (
										<TableRow key={key.id}>
											<TableCell className="font-medium">{key.name}</TableCell>
											<TableCell className="font-mono">{key.key}</TableCell>
											<TableCell className="text-muted-foreground">
												{dayjs(key.created_at).format("YYYY-MM-DD")}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{key.monthly_limit ? `$${key.monthly_limit}` : "None"}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{isLoadingUsage ? (
													<Skeleton className="h-4 w-12" />
												) : isUsageError ? (
													<span title="Couldn't load usage">—</span>
												) : (
													`$${(usageByName.get(key.name) ?? 0).toFixed(2)}`
												)}
											</TableCell>
											<TableCell>
												<Badge variant={key.is_active ? "success" : "destructive"}>
													{key.is_active ? "Active" : "Disabled"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Key actions">
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
															onClick={() => setKeyPendingDelete(key)}
															className="cursor-pointer text-destructive"
														>
															<Trash className="h-4 w-4 mr-2" />
															<span>Delete</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Card>
				)}

				<Card>
					<CardHeader title="API usage instructions" icon={<Key className="h-5 w-5 text-primary" />} />
					<div className="space-y-4 text-card-foreground">
						<p>To use LibertAI's LLM inference API, make requests using your API key:</p>

						<div className="space-y-2">
							<Label htmlFor="model-select">Model</Label>
							{isErrorModels ? (
								<div className="flex items-center gap-3">
									<p className="text-sm text-muted-foreground">Couldn't load models.</p>
									<Button variant="outline" size="sm" onClick={() => refetchModels()}>
										Retry
									</Button>
								</div>
							) : isLoadingModels ? (
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
									<div className="absolute top-2 right-2">
										<CopyButton value={buildCodeSnippet(activeLang, selectedModel)} label="Copy code example" />
									</div>
								</>
							) : isErrorModels ? (
								<p className="text-sm text-muted-foreground">Example unavailable until models load.</p>
							) : (
								<Skeleton className="h-32 w-full" />
							)}
						</div>

						<p className="text-sm">
							For more detailed instructions and example code in various programming languages, see our{" "}
							<a
								href="https://docs.libertai.io/apis/text"
								className="text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								API documentation
							</a>
							.
						</p>
					</div>
				</Card>

				<Card>
					<CardHeader title="Use with your tools" icon={<Settings className="h-5 w-5 text-primary" />} />
					<p className="text-sm text-muted-foreground mb-4">
						Drop LibertAI into popular coding agents and IDEs. Snippets update with the selected model above.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{TOOL_INTEGRATIONS.map((tool) => {
							const snippet = selectedModel ? tool.snippet(selectedModel) : null;
							return (
								<div
									key={tool.name}
									className="bg-secondary/50 p-4 rounded-md border border-border/50 flex flex-col gap-3"
								>
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
												<div className="absolute top-2 right-2">
													<CopyButton value={snippet} label={`Copy ${tool.name} snippet`} />
												</div>
											</>
										) : isErrorModels ? (
											<p className="text-sm text-muted-foreground">Snippet unavailable until models load.</p>
										) : (
											<Skeleton className="h-24 w-full" />
										)}
									</div>
								</div>
							);
						})}
					</div>
				</Card>
			</div>

			{/* Create New API Key dialog */}
			<Dialog open={showNewKeyModal} onOpenChange={handleNewKeyModalOpenChange}>
				<DialogContent className="sm:max-w-md">
					{!newGeneratedKey ? (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-3">
									<Key className="h-5 w-5 text-primary" />
									Create API key
								</DialogTitle>
							</DialogHeader>

							<ApiKeyForm
								mode="create"
								onSubmit={handleCreateKey}
								onCancel={() => setShowNewKeyModal(false)}
								isLoading={isLoading}
							/>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-3">
									<Key className="h-5 w-5 text-primary" />
									API key created
								</DialogTitle>
							</DialogHeader>

							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									Your new API key has been created. Make sure to copy it now as you won't be able to see it again.
								</p>

								<div className="flex items-center p-3 bg-secondary border border-border rounded-md">
									<pre className="text-sm font-mono overflow-x-auto flex-1">
										{showKey ? newGeneratedKey : "••••••••••••••••••••••••••••••••••••••••"}
									</pre>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowKey(!showKey)}
										className="ml-2"
										aria-label="Show key"
									>
										{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</Button>
									<CopyButton
										value={newGeneratedKey}
										label="Copy API key"
										onCopied={() => toast.success("API key copied to clipboard")}
									/>
								</div>
							</div>

							<DialogFooter>
								<Button onClick={handleDoneWithKey}>Done</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Edit API Key dialog */}
			<Dialog open={showEditModal} onOpenChange={setShowEditModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							<Settings className="h-5 w-5 text-primary" />
							Edit API key
						</DialogTitle>
					</DialogHeader>

					{currentKey && (
						<ApiKeyForm
							mode="edit"
							onSubmit={handleUpdateKey}
							onCancel={() => setShowEditModal(false)}
							initialData={currentKey}
							isLoading={isLoading}
						/>
					)}
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={!!keyPendingDelete}
				onOpenChange={(open) => !open && setKeyPendingDelete(null)}
				title="Delete API key"
				description={`"${keyPendingDelete?.name}" will stop working immediately. This can't be undone.`}
				confirmLabel="Delete key"
				destructive
				onConfirm={() => keyPendingDelete && handleDeleteKey(keyPendingDelete.id)}
			/>
		</div>
	);
}
