import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart4, Coins, Key, LineChart, Zap } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useApiKeys } from "@/hooks/data/use-api-keys";
import { useCredits } from "@/hooks/data/use-credits";
import { useStats } from "@/hooks/data/use-stats";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { isAuthenticated } = useRequireAuth();
	const { formattedCredits, isLoading: areCreditsLoading } = useCredits();
	const navigate = useNavigate();
	const { apiKeys, isLoading: areApiKeysLoading } = useApiKeys();
	const { apiCalls, tokensUsed, chartData, isLoading: areStatsLoading } = useStats();

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	// Quick actions data
	const quickActions = [
		{
			id: "apiKeys",
			icon: <Key className="h-4 w-4" />,
			label: "Manage API Keys",
			onClick: () => navigate({ to: "/api-keys" }),
			external: false,
		},
		{
			id: "usage",
			icon: <LineChart className="h-4 w-4" />,
			label: "View Detailed Usage",
			onClick: () => navigate({ to: "/usage" }),
			external: false,
		},
		{
			id: "docs",
			icon: <AlertCircle className="h-4 w-4" />,
			label: "API Documentation",
			href: "https://docs.libertai.io/apis",
			external: true,
		},
	];

	// Dashboard stat cards data
	const dashboardStats = [
		{
			id: "balance",
			title: "Balance",
			icon: <Coins className="h-5 w-5 text-primary" />,
			value: areCreditsLoading ? <Skeleton className="h-10 w-32" /> : `$${formattedCredits}`,
			action: {
				label: "Top Up",
				variant: "default",
				onClick: () => navigate({ to: "/top-up" }),
			},
		},
		{
			id: "apiCalls",
			title: "API Calls",
			icon: <Zap className="h-5 w-5 text-primary" />,
			value: areStatsLoading ? <Skeleton className="h-10 w-32" /> : apiCalls,
			footer: "This month",
		},
		{
			id: "activeKeys",
			title: "Active Keys",
			icon: <Key className="h-5 w-5 text-primary" />,
			value: areApiKeysLoading ? <Skeleton className="h-10 w-32" /> : apiKeys.filter((key) => key.is_active).length,
			action: {
				label: "Manage",
				variant: "outline",
				onClick: () => navigate({ to: "/api-keys" }),
			},
		},
		{
			id: "tokensUsed",
			title: "Tokens Used",
			icon: <LineChart className="h-5 w-5 text-primary" />,
			value: areStatsLoading ? <Skeleton className="h-10 w-32" /> : tokensUsed,
			footer: "This month",
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground mt-1">Monitor your API usage and account statistics</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{dashboardStats.map((stat) => (
						<div key={stat.id} className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
							<div className="flex items-center gap-3 mb-2">
								{stat.icon}
								<h2 className="text-lg font-medium">{stat.title}</h2>
							</div>
							<p className="text-3xl font-bold">{stat.value}</p>
							{stat.action && (
								<Button
									size="sm"
									variant={stat.action.variant as "default" | "outline"}
									className="mt-4"
									onClick={stat.action.onClick}
								>
									{stat.action.label}
								</Button>
							)}
							{stat.footer && <p className="text-xs text-muted-foreground mt-4">{stat.footer}</p>}
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Usage Trends</h2>
							<BarChart4 className="h-5 w-5 text-primary" />
						</div>

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
											domain={[0, "dataMax + 5"]}
											tickFormatter={(value) => `$${value}`}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "0.5rem",
												fontSize: "0.875rem",
												boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
											}}
											formatter={(value) => [`$${value}`, "Credits used"]}
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
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Quick Actions</h2>
							<Zap className="h-5 w-5 text-primary" />
						</div>

						<div className="space-y-3">
							{quickActions.map((action) =>
								action.external ? (
									<a key={action.id} href={action.href} target="_blank">
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
					</div>
				</div>
			</div>
		</div>
	);
}
