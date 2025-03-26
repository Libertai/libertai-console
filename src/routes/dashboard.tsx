import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart4, Coins, History, Key, LineChart, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const account = useAccountStore((state) => state.account);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const navigate = useNavigate();

	// In a real app, these would be fetched from an API
	const mockStats = {
		apiCalls: 2853,
		activeKeys: 2,
		tokensUsed: 154893,
		monthlyUsage: [258, 342, 430, 389, 675, 759],
	};

	// Redirect to home if not logged in
	if (!account) {
		navigate({ to: "/" });
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground mt-1">Monitor your API usage and account statistics</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Coins className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">LTAI Balance</h2>
						</div>
						<p className="text-3xl font-bold">{ltaiBalance} LTAI</p>
						<Button size="sm" className="mt-4" onClick={() => navigate({ to: "/topup" })}>
							Top Up
						</Button>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Zap className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">API Calls</h2>
						</div>
						<p className="text-3xl font-bold">{mockStats.apiCalls}</p>
						<p className="text-xs text-muted-foreground mt-4">This month</p>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Key className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Active Keys</h2>
						</div>
						<p className="text-3xl font-bold">{mockStats.activeKeys}</p>
						<Button size="sm" variant="outline" className="mt-4" onClick={() => navigate({ to: "/api-keys" })}>
							Manage
						</Button>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<LineChart className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Tokens Used</h2>
						</div>
						<p className="text-3xl font-bold">{mockStats.tokensUsed}</p>
						<p className="text-xs text-muted-foreground mt-4">This month</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Usage Trends</h2>
							<BarChart4 className="h-5 w-5 text-primary" />
						</div>

						<div className="h-64 flex items-end justify-between gap-2">
							{mockStats.monthlyUsage.map((value, index) => (
								<div key={index} className="flex flex-col items-center gap-2 flex-1">
									<div
										className="w-full bg-gradient-to-t from-primary to-[#8a5cf5] rounded-t-sm"
										style={{ height: `${(value / Math.max(...mockStats.monthlyUsage)) * 100}%` }}
									></div>
									<span className="text-xs text-muted-foreground">
										{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Quick Actions</h2>
							<Zap className="h-5 w-5 text-primary" />
						</div>

						<div className="space-y-3">
							<Button
								variant="outline"
								className="w-full justify-between"
								onClick={() => navigate({ to: "/api-keys" })}
							>
								<span className="flex items-center gap-2">
									<Key className="h-4 w-4" />
									Manage API Keys
								</span>
							</Button>
							<Button variant="outline" className="w-full justify-between" onClick={() => navigate({ to: "/usage" })}>
								<span className="flex items-center gap-2">
									<LineChart className="h-4 w-4" />
									View Detailed Usage
								</span>
							</Button>
							<Button variant="outline" className="w-full justify-between">
								<span className="flex items-center gap-2">
									<History className="h-4 w-4" />
									Request History
								</span>
							</Button>
							<Button variant="outline" className="w-full justify-between">
								<span className="flex items-center gap-2">
									<AlertCircle className="h-4 w-4" />
									API Documentation
								</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
