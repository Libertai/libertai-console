import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccountStore } from "@/stores/account";
import { ArrowRight, Coins, Key, LayoutDashboard, LineChart, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountButton from "@/components/AccountButton.tsx";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const account = useAccountStore((state) => state.account);
	const ltaiBalance = useAccountStore((state) => state.ltaiBalance);
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
			<div className="container mx-auto px-4 py-12">
				<div className="flex flex-col items-center justify-center space-y-6 text-center">
					<h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
						LibertAI Developer Platform
					</h1>
					<p className="text-lg text-slate-300 max-w-2xl">
						Connect your wallet, create API keys, and build powerful applications with LibertAI's inference capabilities
					</p>

					{!account ? (
						<div className="mt-8 flex flex-col items-center space-y-4">
							<p className="text-slate-400">Connect your wallet to get started</p>
							<AccountButton />
							<div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
								<div className="flex flex-col space-y-4">
									<p className="text-slate-300">Access your developer dashboard to:</p>
									<ul className="text-left space-y-2">
										<li className="flex items-center gap-2">
											<Key className="h-5 w-5 text-blue-400" />
											<span>Create and manage API keys</span>
										</li>
										<li className="flex items-center gap-2">
											<LineChart className="h-5 w-5 text-blue-400" />
											<span>Monitor your usage stats</span>
										</li>
										<li className="flex items-center gap-2">
											<Coins className="h-5 w-5 text-blue-400" />
											<span>Top up your LTAI balance</span>
										</li>
										<li className="flex items-center gap-2">
											<MessageSquareText className="h-5 w-5 text-blue-400" />
											<span>Test LLM inference</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					) : (
						<div className="mt-8 w-full max-w-4xl">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-xl font-semibold">Account Overview</h2>
										<Coins className="h-5 w-5 text-blue-400" />
									</div>
									<div className="space-y-2">
										<p className="text-slate-300">Current LTAI Balance</p>
										<p className="text-3xl font-bold text-blue-400">{ltaiBalance} LTAI</p>
										<Button
											className="w-full mt-4 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
											onClick={() => navigate({ to: "/topup" })}
										>
											Top Up Balance
										</Button>
									</div>
								</div>

								<div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-xl font-semibold">Quick Actions</h2>
										<Key className="h-5 w-5 text-blue-400" />
									</div>
									<div className="space-y-4">
										<Button
											className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600"
											onClick={() => navigate({ to: "/dashboard" })}
										>
											<span className="flex items-center gap-2">
												<LayoutDashboard className="h-4 w-4" />
												Dashboard
											</span>
											<ArrowRight className="h-4 w-4" />
										</Button>
										<Button
											className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600"
											onClick={() => navigate({ to: "/api-keys" })}
										>
											<span className="flex items-center gap-2">
												<Key className="h-4 w-4" />
												API Keys
											</span>
											<ArrowRight className="h-4 w-4" />
										</Button>
										<Button
											className="w-full justify-between bg-slate-700 hover:bg-slate-600 border border-slate-600"
											onClick={() => navigate({ to: "/usage" })}
										>
											<span className="flex items-center gap-2">
												<LineChart className="h-4 w-4" />
												Usage Stats
											</span>
											<ArrowRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
