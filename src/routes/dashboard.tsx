import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart4, Coins, History, Key, LineChart, Zap } from "lucide-react";
import AccountButton from "@/components/AccountButton";

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
		<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
			<header className="border-b border-slate-700">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Zap className="h-6 w-6 text-blue-400" />
							<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
								LibertAI Dev
							</h1>
						</div>
						<AccountButton />
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="flex flex-col space-y-8">
					<div>
						<h1 className="text-3xl font-bold">Dashboard</h1>
						<p className="text-slate-400 mt-1">Monitor your API usage and account statistics</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center gap-3 mb-2">
								<Coins className="h-5 w-5 text-blue-400" />
								<h2 className="text-lg font-medium">LTAI Balance</h2>
							</div>
							<p className="text-3xl font-bold">{ltaiBalance} LTAI</p>
							<Button
								size="sm"
								className="mt-4 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
								onClick={() => navigate({ to: "/topup" })}
							>
								Top Up
							</Button>
						</div>

						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center gap-3 mb-2">
								<Zap className="h-5 w-5 text-amber-400" />
								<h2 className="text-lg font-medium">API Calls</h2>
							</div>
							<p className="text-3xl font-bold">{mockStats.apiCalls}</p>
							<p className="text-xs text-slate-400 mt-4">This month</p>
						</div>

						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center gap-3 mb-2">
								<Key className="h-5 w-5 text-emerald-400" />
								<h2 className="text-lg font-medium">Active Keys</h2>
							</div>
							<p className="text-3xl font-bold">{mockStats.activeKeys}</p>
							<Button
								size="sm"
								variant="outline"
								className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
								onClick={() => navigate({ to: "/api-keys" })}
							>
								Manage
							</Button>
						</div>

						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center gap-3 mb-2">
								<LineChart className="h-5 w-5 text-purple-400" />
								<h2 className="text-lg font-medium">Tokens Used</h2>
							</div>
							<p className="text-3xl font-bold">{mockStats.tokensUsed}</p>
							<p className="text-xs text-slate-400 mt-4">This month</p>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold">Usage Trends</h2>
								<BarChart4 className="h-5 w-5 text-blue-400" />
							</div>

							<div className="h-64 flex items-end justify-between gap-2">
								{mockStats.monthlyUsage.map((value, index) => (
									<div key={index} className="flex flex-col items-center gap-2 flex-1">
										<div
											className="w-full bg-gradient-to-t from-blue-500 to-violet-500 rounded-t-sm"
											style={{ height: `${(value / Math.max(...mockStats.monthlyUsage)) * 100}%` }}
										></div>
										<span className="text-xs text-slate-400">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</span>
									</div>
								))}
							</div>
						</div>

						<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold">Quick Actions</h2>
								<Zap className="h-5 w-5 text-blue-400" />
							</div>

							<div className="space-y-3">
								<Button
									className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600"
									onClick={() => navigate({ to: "/api-keys" })}
								>
									<span className="flex items-center gap-2">
										<Key className="h-4 w-4" />
										Manage API Keys
									</span>
								</Button>
								<Button
									className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600"
									onClick={() => navigate({ to: "/usage" })}
								>
									<span className="flex items-center gap-2">
										<LineChart className="h-4 w-4" />
										View Detailed Usage
									</span>
								</Button>
								<Button className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600">
									<span className="flex items-center gap-2">
										<History className="h-4 w-4" />
										Request History
									</span>
								</Button>
								<Button className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600">
									<span className="flex items-center gap-2">
										<AlertCircle className="h-4 w-4" />
										API Documentation
									</span>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
