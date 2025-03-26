import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BarChart3, BarChart4, Calendar, Download, HelpCircle, LineChart } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useState } from "react";

export const Route = createFileRoute("/usage")({
	component: Usage,
});

// Mock data for usage statistics
const mockDailyUsage = [
	{ date: "03/18", requests: 120, tokens: 7800 },
	{ date: "03/19", requests: 145, tokens: 8900 },
	{ date: "03/20", requests: 98, tokens: 6500 },
	{ date: "03/21", requests: 210, tokens: 12400 },
	{ date: "03/22", requests: 180, tokens: 11000 },
	{ date: "03/23", requests: 165, tokens: 10200 },
	{ date: "03/24", requests: 190, tokens: 11300 },
];

const mockModelsUsage = [
	{ model: "libertai-7b", requests: 850, tokens: 42000, cost: 8.4 },
	{ model: "libertai-34b", requests: 230, tokens: 15000, cost: 4.5 },
	{ model: "libertai-vision", requests: 120, tokens: 9000, cost: 3.6 },
];

const mockApiKeyUsage = [
	{ key: "Production API Key", requests: 950, tokens: 48000, cost: 9.6 },
	{ key: "Development API Key", requests: 250, tokens: 18000, cost: 6.9 },
];

function Usage() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	// Find the max values for scaling
	const maxRequests = Math.max(...mockDailyUsage.map((day) => day.requests));
	const maxTokens = Math.max(...mockDailyUsage.map((day) => day.tokens));

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">Usage Statistics</h1>
						<p className="text-muted-foreground mt-1">Monitor your API usage and costs</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant={timeRange === "7d" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("7d")}>
							7 Days
						</Button>
						<Button variant={timeRange === "30d" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("30d")}>
							30 Days
						</Button>
						<Button variant={timeRange === "90d" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("90d")}>
							90 Days
						</Button>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<BarChart4 className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Requests</h2>
						</div>
						<p className="text-3xl font-bold">1,200</p>
						<p className="text-sm text-emerald-400 mt-1 flex items-center">
							<span className="inline-block mr-1">↑</span> 8% from previous period
						</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<LineChart className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Tokens</h2>
						</div>
						<p className="text-3xl font-bold">66,000</p>
						<p className="text-sm text-emerald-400 mt-1 flex items-center">
							<span className="inline-block mr-1">↑</span> 12% from previous period
						</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Calendar className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Cost</h2>
						</div>
						<p className="text-3xl font-bold">16.5 LTAI</p>
						<p className="text-sm text-emerald-400 mt-1 flex items-center">
							<span className="inline-block mr-1">↑</span> 5% from previous period
						</p>
					</div>
				</div>

				{/* Daily Usage Chart */}
				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<BarChart3 className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold">Daily Usage</h2>
						</div>
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-2" />
							Export Data
						</Button>
					</div>

					<div className="h-72 flex flex-col">
						<div className="flex-1 flex items-end justify-between gap-2">
							{mockDailyUsage.map((day, index) => (
								<div key={index} className="flex flex-col items-center gap-1 flex-1 group relative">
									<div className="w-full flex flex-col items-center gap-1">
										<div
											className="w-4/5 bg-primary/80 hover:bg-primary transition-colors rounded-sm"
											style={{ height: `${(day.requests / maxRequests) * 100}%` }}
										></div>
										<div
											className="w-4/5 bg-[#8a5cf5]/80 hover:bg-[#8a5cf5] transition-colors rounded-sm"
											style={{ height: `${(day.tokens / maxTokens) * 30}%` }}
										></div>
									</div>

									{/* Tooltip */}
									<div className="absolute bottom-full mb-2 bg-card rounded-md border border-border p-2 text-xs invisible group-hover:visible w-32 z-10">
										<p className="font-semibold">{day.date}</p>
										<p className="text-primary flex justify-between mt-1">
											<span>Requests:</span>
											<span>{day.requests}</span>
										</p>
										<p className="text-[#8a5cf5] flex justify-between">
											<span>Tokens:</span>
											<span>{day.tokens}</span>
										</p>
									</div>

									<span className="text-xs text-muted-foreground mt-1">{day.date}</span>
								</div>
							))}
						</div>

						<div className="flex justify-center mt-4 gap-6">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-primary rounded-sm"></div>
								<span className="text-xs text-muted-foreground">Requests</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-[#8a5cf5] rounded-sm"></div>
								<span className="text-xs text-muted-foreground">Tokens</span>
							</div>
						</div>
					</div>
				</div>

				{/* Usage by Model and API Key */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Usage by Model</h2>
							<HelpCircle className="h-4 w-4 text-muted-foreground" />
						</div>

						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Model</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Tokens</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost (LTAI)</th>
									</tr>
								</thead>
								<tbody>
									{mockModelsUsage.map((model, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{model.model}</td>
											<td className="px-4 py-3 text-sm text-right">{model.requests}</td>
											<td className="px-4 py-3 text-sm text-right">{model.tokens}</td>
											<td className="px-4 py-3 text-sm text-right">{model.cost}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Usage by API Key</h2>
							<HelpCircle className="h-4 w-4 text-muted-foreground" />
						</div>

						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">API Key</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Tokens</th>
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost (LTAI)</th>
									</tr>
								</thead>
								<tbody>
									{mockApiKeyUsage.map((key, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{key.key}</td>
											<td className="px-4 py-3 text-sm text-right">{key.requests}</td>
											<td className="px-4 py-3 text-sm text-right">{key.tokens}</td>
											<td className="px-4 py-3 text-sm text-right">{key.cost}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
