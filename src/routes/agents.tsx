import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bot, Copy, HardDrive, Info, MoreVertical, PlusCircle, RefreshCw, Terminal, Trash2, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useAgents } from "@/hooks/data/use-agents";
import { useCredits } from "@/hooks/data/use-credits";
import dayjs from "dayjs";
import { toast } from "sonner";
import { AgentForm } from "@/components/AgentForm";
import { DeleteAgentModal } from "@/components/DeleteAgentModal";
import { CreateAgentRequest } from "@/apis/inference/types.gen";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/agents")({
	component: AgentsPage,
});

function AgentsPage() {
	const { isAuthenticated } = useRequireAuth();
	const { agents, isLoading, createAgent, deleteAgent, resubscribeAgent, isCreating, isDeleting, isResubscribing } =
		useAgents();
	const { credits, refreshCredits } = useCredits();

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string; paidUntil: string } | null>(null);

	const MONTHLY_COST = 10; // $10 monthly cost

	// Return null if not authenticated (redirect is handled by the hook)
	if (!isAuthenticated) {
		return null;
	}

	const handleCreateAgent = async (formData: CreateAgentRequest) => {
		if (credits < MONTHLY_COST) {
			toast.error("Insufficient credits", {
				description: `You need at least $${MONTHLY_COST} in your account to subscribe to an agent.`,
			});
			return;
		}

		await createAgent(formData);
		setShowCreateModal(false);

		// Refresh credits to show the updated balance
		refreshCredits();
	};

	const handleDeleteAgent = (agentId: string, agentName: string, paidUntil: string) => {
		setAgentToDelete({ id: agentId, name: agentName, paidUntil });
	};

	const confirmDeleteAgent = async () => {
		if (agentToDelete) {
			await deleteAgent(agentToDelete.id);
			setAgentToDelete(null);
		}
	};

	const handleResubscribe = async (agentId: string) => {
		if (credits < MONTHLY_COST) {
			toast.error("Insufficient credits", {
				description: `You need at least $${MONTHLY_COST} in your account to resubscribe to this agent.`,
			});
			return;
		}

		await resubscribeAgent({ agentId, months: 1 });
		refreshCredits();
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-8 max-w-5xl mx-auto">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">Agents</h1>
						<p className="text-muted-foreground mt-1">Manage your AI Agents</p>
					</div>
					<Button onClick={() => setShowCreateModal(true)}>
						<PlusCircle className="h-4 w-4 mr-2" />
						New Agent
					</Button>
				</div>

				{/* List of agents */}
				<div>
					<h2 className="text-xl font-semibold mb-4">Your Agents</h2>
					{isLoading ? (
						<div className="text-center p-8">Loading agents...</div>
					) : agents.length === 0 ? (
						<div className="text-center bg-card p-8 rounded-xl border border-border">
							<Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">No agents yet</h3>
							<p className="text-muted-foreground mb-4">You haven't created an agent yet.</p>
							<Button onClick={() => setShowCreateModal(true)}>
								<PlusCircle className="h-4 w-4 mr-2" />
								New Agent
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{agents.map((agent) => (
								<div key={agent.id} className="bg-card p-6 rounded-xl border border-border flex flex-col space-y-4">
									<div className="flex justify-between items-start">
										<div className="flex items-center gap-2">
											<Bot className="h-5 w-5 text-primary" />
											<h3 className="text-lg font-medium">{agent.name}</h3>
											{agent.is_active ? (
												<span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Active</span>
											) : (
												<span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500">Inactive</span>
											)}
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" aria-label="More options">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{!agent.is_active && (
													<DropdownMenuItem
														onClick={() => handleResubscribe(agent.id)}
														disabled={isResubscribing || credits < MONTHLY_COST}
													>
														<RefreshCw className="h-4 w-4 mr-2" />
														Resubscribe
													</DropdownMenuItem>
												)}
												<DropdownMenuItem disabled>
													<HardDrive className="h-4 w-4 mr-2" />
													Recreate Instance
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onClick={() =>
														handleDeleteAgent(agent.id, agent.name, dayjs(agent.paid_until).format("MMM D, YYYY"))
													}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-muted-foreground">
												<span className="font-medium">ID:</span> {agent.id}
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												<span className="font-medium">Paid until:</span> {dayjs(agent.paid_until).format("MMM D, YYYY")}
											</p>
										</div>

										<div className="space-y-2">
											<div className="flex items-start gap-2">
												<Terminal className="h-4 w-4 text-muted-foreground mt-0.5" />
												{agent.instance_ip ? (
													<div>
														<p className="text-sm font-medium">SSH Connection:</p>
														<div className="mt-1 flex items-center">
															<code className="text-xs bg-muted px-2 py-1 rounded">ssh root@{agent.instance_ip}</code>
															<Button
																size="icon"
																variant="ghost"
																className="h-6 w-6 ml-1"
																onClick={() => {
																	navigator.clipboard.writeText(`ssh root@${agent.instance_ip}`);
																	toast.success("SSH command copied to clipboard");
																}}
															>
																<Copy className="h-3 w-3" />
															</Button>
														</div>
													</div>
												) : (
													<div>
														<p className="text-sm font-medium">Instance:</p>
														<div className="flex items-center mt-1">
															<div className="flex items-center text-amber-500">
																<div className="inline-block h-2 w-2 animate-pulse bg-amber-500 rounded-full mr-2"></div>
																<span className="text-xs">Allocating...</span>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Information panel */}
				<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
					<div className="flex items-center gap-3 mb-4">
						<Info className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">About AI Agents</h2>
					</div>
					<div className="space-y-4 text-card-foreground">
						<p>
							LibertAI Agents are AI-powered assistants that run in a dedicated decentralized instance. Each agent costs
							${MONTHLY_COST} per month, which will be automatically deducted from your credit balance.
						</p>
						<div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 mt-4">
							<p className="text-sm text-foreground">
								<strong>Important:</strong> When you create an agent, you agree to a monthly charge of ${MONTHLY_COST}{" "}
								from your credit balance. You can cancel at any time & your agent instance will be deleted at the end of
								your billing period.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Create Agent Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
						<div className="flex justify-between items-center mb-6">
							<div className="flex items-center gap-3">
								<Bot className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Create New Agent</h2>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<AgentForm
							onSubmit={handleCreateAgent}
							onCancel={() => setShowCreateModal(false)}
							isLoading={isCreating}
							monthlyPrice={MONTHLY_COST}
							userCredits={credits}
						/>
					</div>
				</div>
			)}

			{/* Delete Agent Modal */}
			{agentToDelete && (
				<DeleteAgentModal
					onConfirm={confirmDeleteAgent}
					onCancel={() => setAgentToDelete(null)}
					isLoading={isDeleting}
					agentName={agentToDelete.name}
					paidUntil={agentToDelete.paidUntil}
				/>
			)}
		</div>
	);
}
