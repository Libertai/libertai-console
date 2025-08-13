import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft, Download, Filter, FileText } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useSubscriptions, useAllSubscriptionTransactions } from "@/hooks/data/use-subscriptions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";

export const Route = createFileRoute("/subscriptions")({
	component: Subscriptions,
});

function formatDate(date: Date): string {
	return dayjs(date).format("YYYY-MM-DD");
}

function capitalizeFirst(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function truncateNote(note: string, maxLength: number = 25): string {
	if (!note || note.length <= maxLength) return note;
	return note.substring(0, maxLength) + '...';
}

function Subscriptions() {
	const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
	const [timeRange, setTimeRange] = useState<"all" | "7d" | "30d" | "custom">("all");
	const [startDate, setStartDate] = useState<string>(formatDate(dayjs().subtract(30, "day").toDate()));
	const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

	const { isAuthenticated } = useRequireAuth();

	const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
	const { allTransactions, isLoading: transactionsLoading } = useAllSubscriptionTransactions(subscriptions);

	const isLoading = subscriptionsLoading || transactionsLoading;

	const selectedSubscriptionTransactions = selectedSubscription
		? allTransactions.filter(tx => tx.subscription_id === selectedSubscription)
		: [];

	const filteredTransactions = timeRange === "all"
		? selectedSubscriptionTransactions
		: selectedSubscriptionTransactions.filter(transaction => {
			const transactionDate = new Date(transaction.created_at);
			const start = new Date(startDate);
			const end = new Date(endDate);
			return transactionDate >= start && transactionDate <= end;
		});

	const handleTimeRangeChange = (range: "all" | "7d" | "30d" | "custom") => {
		const now = new Date();
		setTimeRange(range);

		if (range === "7d") {
			setStartDate(formatDate(dayjs(now).subtract(7, "day").toDate()));
			setEndDate(formatDate(now));
		} else if (range === "30d") {
			setStartDate(formatDate(dayjs(now).subtract(30, "day").toDate()));
			setEndDate(formatDate(now));
		}
	};


	const handleExportAllSubscriptions = () => {
		const subscriptionHeaders = ["ID", "Type", "Amount", "Status", "Created At", "Last Charged", "Next Charge", "Related ID"];
		const subscriptionRows = subscriptions.map(sub => [
			sub.id,
			sub.subscription_type,
			sub.amount,
			sub.status,
			sub.created_at,
			sub.last_charged_at || '',
			sub.next_charge_at || '',
			sub.related_id || ''
		]);

		const transactionHeaders = ["Transaction ID", "Subscription ID", "Subscription Type", "Date", "Amount", "Status", "Notes"];
		const transactionRows = allTransactions.map(tx => {
			const subscription = subscriptions.find(sub => sub.id === tx.subscription_id);
			return [
				tx.id,
				tx.subscription_id,
				subscription?.subscription_type || '',
				tx.created_at,
				tx.amount,
				tx.status,
				tx.notes || ''
			];
		});

		const csvContent = [
			"SUBSCRIPTIONS",
			subscriptionHeaders.join(","),
			...subscriptionRows.map(row => row.join(",")),
			"",
			"TRANSACTIONS", 
			transactionHeaders.join(","),
			...transactionRows.map(row => row.join(","))
		].join("\n");

		downloadCSV(csvContent, `libertai-subscriptions-and-transactions-${formatDate(new Date())}.csv`);
	};

	const handleExportTransactions = () => {
		const selectedSub = subscriptions.find(s => s.id === selectedSubscription);
		const headers = ["Transaction ID", "Date", "Amount", "Status", "Notes"];
		const rows = filteredTransactions.map(tx => [
			tx.id,
			tx.created_at,
			tx.amount,
			tx.status,
			tx.notes || ''
		]);

		const csvContent = [
			headers.join(","),
			...rows.map(row => row.join(","))
		].join("\n");

		const dateRange = timeRange === "all" ? "all" : `${startDate}-to-${endDate}`;
		const filename = `libertai-transactions-${selectedSub?.subscription_type}-${dateRange}.csv`;
		downloadCSV(csvContent, filename);
	};

	const downloadCSV = (content: string, filename: string) => {
		const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-6">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						{selectedSubscription && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedSubscription(null)}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to Subscriptions
							</Button>
						)}
						<div>
							<h1 className="text-3xl font-bold">
								{selectedSubscription ? "Subscription Transactions" : "Subscriptions"}
							</h1>
							<p className="text-muted-foreground mt-1">
								{selectedSubscription ? "Transaction history for selected subscription" : "View your subscriptions and their transactions"}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{selectedSubscription && (
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" size="sm">
										<Filter className="h-4 w-4 mr-2" />
										{timeRange === "all" ? "All Time" : 
										 timeRange === "7d" ? "7 Days" :
										 timeRange === "30d" ? "30 Days" : "Custom"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-80" align="end">
									<div className="space-y-4">
										<h4 className="font-medium text-sm">Filter Transactions</h4>
										<div className="grid grid-cols-2 gap-2">
											<Button
												variant={timeRange === "all" ? "default" : "outline"}
												size="sm"
												onClick={() => handleTimeRangeChange("all")}
											>
												All Time
											</Button>
											<Button
												variant={timeRange === "7d" ? "default" : "outline"}
												size="sm"
												onClick={() => handleTimeRangeChange("7d")}
											>
												7 Days
											</Button>
											<Button
												variant={timeRange === "30d" ? "default" : "outline"}
												size="sm"
												onClick={() => handleTimeRangeChange("30d")}
											>
												30 Days
											</Button>
											<Button
												variant={timeRange === "custom" ? "default" : "outline"}
												size="sm"
												onClick={() => handleTimeRangeChange("custom")}
											>
												Custom
											</Button>
										</div>
										{timeRange === "custom" && (
											<div className="space-y-2">
												<Calendar
													mode="range"
													defaultMonth={new Date()}
													selected={{
														from: startDate ? new Date(startDate) : undefined,
														to: endDate ? new Date(endDate) : undefined,
													}}
													onSelect={(range) => {
														if (range?.from) {
															setStartDate(formatDate(range.from));
															setEndDate(formatDate(range.to || range.from));
														}
													}}
													disabled={(date) => date > new Date()}
													className="rounded-md border"
												/>
											</div>
										)}
									</div>
								</PopoverContent>
							</Popover>
						)}
						{selectedSubscription ? (
							<Button
								variant="outline"
								onClick={handleExportTransactions}
								disabled={isLoading || filteredTransactions.length === 0}
							>
								<Download className="h-4 w-4" />
							</Button>
						) : (
							<Button
								variant="outline"
								onClick={handleExportAllSubscriptions}
								disabled={isLoading || subscriptions.length === 0}
							>
								<Download className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>

				{!selectedSubscription ? (
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="overflow-x-auto">
							{isLoading ? (
								<div className="space-y-2 py-1">
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
								</div>
							) : subscriptions.length === 0 ? (
								<p>No subscriptions found</p>
							) : (
								<div className="space-y-2">
									{subscriptions.map((subscription) => (
										<div 
											key={subscription.id}
											className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/70 cursor-pointer transition-colors"
											onClick={() => setSelectedSubscription(subscription.id)}
										>
											<div className="flex items-center gap-4">
												<div>
													<h3 className="text-lg font-medium">{subscription.subscription_type}</h3>
													<p className="text-sm text-muted-foreground">
														Created {dayjs(subscription.created_at).format('MMM DD, YYYY')}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-right">
													<p className="text-lg font-semibold">${subscription.amount.toFixed(2)}</p>
													<span className={`px-2 py-1 rounded-full text-xs ${
														subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
														subscription.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
														'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400'
													}`}>
														{subscription.status}
													</span>
												</div>
												<ChevronRight className="h-5 w-5 text-muted-foreground" />
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="overflow-x-auto">
							{isLoading ? (
								<div className="space-y-2 py-1">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							) : filteredTransactions.length === 0 ? (
								<p>No transactions found {timeRange !== "all" ? "for the selected date range" : "for this subscription"}</p>
							) : (
								<table className="w-full">
									<thead>
										<tr className="border-b border-border">
											<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
											<th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Notes</th>
										</tr>
									</thead>
									<tbody>
										{filteredTransactions.map((transaction) => (
											<tr key={transaction.id} className="border-b border-border/50 hover:bg-card/70">
												<td className="px-4 py-3 text-sm font-medium">
													{dayjs(transaction.created_at).format('MMM DD, YYYY HH:mm')}
												</td>
												<td className="px-4 py-3 text-sm text-right">${transaction.amount.toFixed(2)}</td>
												<td className="px-4 py-3 text-sm text-center">
													<span className={`px-2 py-1 rounded-full text-xs ${
														transaction.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
														transaction.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
														'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
													}`}>
														{capitalizeFirst(transaction.status)}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-right">
													{transaction.notes && transaction.notes.length > 25 ? (
														<Dialog>
															<DialogTrigger asChild>
																<button className="text-left hover:text-primary cursor-pointer underline decoration-dotted">
																	{truncateNote(transaction.notes)}
																</button>
															</DialogTrigger>
															<DialogContent className="sm:max-w-md">
																<DialogHeader>
																	<DialogTitle className="flex items-center gap-2">
																		<FileText className="h-4 w-4" />
																		Transaction Notes
																	</DialogTitle>
																</DialogHeader>
																<div className="p-4 bg-card/50 rounded-lg border">
																	<p className="text-sm whitespace-pre-wrap">{transaction.notes}</p>
																</div>
															</DialogContent>
														</Dialog>
													) : (
														<span>{capitalizeFirst(transaction.notes) || '-'}</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
