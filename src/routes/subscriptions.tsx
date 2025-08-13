import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar as CalendarIcon, Download, HelpCircle, CreditCard, Activity, DollarSign } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSubscriptions, useAllSubscriptionTransactions } from "@/hooks/data/use-subscriptions";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";

export const Route = createFileRoute("/subscriptions")({
	component: Subscriptions,
});

function formatDate(date: Date): string {
	return dayjs(date).format("YYYY-MM-DD");
}

function Subscriptions() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "custom">("30d");
	const [startDate, setStartDate] = useState<string>(formatDate(dayjs().subtract(30, "day").toDate()));
	const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

	// Use auth hook to require authentication
	const { isAuthenticated } = useRequireAuth();

	// Use the subscriptions hooks
	const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
	const { allTransactions, isLoading: transactionsLoading } = useAllSubscriptionTransactions(subscriptions);

	const isLoading = subscriptionsLoading || transactionsLoading;

	// Filter transactions by date range
	const filteredTransactions = allTransactions.filter(transaction => {
		const transactionDate = new Date(transaction.created_at);
		const start = new Date(startDate);
		const end = new Date(endDate);
		return transactionDate >= start && transactionDate <= end;
	});

	// Calculate summary statistics
	const totalSubscriptions = subscriptions.length;
	const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
	const totalTransactions = filteredTransactions.length;
	const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

	// Prepare chart data - transactions by date
	const transactionsByDate = filteredTransactions.reduce((acc, transaction) => {
		const date = dayjs(transaction.created_at).format('YYYY-MM-DD');
		if (!acc[date]) {
			acc[date] = { date, amount: 0, count: 0 };
		}
		acc[date].amount += transaction.amount;
		acc[date].count += 1;
		return acc;
	}, {} as Record<string, { date: string; amount: number; count: number }>);

	const chartData = Object.values(transactionsByDate).sort((a, b) => 
		new Date(a.date).getTime() - new Date(b.date).getTime()
	);

	// Handle time range changes
	const handleTimeRangeChange = (range: "7d" | "30d" | "custom") => {
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

	// Function to handle export data to CSV
	const handleExportData = () => {
		// Prepare subscription data for CSV
		const subscriptionHeaders = ["ID", "Type", "Amount", "Status", "Created At", "Last Charged", "Next Charge", "Related ID"];
		const subscriptionRows = subscriptions.map(sub => [
			sub.id,
			sub.subscription_type,
			sub.amount,
			sub.status,
			sub.created_at,
			sub.last_charged_at,
			sub.next_charge_at,
			sub.related_id
		]);

		// Prepare transaction data for CSV
		const transactionHeaders = ["Transaction ID", "Subscription ID", "Amount", "Status", "Notes", "Created At"];
		const transactionRows = filteredTransactions.map(tx => [
			tx.id,
			tx.subscription_id,
			tx.amount,
			tx.status,
			tx.notes,
			tx.created_at
		]);

		// Combine both datasets
		const csvContent = [
			"SUBSCRIPTIONS",
			subscriptionHeaders.join(","),
			...subscriptionRows.map(row => row.join(",")),
			"",
			"TRANSACTIONS",
			transactionHeaders.join(","),
			...transactionRows.map(row => row.join(","))
		].join("\n");

		// Create a blob with the CSV data
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);

		// Create a link and trigger download
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `libertai-subscriptions-${startDate}-to-${endDate}.csv`);
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
				<div className="flex justify-between items-center flex-wrap gap-4">
					<div>
						<h1 className="text-3xl font-bold">Subscription Management</h1>
						<p className="text-muted-foreground mt-1">Monitor your subscriptions and transaction history</p>
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Button variant={timeRange === "7d" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("7d")}>
							7 Days
						</Button>
						<Button variant={timeRange === "30d" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("30d")}>
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
									autoFocus
									disabled={(date) => date > new Date()}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<CreditCard className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Subscriptions</h2>
						</div>
						{isLoading ? (
							<Skeleton className="h-10 w-32" />
						) : (
							<p className="text-3xl font-bold">{totalSubscriptions}</p>
						)}
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<Activity className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Active Subscriptions</h2>
						</div>
						{isLoading ? (
							<Skeleton className="h-10 w-32" />
						) : (
							<p className="text-3xl font-bold">{activeSubscriptions}</p>
						)}
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<BarChart3 className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Transactions</h2>
						</div>
						{isLoading ? (
							<Skeleton className="h-10 w-32" />
						) : (
							<p className="text-3xl font-bold">{totalTransactions}</p>
						)}
					</div>

					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center gap-3 mb-2">
							<DollarSign className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-medium">Total Amount</h2>
						</div>
						{isLoading ? (
							<Skeleton className="h-10 w-32" />
						) : (
							<p className="text-3xl font-bold">{`$${totalAmount.toLocaleString(undefined, {
								maximumFractionDigits: 2,
							})}`}</p>
						)}
					</div>
				</div>

				{/* Daily Transactions Chart */}
				<div className="bg-card/50 backdrop-blur-sm md:p-6 max-sm:p-4 rounded-xl border border-border">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<BarChart3 className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold">Daily Transaction Activity</h2>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleExportData}
							disabled={isLoading || (subscriptions.length === 0 && filteredTransactions.length === 0)}
						>
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
						) : chartData.length === 0 ? (
							<div className="h-full flex items-center justify-center">
								<p>No transaction data available for the selected date range</p>
							</div>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
									<XAxis
										dataKey="date"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={{ stroke: "var(--border)" }}
									/>
									<YAxis
										yAxisId="left"
										orientation="left"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={{ stroke: "var(--border)" }}
										tickFormatter={(value) => `$${value}`}
									/>
									<YAxis
										yAxisId="right"
										orientation="right"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={{ stroke: "var(--border)" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "var(--card)",
											border: "1px solid var(--border)",
											borderRadius: "0.5rem",
											fontSize: "0.875rem",
											boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
										}}
										formatter={(value, name) => [
											name === 'amount' ? `$${Number(value).toFixed(2)}` : value,
											name === 'amount' ? 'Amount' : 'Count'
										]}
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
										yAxisId="left"
										dataKey="amount"
										name="Amount"
										fill="#7c3aed"
										radius={[4, 4, 0, 0]}
										barSize={24}
									/>
									<Bar
										yAxisId="right"
										dataKey="count"
										name="Count"
										fill="#a78bfa"
										radius={[4, 4, 0, 0]}
										barSize={24}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				{/* Subscriptions and Transactions Tables */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold">Current Subscriptions</h2>
							<HelpCircle className="h-4 w-4 text-muted-foreground" />
						</div>

						<div className="overflow-x-auto">
							{isLoading ? (
								<div className="space-y-2 py-1">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							) : subscriptions.length === 0 ? (
								<p>No subscriptions found</p>
							) : (
								<table className="w-full">
									<thead>
										<tr className="border-b border-border">
											<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Status</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Next Charge</th>
										</tr>
									</thead>
									<tbody>
										{subscriptions.map((subscription) => (
											<tr key={subscription.id} className="border-b border-border/50 hover:bg-card/70">
												<td className="px-4 py-3 text-sm font-medium">{subscription.subscription_type}</td>
												<td className="px-4 py-3 text-sm text-right">${subscription.amount.toFixed(2)}</td>
												<td className="px-4 py-3 text-sm text-right">
													<span className={`px-2 py-1 rounded-full text-xs ${
														subscription.status === 'active' ? 'bg-green-100 text-green-800' :
														subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{subscription.status}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-right">
													{dayjs(subscription.next_charge_at).format('MMM DD, YYYY')}
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
							<h2 className="text-xl font-semibold">Recent Transactions</h2>
							<HelpCircle className="h-4 w-4 text-muted-foreground" />
						</div>

						<div className="overflow-x-auto">
							{isLoading ? (
								<div className="space-y-2 py-1">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							) : filteredTransactions.length === 0 ? (
								<p>No transactions found for the selected date range</p>
							) : (
								<table className="w-full">
									<thead>
										<tr className="border-b border-border">
											<th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Status</th>
											<th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Notes</th>
										</tr>
									</thead>
									<tbody>
										{filteredTransactions.slice(0, 10).map((transaction) => (
											<tr key={transaction.id} className="border-b border-border/50 hover:bg-card/70">
												<td className="px-4 py-3 text-sm font-medium">
													{dayjs(transaction.created_at).format('MMM DD, YYYY')}
												</td>
												<td className="px-4 py-3 text-sm text-right">${transaction.amount.toFixed(2)}</td>
												<td className="px-4 py-3 text-sm text-right">
													<span className={`px-2 py-1 rounded-full text-xs ${
														transaction.status === 'success' ? 'bg-green-100 text-green-800' :
														transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
														'bg-yellow-100 text-yellow-800'
													}`}>
														{transaction.status}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-right max-w-32 truncate">
													{transaction.notes || '-'}
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
		</div>
	);
}
