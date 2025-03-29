import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BarChart3, BarChart4, Calendar, Download, HelpCircle, LineChart, Rocket } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/usage")({
	component: Usage,
});

// Mock data for usage statistics
// Total tokens calculated as input + output
const mockDailyUsage = [
	{ date: "03/18", requests: 120, input_tokens: 5200, output_tokens: 2600, tokens: 7800 },
	{ date: "03/19", requests: 145, input_tokens: 5900, output_tokens: 3000, tokens: 8900 },
	{ date: "03/20", requests: 98, input_tokens: 4300, output_tokens: 2200, tokens: 6500 },
	{ date: "03/21", requests: 210, input_tokens: 8200, output_tokens: 4200, tokens: 12400 },
	{ date: "03/22", requests: 180, input_tokens: 7300, output_tokens: 3700, tokens: 11000 },
	{ date: "03/23", requests: 165, input_tokens: 6800, output_tokens: 3400, tokens: 10200 },
	{ date: "03/24", requests: 190, input_tokens: 7500, output_tokens: 3800, tokens: 11300 },
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

	// Function to handle export data to CSV
	const handleExportData = () => {
		// Create CSV content
		const headers = ["Date", "Requests", "Input Tokens", "Output Tokens", "Total Tokens"];
		const csvRows = [
			headers.join(","),
			...mockDailyUsage.map((day) =>
				[day.date, day.requests, day.input_tokens, day.output_tokens, day.tokens].join(","),
			),
		];
		const csvContent = csvRows.join("\n");

		// Create a blob with the CSV data
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);

		// Create a link and trigger download
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `libertai-usage-${timeRange}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<BarChart4 className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Requests</h2>
						</div>
						<p className="text-3xl font-bold">1,200</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<LineChart className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Input tokens</h2>
						</div>
						<p className="text-3xl font-bold">66,000</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Rocket className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Output Tokens</h2>
						</div>
						<p className="text-3xl font-bold">1,200</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Calendar className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Cost</h2>
						</div>
						<p className="text-3xl font-bold">$42</p>
					</div>
				</div>

				{/* Daily Usage Chart */}
				<div className="bg-card/50 backdrop-blur-sm md:p-6 max-sm:p-4 rounded-xl border border-border">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<BarChart3 className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold">Daily Token Usage</h2>
						</div>
						<Button variant="outline" size="sm" onClick={handleExportData}>
							<Download className="h-4 w-4 mr-2" />
							Export Data
						</Button>
					</div>

					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={mockDailyUsage} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
								<XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
								<YAxis
									yAxisId="left"
									orientation="left"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={{ stroke: "var(--border)" }}
									tickFormatter={(value) => value.toLocaleString()}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={{ stroke: "var(--border)" }}
									tickFormatter={(value) => value.toLocaleString()}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--card)",
										border: "1px solid var(--border)",
										borderRadius: "0.5rem",
										fontSize: "0.875rem",
										boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
									}}
									formatter={(value, name) => [value.toLocaleString(), name]}
									itemStyle={{ padding: "4px 0" }}
									cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
									labelFormatter={(label) => `Date: ${label}`}
								/>
								<Legend
									align="center"
									verticalAlign="bottom"
									iconType="circle"
									iconSize={8}
									wrapperStyle={{ paddingTop: "10px" }}
								/>
								<Bar
									yAxisId="right"
									dataKey="input_tokens"
									name="Input"
									fill="#7c3aed"
									radius={[4, 4, 0, 0]}
									barSize={24}
								/>
								<Bar
									yAxisId="right"
									dataKey="output_tokens"
									name="Output"
									fill="#a78bfa"
									radius={[4, 4, 0, 0]}
									barSize={24}
								/>
							</BarChart>
						</ResponsiveContainer>
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
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost</th>
									</tr>
								</thead>
								<tbody>
									{mockModelsUsage.map((model, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{model.model}</td>
											<td className="px-4 py-3 text-sm text-right">{model.requests}</td>
											<td className="px-4 py-3 text-sm text-right">{model.tokens}</td>
											<td className="px-4 py-3 text-sm text-right">${model.cost}</td>
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
										<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost</th>
									</tr>
								</thead>
								<tbody>
									{mockApiKeyUsage.map((key, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{key.key}</td>
											<td className="px-4 py-3 text-sm text-right">{key.requests}</td>
											<td className="px-4 py-3 text-sm text-right">{key.tokens}</td>
											<td className="px-4 py-3 text-sm text-right">${key.cost}</td>
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
