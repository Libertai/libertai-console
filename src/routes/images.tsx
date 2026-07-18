import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Download, Globe, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useApiKeys } from "@/hooks/data/use-api-keys";
import { useAlephModels } from "@/hooks/data/use-models";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/images")({
	component: Images,
});

type EndpointType = "sdapi" | "openai";

// Human-readable status text for the image generation endpoint; thrown as ImageGenerationError so the catch block can trust it's already user-facing.
class ImageGenerationError extends Error {}

const messageForStatus = (status: number): string => {
	if (status === 401 || status === 403) return "That API key isn't authorized. Pick another key.";
	if (status === 429) return "Rate limit reached. Try again in a moment.";
	if (status >= 500) return "Image service is unavailable right now. Try again shortly.";
	return "Something went wrong generating the image. Please try again.";
};

const NO_IMAGE_MESSAGE = "The service didn't return an image. Try again.";

const DEFAULT_TEMPLATES = {
	sdapi: {
		model: "z-image-turbo",
		prompt: "A beautiful sunset over mountains",
		width: 512,
		height: 512,
		steps: 9,
		seed: -1,
		remove_background: false,
	},
	openai: {
		model: "z-image-turbo",
		prompt: "A beautiful sunset over mountains",
		size: "512x512",
		n: 1,
		remove_background: false,
	},
};

function Images() {
	const [endpoint, setEndpoint] = useState<EndpointType>("sdapi");
	const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [jsonBody, setJsonBody] = useState<string>(JSON.stringify(DEFAULT_TEMPLATES.sdapi, null, 2));
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [cost, setCost] = useState<number | null>(null);
	const [responseSeed, setResponseSeed] = useState<number | null>(null);

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Use API keys query hook
	const { apiKeys, isLoading: isLoadingKeys } = useApiKeys();

	// Fetch image models from Aleph
	const { data: models, isLoading: isLoadingModels } = useAlephModels("image");

	// Set default model when models load
	useEffect(() => {
		if (models && models.length > 0 && !selectedModel) {
			setSelectedModel(models[0].id);
		}
	}, [models, selectedModel]);

	// Set default API key when keys load
	useEffect(() => {
		if (apiKeys && apiKeys.length > 0 && !selectedKeyId) {
			setSelectedKeyId(apiKeys[0].id);
		}
	}, [apiKeys, selectedKeyId]);

	// Update JSON body when endpoint changes
	useEffect(() => {
		setJsonBody(JSON.stringify(DEFAULT_TEMPLATES[endpoint], null, 2));
	}, [endpoint]);

	// Update cost when model changes
	useEffect(() => {
		if (models && selectedModel) {
			const model = models.find((m) => m.id === selectedModel);
			if (model && model.pricing.image !== undefined) {
				setCost(model.pricing.image);
			} else {
				setCost(null);
			}
		}
	}, [models, selectedModel]);

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	const handleGenerate = async () => {
		if (!selectedKeyId) {
			toast.error("Please select an API key");
			return;
		}

		setIsGenerating(true);

		try {
			// Parse JSON body
			const body = JSON.parse(jsonBody);

			// Get API key value
			const apiKey = apiKeys.find((k) => k.id === selectedKeyId);
			if (!apiKey) {
				throw new Error("API key not found");
			}

			// Determine endpoint URL
			const url =
				endpoint === "sdapi"
					? "https://api.libertai.io/sdapi/v1/txt2img"
					: "https://api.libertai.io/v1/images/generations";

			// Make API call
			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey.full_key}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new ImageGenerationError(messageForStatus(response.status));
			}

			const data = await response.json();

			// Extract image based on endpoint type with validation
			let imageB64: string | undefined;
			if (endpoint === "sdapi") {
				if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
					throw new ImageGenerationError(NO_IMAGE_MESSAGE);
				}
				imageB64 = data.images[0];
				// Extract seed from response if available
				setResponseSeed(data.parameters?.seed !== undefined && data.parameters.seed >= 0 ? data.parameters.seed : null);
			} else {
				if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
					throw new ImageGenerationError(NO_IMAGE_MESSAGE);
				}
				imageB64 = data.data[0]?.b64_json;
				setResponseSeed(null);
			}

			if (!imageB64) {
				throw new ImageGenerationError(NO_IMAGE_MESSAGE);
			}

			setGeneratedImage(`data:image/png;base64,${imageB64}`);

			toast.success("Image generated successfully");
		} catch (error) {
			console.error("Error generating image:", error);
			if (error instanceof SyntaxError) {
				toast.error("Invalid JSON", {
					description: "Please check your JSON syntax",
				});
			} else if (error instanceof ImageGenerationError) {
				toast.error("Failed to generate image", {
					description: error.message,
				});
			} else {
				toast.error("Failed to generate image", {
					description: "Something went wrong generating the image. Please try again.",
				});
			}
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = () => {
		if (!generatedImage) return;

		const link = document.createElement("a");
		link.href = generatedImage;
		link.download = `generated-${Date.now()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("Image downloaded");
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div>
					<h1 className="text-3xl font-bold">Image generation</h1>
					<p className="text-muted-foreground mt-1">Test the image generation API live from the console</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Left Column - Configuration */}
					<div className="space-y-6">
						{/* Endpoint Selector */}
						<Card>
							<CardHeader title="API endpoint" icon={<Globe className="h-5 w-5 text-primary" />} />
							<div className="flex gap-1 rounded-lg border border-border bg-card p-1">
								<Button
									variant={endpoint === "sdapi" ? "default" : "ghost"}
									onClick={() => setEndpoint("sdapi")}
									className="flex-1"
								>
									Stable Diffusion (sdapi)
								</Button>
								<Button
									variant={endpoint === "openai" ? "default" : "ghost"}
									onClick={() => setEndpoint("openai")}
									className="flex-1"
								>
									OpenAI-compatible
								</Button>
							</div>
							<p className="text-xs text-muted-foreground mt-3">
								{endpoint === "sdapi"
									? "POST https://api.libertai.io/sdapi/v1/txt2img"
									: "POST https://api.libertai.io/v1/images/generations"}
							</p>
						</Card>

						{/* API Key Selector */}
						<Card>
							<Label htmlFor="api-key-select" className="mb-4">
								API key
							</Label>
							{isLoadingKeys ? (
								<Skeleton className="h-10 w-full" />
							) : apiKeys.length === 0 ? (
								<div className="bg-amber-500/10 text-amber-500 p-4 rounded-md">
									<p className="text-sm">
										No API keys found.{" "}
										<Link to="/api-keys" className="underline font-medium">
											Create one first
										</Link>
										.
									</p>
								</div>
							) : (
								<Select value={selectedKeyId || ""} onValueChange={setSelectedKeyId}>
									<SelectTrigger id="api-key-select">
										<SelectValue placeholder="Select an API key" />
									</SelectTrigger>
									<SelectContent>
										{apiKeys.map((key) => (
											<SelectItem key={key.id} value={key.id}>
												{key.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</Card>

						{/* Model Selector */}
						<Card>
							<Label htmlFor="model-select" className="mb-4">
								Model
							</Label>
							{isLoadingModels ? (
								<Skeleton className="h-10 w-full" />
							) : models && models.length > 0 ? (
								<>
									<Select value={selectedModel || ""} onValueChange={setSelectedModel}>
										<SelectTrigger id="model-select">
											<SelectValue placeholder="Select a model" />
										</SelectTrigger>
										<SelectContent>
											{models.map((model) => (
												<SelectItem key={model.id} value={model.id}>
													{model.name} ({model.id})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{selectedModel && models.find((m) => m.id === selectedModel) && (
										<div className="mt-3 p-3 bg-secondary/50 rounded-md">
											<p className="text-sm font-medium">
												Cost: {cost !== null ? `$${cost.toFixed(4)} per image` : "Unknown"}
											</p>
										</div>
									)}
								</>
							) : (
								<p className="text-sm text-muted-foreground">No image models available</p>
							)}
						</Card>

						{/* JSON Editor */}
						<Card>
							<Label htmlFor="json-body" className="mb-4">
								Request body (JSON)
							</Label>
							<Textarea
								id="json-body"
								value={jsonBody}
								onChange={(e) => setJsonBody(e.target.value)}
								className="font-mono text-sm"
								rows={14}
								placeholder="Enter JSON request body..."
							/>
							<p className="text-xs text-muted-foreground mt-2">
								Edit the JSON directly. See{" "}
								<a
									href="https://docs.libertai.io/apis/image"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									API docs
								</a>{" "}
								for parameter details.
							</p>
						</Card>

						{/* Generate Button */}
						<Button
							onClick={handleGenerate}
							disabled={isGenerating || !selectedKeyId || apiKeys.length === 0}
							className="w-full"
							size="lg"
						>
							{isGenerating ? "Generating..." : "Generate image"}
						</Button>
					</div>

					{/* Right Column - Image Display */}
					<div className="space-y-6">
						<Card>
							<CardHeader title="Generated image" icon={<ImageIcon className="h-5 w-5 text-primary" />} />

							{isGenerating ? (
								<div className="space-y-4">
									<Skeleton className="w-full aspect-square rounded-lg" />
									<p className="text-center text-muted-foreground text-sm">Generating your image...</p>
								</div>
							) : generatedImage ? (
								<div className="space-y-4">
									<img src={generatedImage} alt="Generated" className="w-full rounded-lg border border-border" />
									{responseSeed !== null && responseSeed >= 0 && (
										<p className="text-sm text-muted-foreground text-center">Seed: {responseSeed}</p>
									)}
									<div className="flex gap-3">
										<Button onClick={handleDownload} variant="outline" className="flex-1">
											<Download className="h-4 w-4 mr-2" />
											Download
										</Button>
										<Button onClick={handleGenerate} variant="outline" className="flex-1">
											<RefreshCw className="h-4 w-4 mr-2" />
											Regenerate
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
									<div className="text-center">
										<ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
										<p className="text-muted-foreground">Generated images will appear here</p>
										<p className="text-sm text-muted-foreground mt-1">Configure the request and click Generate image</p>
									</div>
								</div>
							)}
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
