import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@libertai/auth";
import { LibertaiLogo } from "@libertai/branding";
import { ArrowRight, BarChart4, BookOpen, Coins, Key, LineChart, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useCredits } from "@/hooks/data/use-credits";
import { useStats } from "@/hooks/data/use-stats";
import { useApiKeys } from "@/hooks/data/use-api-keys";
import { formatCompactNumber } from "@/lib/utils";

export const Route = createFileRoute("/")({
	component: Index,
});

function LandingPage() {
	const navigate = useNavigate();

	return (
		<div className="mx-auto max-w-5xl px-4 py-16 lg:py-24">
			<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
				<div className="space-y-6">
					<LibertaiLogo className="h-10 w-10" />
					<h1 className="text-4xl font-bold tracking-tight">LibertAI console</h1>
					<p className="text-lg text-muted-foreground">
						API keys, usage, and billing for LibertAI's confidential, OpenAI-compatible inference API.
					</p>
					<div className="flex gap-3">
						<Button size="lg" onClick={() => navigate({ to: "/login" })}>
							Sign in
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Button>
						<Button size="lg" variant="outline" asChild>
							<a href="https://docs.libertai.io" target="_blank" rel="noopener noreferrer">
								View docs
							</a>
						</Button>
					</div>
					<ul className="space-y-3 pt-2">
						<li className="flex items-center gap-3">
							<Key className="h-5 w-5 text-primary" aria-hidden />
							<span>Create scoped API keys with monthly spending limits</span>
						</li>
						<li className="flex items-center gap-3">
							<LineChart className="h-5 w-5 text-primary" aria-hidden />
							<span>Track requests, tokens, and spend per model</span>
						</li>
						<li className="flex items-center gap-3">
							<Coins className="h-5 w-5 text-primary" aria-hidden />
							<span>Buy prepaid credits — no subscription required</span>
						</li>
					</ul>
				</div>
				<Card className="bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
					<div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800">
						<span className="h-3 w-3 rounded-full bg-zinc-700" />
						<span className="h-3 w-3 rounded-full bg-zinc-700" />
						<span className="h-3 w-3 rounded-full bg-zinc-700" />
					</div>
					<pre className="p-4 text-sm text-zinc-100 font-mono overflow-x-auto">{`curl https://api.libertai.io/v1/chat/completions \\
  -H "Authorization: Bearer $LIBERTAI_API_KEY" \\
  -d '{
    "model": "glm-5.2",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}</pre>
				</Card>
			</div>
		</div>
	);
}

function DashboardPage() {
	const navigate = useNavigate();
	const { formattedCredits, isLoading: areCreditsLoading, isError: isCreditsError } = useCredits();
	const { apiKeys, isLoading: areApiKeysLoading } = useApiKeys();
	const {
		apiCalls,
		tokensUsed,
		chartData,
		isLoading: areStatsLoading,
		isError: isStatsError,
		refetch: refetchStats,
	} = useStats();

	// Quick actions data
	const quickActions = [
		{
			id: "apiKeys",
			icon: <Key className="h-4 w-4" />,
			label: "Manage API keys",
			onClick: () => navigate({ to: "/api-keys" }),
			external: false,
		},
		{
			id: "usage",
			icon: <LineChart className="h-4 w-4" />,
			label: "View detailed usage",
			onClick: () => navigate({ to: "/usage" }),
			external: false,
		},
		{
			id: "docs",
			icon: <BookOpen className="h-4 w-4" />,
			label: "API documentation",
			href: "https://docs.libertai.io/apis",
			external: true,
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<PageHeader title="Dashboard" description="Monitor your API usage and account statistics" />

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<StatCard
						title="Credits"
						icon={<Coins className="h-5 w-5 text-primary" />}
						isLoading={areCreditsLoading}
						value={isCreditsError ? <span title="Couldn't load">—</span> : `$${formattedCredits}`}
						action={
							<Button size="sm" onClick={() => navigate({ to: "/billing" })}>
								Buy credits
							</Button>
						}
					/>
					<StatCard
						title="API calls"
						icon={<Zap className="h-5 w-5 text-primary" />}
						isLoading={areStatsLoading}
						value={formatCompactNumber(apiCalls)}
						footer="This month"
					/>
					<StatCard
						title="Active keys"
						icon={<Key className="h-5 w-5 text-primary" />}
						isLoading={areApiKeysLoading}
						value={apiKeys.filter((key) => key.is_active).length}
						action={
							<Button size="sm" variant="outline" onClick={() => navigate({ to: "/api-keys" })}>
								Manage
							</Button>
						}
					/>
					<StatCard
						title="Tokens used"
						icon={<LineChart className="h-5 w-5 text-primary" />}
						isLoading={areStatsLoading}
						value={formatCompactNumber(tokensUsed)}
						footer="This month"
					/>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="lg:col-span-2">
						<CardHeader title="Usage trends" icon={<BarChart4 className="h-5 w-5 text-primary" />} />

						{isStatsError ? (
							<ErrorCard message="Couldn't load usage stats." onRetry={refetchStats} />
						) : (
							<div className="h-64">
								{areStatsLoading ? (
									<div className="flex flex-col gap-4 justify-center px-6 h-full">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-32 w-full" />
										<Skeleton className="h-4 w-3/4 mx-auto" />
									</div>
								) : (
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
											<defs>
												<linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
													<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2} />
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
											<XAxis
												dataKey="month"
												tick={{ fontSize: 12 }}
												tickLine={false}
												axisLine={{ stroke: "var(--border)" }}
											/>
											<YAxis
												tick={{ fontSize: 12 }}
												tickLine={false}
												axisLine={{ stroke: "var(--border)" }}
												domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
												allowDecimals={false}
												tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "var(--card)",
													border: "1px solid var(--border)",
													borderRadius: "0.5rem",
													fontSize: "0.875rem",
													boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
												}}
												formatter={(value) => [
													`$${(value ?? 0).toLocaleString(undefined, {
														maximumFractionDigits: 4,
													})}`,
													"Credits used",
												]}
												labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
												labelStyle={{ marginBottom: "5px", fontWeight: "bold" }}
											/>
											<Area
												type="monotone"
												dataKey="cost"
												name="Credits used"
												stroke="var(--primary)"
												fillOpacity={1}
												fill="url(#colorCost)"
											/>
										</AreaChart>
									</ResponsiveContainer>
								)}
							</div>
						)}
					</Card>

					<Card>
						<CardHeader title="Quick actions" icon={<Zap className="h-5 w-5 text-primary" />} />

						<div className="space-y-3">
							{quickActions.map((action) =>
								action.external ? (
									<a key={action.id} href={action.href} target="_blank" rel="noopener noreferrer">
										<Button variant="outline" className="w-full justify-between">
											<span className="flex items-center gap-2">
												{action.icon}
												{action.label}
											</span>
										</Button>
									</a>
								) : (
									<Button key={action.id} variant="outline" className="w-full justify-between" onClick={action.onClick}>
										<span className="flex items-center gap-2">
											{action.icon}
											{action.label}
										</span>
									</Button>
								),
							)}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}

function Index() {
	const isAuthenticated = useAccountStore((state) => state.isAuthenticated);
	// Store hydration flag: while pending, isAuthenticated is always still false, so rendering
	// LandingPage here would flash it for a returning authenticated user before the dashboard swaps in.
	const isPending = useAccountStore((state) => state.isInitialLoad);

	if (isPending) {
		return <PageSkeleton />;
	}

	return isAuthenticated ? <DashboardPage /> : <LandingPage />;
}
