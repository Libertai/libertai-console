import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	BarChart3,
	BarChart4,
	Calendar as CalendarIcon,
	CreditCard,
	Download,
	HelpCircle,
	LineChart,
	Rocket,
	Zap,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUsageStats } from "@/hooks/data/use-stats";
import { useSubscription } from "@/hooks/data/use-payments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";

export const Route = createFileRoute("/usage")({
	component: Usage,
});

function formatDate(date: Date): string {
	return dayjs(date).format("YYYY-MM-DD");
}

function formatCountdown(resetsAt: string | null | undefined, now: number): string | null {
	if (!resetsAt) return null;
	const diff = new Date(resetsAt).getTime() - now;
	if (diff <= 0) return null;
	const s = Math.floor(diff / 1000);
	const d = Math.floor(s / 86400);
	const h = Math.floor((s % 86400) / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (d > 0) return `${d}d ${h}h`;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${sec}s`;
	return `${sec}s`;
}

function AllowanceBar({
	label,
	used,
	limit,
	resetsAt,
	now,
}: Readonly<{ label: string; used: number; limit: number; resetsAt?: string | null; now: number }>) {
	const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	const countdown = formatCountdown(resetsAt, now);
	return (
		<div>
			<div className="flex justify-between text-sm mb-1">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium">{pct}% used</span>
			</div>
			<div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
				<div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
			</div>
			{countdown && <p className="text-xs text-muted-foreground mt-1 text-right">Resets in {countdown}</p>}
		</div>
	);
}

function OverviewView() {
	const { data: subscription } = useSubscription();
	const currentTier = subscription?.tier ?? "free";

	// Tick every second so the reset countdowns stay live.
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	return (
		<div className="flex flex-col space-y-6">
			<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
				<div className="flex items-center justify-between flex-wrap gap-3 mb-6">
					<div className="flex items-center gap-3">
						<Zap className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">
							Current plan: <span className="capitalize text-primary">{currentTier}</span>
						</h2>
						{subscription?.cancel_at_period_end && (
							<span className="text-sm text-muted-foreground">(cancels at period end)</span>
						)}
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link to="/billing">Manage plan</Link>
					</Button>
				</div>

				{/* Rolling allowance windows — stacked, one per line */}
				<div className="flex flex-col gap-5">
					<AllowanceBar
						label="Last 5 hours"
						used={subscription?.window_5h_used ?? 0}
						limit={subscription?.window_5h_limit ?? 0}
						resetsAt={subscription?.window_5h_resets_at}
						now={now}
					/>
					<AllowanceBar
						label="This week"
						used={subscription?.weekly_used ?? 0}
						limit={subscription?.weekly_limit ?? 0}
						resetsAt={subscription?.weekly_resets_at}
						now={now}
					/>
				</div>
			</div>

			<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div className="flex items-center gap-3">
						<CreditCard className="h-5 w-5 text-primary" />
						<div>
							<h2 className="text-lg font-medium">Prepaid credits</h2>
							<p className="text-sm text-muted-foreground">Used once your plan allowance runs out</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-2xl font-bold">${(subscription?.prepaid_balance ?? 0).toFixed(2)}</span>
						<Button size="sm" asChild>
							<Link to="/billing">Buy credits</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function AdvancedView() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "custom">("7d");
	const [startDate, setStartDate] = useState<string>(formatDate(dayjs().subtract(7, "day").toDate()));
	const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

	const { dailyChartData, totalRequests, inputTokens, outputTokens, totalCost, modelUsage, apiKeyUsage, isLoading } =
		useUsageStats(startDate, endDate);

	useEffect(() => {
		const now = new Date();
		if (timeRange === "7d") {
			setStartDate(formatDate(dayjs(now).subtract(7, "day").toDate()));
			setEndDate(formatDate(now));
		} else if (timeRange === "30d") {
			setStartDate(formatDate(dayjs(now).subtract(30, "day").toDate()));
			setEndDate(formatDate(now));
		}
	}, [timeRange]);

	const handleExportData = () => {
		const headers = ["Date", "Input Tokens", "Output Tokens", "Total Tokens"];
		const csvRows = [
			headers.join(","),
			...dailyChartData.map((day) => [day.date, day.input_tokens, day.output_tokens, day.tokens].join(",")),
		];
		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `libertai-usage-${startDate}-to-${endDate}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="flex flex-col space-y-8">
			<div className="flex justify-end items-center flex-wrap gap-2">
				<Button variant={timeRange === "7d" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("7d")}>
					7 Days
				</Button>
				<Button variant={timeRange === "30d" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("30d")}>
					30 Days
				</Button>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant={timeRange === "custom" ? "default" : "outline"}
							size="sm"
							className="w-auto justify-start text-left font-normal"
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{timeRange === "custom"
								? startDate === endDate
									? startDate
									: `${startDate} - ${endDate}`
								: "Custom Range"}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="range"
							defaultMonth={new Date()}
							selected={{
								from: startDate ? new Date(startDate) : undefined,
								to: endDate ? new Date(endDate) : undefined,
							}}
							onSelect={(range) => {
								if (range?.from) {
									setTimeRange("custom");
									setStartDate(formatDate(range.from));
									setEndDate(formatDate(range.to || range.from));
								}
							}}
							initialFocus
							disabled={(date) => date > new Date()}
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-2">
						<BarChart4 className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-medium">Total Requests</h2>
					</div>
					{isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-3xl font-bold">{totalRequests.toLocaleString()}</p>}
				</div>

				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-2">
						<LineChart className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-medium">Input tokens</h2>
					</div>
					{isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-3xl font-bold">{inputTokens.toLocaleString()}</p>}
				</div>

				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-2">
						<Rocket className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-medium">Output Tokens</h2>
					</div>
					{isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-3xl font-bold">{outputTokens.toLocaleString()}</p>}
				</div>

				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-2">
						<CalendarIcon className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-medium">Cost</h2>
					</div>
					{isLoading ? (
						<Skeleton className="h-10 w-32" />
					) : (
						<p className="text-3xl font-bold">{`$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</p>
					)}
				</div>
			</div>

			{/* Daily Usage Chart */}
			<div className="bg-card/50 backdrop-blur-sm md:p-6 max-sm:p-4 rounded-xl border border-border">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<BarChart3 className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">Daily Token Usage</h2>
					</div>
					<Button variant="outline" size="sm" onClick={handleExportData} disabled={isLoading || dailyChartData.length === 0}>
						<Download className="h-4 w-4 mr-2" />
						Export Data
					</Button>
				</div>

				<div className="h-72">
					{isLoading ? (
						<div className="h-full flex flex-col gap-4 justify-center px-6">
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-6 w-3/4 mx-auto" />
						</div>
					) : dailyChartData.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p>No data available for the selected date range</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
									formatter={(value, name) => [(value ?? 0).toLocaleString(), name]}
									itemStyle={{ padding: "4px 0" }}
									cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
									labelFormatter={(label) => `Date: ${label}`}
								/>
								<Legend align="center" verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "10px" }} />
								<Bar yAxisId="right" dataKey="input_tokens" name="Input" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={24} />
								<Bar yAxisId="right" dataKey="output_tokens" name="Output" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={24} />
							</BarChart>
						</ResponsiveContainer>
					)}
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
						{isLoading ? (
							<div className="space-y-2 py-1">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : modelUsage.length === 0 ? (
							<p>No data available for the selected date range</p>
						) : (
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
									{modelUsage.map((model, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{model.name}</td>
											<td className="px-4 py-3 text-sm text-right">{model.calls}</td>
											<td className="px-4 py-3 text-sm text-right">{model.total_tokens}</td>
											<td className="px-4 py-3 text-sm text-right">
												${model.cost.toLocaleString(undefined, { maximumFractionDigits: 4 })}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold">Usage by API Key</h2>
						<HelpCircle className="h-4 w-4 text-muted-foreground" />
					</div>
					<div className="overflow-x-auto">
						{isLoading ? (
							<div className="space-y-2 py-1">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : apiKeyUsage.length === 0 ? (
							<p>No data available for the selected date range</p>
						) : (
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
									{apiKeyUsage.map((key, index) => (
										<tr key={index} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-4 py-3 text-sm font-medium">{key.name}</td>
											<td className="px-4 py-3 text-sm text-right">{key.calls}</td>
											<td className="px-4 py-3 text-sm text-right">{key.total_tokens}</td>
											<td className="px-4 py-3 text-sm text-right">
												${key.cost.toLocaleString(undefined, { maximumFractionDigits: 4 })}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// Plan/allowance overview is hidden while subscriptions are disabled. Flip to re-enable
// the Overview/Advanced tabs (OverviewView shows plan + reset-countdown windows).
const SHOW_PLAN_OVERVIEW = false;

function Usage() {
	const { isAuthenticated } = useRequireAuth();
	const [view, setView] = useState<"overview" | "advanced">(SHOW_PLAN_OVERVIEW ? "overview" : "advanced");

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div className="flex justify-between items-center flex-wrap gap-4">
					<div>
						<h1 className="text-3xl font-bold">Usage</h1>
						<p className="text-muted-foreground mt-1">Monitor your API usage and costs</p>
					</div>
					{SHOW_PLAN_OVERVIEW && (
						<div className="inline-flex rounded-lg border border-border p-1 bg-card/50">
							<Button variant={view === "overview" ? "default" : "ghost"} size="sm" onClick={() => setView("overview")}>
								Overview
							</Button>
							<Button variant={view === "advanced" ? "default" : "ghost"} size="sm" onClick={() => setView("advanced")}>
								Advanced
							</Button>
						</div>
					)}
				</div>

				{SHOW_PLAN_OVERVIEW && view === "overview" ? <OverviewView /> : <AdvancedView />}
			</div>
		</div>
	);
}
