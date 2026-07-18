import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@libertai/ui/button";
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	BarChart3,
	Calendar as CalendarIcon,
	CreditCard,
	DollarSign,
	Download,
	Zap,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUsageStats } from "@/hooks/data/use-stats";
import { useSubscription, AllowanceBar } from "@libertai/auth";
import { Calendar } from "@libertai/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@libertai/ui/popover";
import { Skeleton } from "@libertai/ui/skeleton";
import { formatCompactNumber } from "@/lib/utils";
import dayjs from "dayjs";
import { Card, CardHeader } from "@libertai/ui/card";
import { StatCard } from "@libertai/ui/stat-card";
import { PageHeader } from "@libertai/ui/page-header";
import { ErrorCard } from "@libertai/ui/error-card";
import { PageSkeleton } from "@libertai/ui/page-skeleton";
import { SortableTableHead, Table, TableBody, TableCell, TableHeader, TableRow } from "@libertai/ui/table";
import { routeHead } from "@/lib/route-titles";

export const Route = createFileRoute("/usage")({
	head: () => routeHead("/usage"),
	component: Usage,
});

function formatDate(date: Date): string {
	return dayjs(date).format("YYYY-MM-DD");
}

// Isolates the 1s countdown tick so it re-renders only this subtree, not the whole page.
function AllowanceCountdown({
	window5h,
	weekly,
}: {
	window5h: { used: number; limit: number; resetsAt?: string | null };
	weekly: { used: number; limit: number; resetsAt?: string | null };
}) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	return (
		<div className="flex flex-col gap-5">
			<AllowanceBar
				label="Last 5 hours"
				used={window5h.used}
				limit={window5h.limit}
				resetsAt={window5h.resetsAt}
				now={now}
			/>
			<AllowanceBar label="This week" used={weekly.used} limit={weekly.limit} resetsAt={weekly.resetsAt} now={now} />
		</div>
	);
}

function OverviewView() {
	const { data: subscription } = useSubscription();
	const currentTier = subscription?.tier ?? "free";

	return (
		<div className="flex flex-col space-y-6">
			<Card>
				<CardHeader
					icon={<Zap className="h-5 w-5 text-primary" />}
					title={
						<>
							Current plan: <span className="capitalize text-primary">{currentTier}</span>
							{subscription?.cancel_at_period_end && (
								<span className="text-sm font-normal text-muted-foreground ml-2">(cancels at period end)</span>
							)}
						</>
					}
					action={
						<Button variant="outline" size="sm" asChild>
							<Link to="/billing">Manage plan</Link>
						</Button>
					}
				/>

				<AllowanceCountdown
					window5h={{
						used: subscription?.window_5h_used ?? 0,
						limit: subscription?.window_5h_limit ?? 0,
						resetsAt: subscription?.window_5h_resets_at,
					}}
					weekly={{
						used: subscription?.weekly_used ?? 0,
						limit: subscription?.weekly_limit ?? 0,
						resetsAt: subscription?.weekly_resets_at,
					}}
				/>
			</Card>

			<Card>
				<CardHeader
					icon={<CreditCard className="h-5 w-5 text-primary" />}
					title={
						<div>
							<div className="text-lg font-semibold">Prepaid credits</div>
							<p className="text-sm font-normal text-muted-foreground">Used once your plan allowance runs out</p>
						</div>
					}
					action={
						<div className="flex items-center gap-4">
							<span className="text-2xl font-bold">${(subscription?.prepaid_balance ?? 0).toFixed(2)}</span>
							<Button size="sm" asChild>
								<Link to="/billing">Buy credits</Link>
							</Button>
						</div>
					}
				/>
			</Card>
		</div>
	);
}

type ModelSortColumn = "name" | "requests" | "tokens" | "cost";
type SortDirection = "asc" | "desc";

// Direction applied when a column is first selected. cost desc matches the previous fixed sort.
const DEFAULT_MODEL_SORT_DIRECTION: Record<ModelSortColumn, SortDirection> = {
	name: "asc",
	requests: "desc",
	tokens: "desc",
	cost: "desc",
};

function AdvancedView() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "custom">("7d");
	const [startDate, setStartDate] = useState<string>(formatDate(dayjs().subtract(7, "day").toDate()));
	const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

	const {
		dailyChartData,
		totalRequests,
		inputTokens,
		outputTokens,
		totalCost,
		modelUsage,
		isLoading,
		isError,
		refetch,
	} = useUsageStats(startDate, endDate);

	const [modelSort, setModelSort] = useState<{ column: ModelSortColumn; direction: SortDirection }>({
		column: "cost",
		direction: "desc",
	});

	const handleModelSort = (column: ModelSortColumn) => {
		setModelSort((prev) =>
			prev.column === column
				? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
				: { column, direction: DEFAULT_MODEL_SORT_DIRECTION[column] },
		);
	};

	const sortedModelUsage = useMemo(() => {
		const factor = modelSort.direction === "asc" ? 1 : -1;
		const compare: Record<ModelSortColumn, (a: (typeof modelUsage)[number], b: (typeof modelUsage)[number]) => number> = {
			name: (a, b) => a.name.localeCompare(b.name),
			requests: (a, b) => a.calls - b.calls,
			tokens: (a, b) => a.total_tokens - b.total_tokens,
			cost: (a, b) => a.cost - b.cost,
		};
		return [...modelUsage].sort((a, b) => compare[modelSort.column](a, b) * factor);
	}, [modelUsage, modelSort]);

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

	const stats = [
		{ title: "Total requests", icon: <BarChart3 className="h-5 w-5 text-primary" />, value: formatCompactNumber(totalRequests) },
		{
			title: "Input tokens",
			icon: <ArrowDownToLine className="h-5 w-5 text-primary" />,
			value: formatCompactNumber(inputTokens),
		},
		{
			title: "Output tokens",
			icon: <ArrowUpFromLine className="h-5 w-5 text-primary" />,
			value: formatCompactNumber(outputTokens),
		},
		{
			title: "Cost",
			icon: <DollarSign className="h-5 w-5 text-primary" />,
			value: `$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
		},
	];

	return (
		<div className="flex flex-col space-y-8">
			<div className="flex justify-end">
				<div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-card">
					<Button variant={timeRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("7d")}>
						7 days
					</Button>
					<Button variant={timeRange === "30d" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("30d")}>
						30 days
					</Button>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={timeRange === "custom" ? "default" : "ghost"}
								size="sm"
								className="w-auto justify-start text-left font-normal"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{timeRange === "custom"
									? startDate === endDate
										? startDate
										: `${startDate} - ${endDate}`
									: "Custom range"}
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
			</div>

			{isError ? (
				<ErrorCard message="Couldn't load usage data." onRetry={refetch} />
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{stats.map((stat) => (
							<StatCard key={stat.title} title={stat.title} icon={stat.icon} value={stat.value} isLoading={isLoading} />
						))}
					</div>

					<Card>
						<CardHeader
							icon={<BarChart3 className="h-5 w-5 text-primary" />}
							title="Daily token usage"
							action={
								<Button variant="outline" size="sm" onClick={handleExportData} disabled={isLoading || dailyChartData.length === 0}>
									<Download className="h-4 w-4 mr-2" />
									Export CSV
								</Button>
							}
						/>

						<div className="h-72">
							{isLoading ? (
								<div className="h-full flex flex-col gap-4 justify-center px-6">
									<Skeleton className="h-6 w-full" />
									<Skeleton className="h-32 w-full" />
									<Skeleton className="h-6 w-3/4 mx-auto" />
								</div>
							) : dailyChartData.length === 0 ? (
								<div className="h-full flex items-center justify-center">
									<p>No usage in this date range yet.</p>
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
											tickFormatter={(value) => formatCompactNumber(value)}
										/>
										<YAxis
											yAxisId="right"
											orientation="right"
											tick={{ fontSize: 12 }}
											tickLine={false}
											axisLine={{ stroke: "var(--border)" }}
											tickFormatter={(value) => formatCompactNumber(value)}
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
										<Bar yAxisId="right" dataKey="input_tokens" name="Input" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={24} />
										<Bar yAxisId="right" dataKey="output_tokens" name="Output" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={24} />
									</BarChart>
								</ResponsiveContainer>
							)}
						</div>
					</Card>

					<Card>
						<CardHeader title="Usage by model" />
						{isLoading ? (
							<div className="space-y-2 py-1">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<SortableTableHead
											label="Model"
											active={modelSort.column === "name"}
											direction={modelSort.direction}
											onSort={() => handleModelSort("name")}
										/>
										<SortableTableHead
											label="Requests"
											active={modelSort.column === "requests"}
											direction={modelSort.direction}
											onSort={() => handleModelSort("requests")}
										/>
										<SortableTableHead
											label="Tokens"
											active={modelSort.column === "tokens"}
											direction={modelSort.direction}
											onSort={() => handleModelSort("tokens")}
										/>
										<SortableTableHead
											label="Cost"
											active={modelSort.column === "cost"}
											direction={modelSort.direction}
											onSort={() => handleModelSort("cost")}
										/>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedModelUsage.length === 0 ? (
										<TableRow>
											<TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
												No usage in this date range yet.
											</TableCell>
										</TableRow>
									) : (
										sortedModelUsage.map((model, index) => (
											<TableRow key={index}>
												<TableCell className="font-medium">{model.name}</TableCell>
												<TableCell className="text-right">{formatCompactNumber(model.calls)}</TableCell>
												<TableCell className="text-right">{formatCompactNumber(model.total_tokens)}</TableCell>
												<TableCell className="text-right">
													${model.cost.toLocaleString(undefined, { maximumFractionDigits: 4 })}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						)}
					</Card>
				</>
			)}
		</div>
	);
}

// Plan/allowance overview is hidden while subscriptions are disabled. Flip to re-enable
// the Overview/Advanced tabs (OverviewView shows plan + reset-countdown windows).
const SHOW_PLAN_OVERVIEW = true;

function Usage() {
	const { isAuthenticated, isPending } = useRequireAuth();
	const [view, setView] = useState<"overview" | "advanced">(SHOW_PLAN_OVERVIEW ? "overview" : "advanced");

	if (isPending) {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<PageHeader
					title="Usage"
					description="Monitor your API usage and costs"
					action={
						SHOW_PLAN_OVERVIEW && (
							<div className="inline-flex rounded-lg border border-border p-1 bg-card">
								<Button variant={view === "overview" ? "default" : "ghost"} size="sm" onClick={() => setView("overview")}>
									Overview
								</Button>
								<Button variant={view === "advanced" ? "default" : "ghost"} size="sm" onClick={() => setView("advanced")}>
									Advanced
								</Button>
							</div>
						)
					}
				/>

				{SHOW_PLAN_OVERVIEW && view === "overview" ? <OverviewView /> : <AdvancedView />}
			</div>
		</div>
	);
}
