import { CreditTransactionProvider, CreditTransactionResponse } from "@/apis/inference";
import { useTransactions } from "@/hooks/data/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import { AlertCircle, Calendar as CalendarIcon, Download, FilterIcon, LucideBrushCleaning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type FilterState = {
	statuses: string[];
	types: CreditTransactionProvider[];
	dateRange: { from?: Date; to?: Date };
	timeRange: "None" | "7d" | "30d" | "custom";
};

function formatDate(date: Date): string {
	return dayjs(date).format("YYYY-MM-DD");
}

function formatDateForCSV(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

const PROVIDER_LABELS: Record<string, string> = {
	ltai_base: "LibertAI (Base)",
	ltai_solana: "LibertAI (Solana)",
	sol_solana: "Solana (SOL)",
	thirdweb: "Thirdweb",
	voucher: "Voucher",
	revolut: "Card (Revolut)",
};

const FilterModal = ({
	filters,
	onFilterChange,
	onClearFilters,
	onClose,
}: {
	filters: FilterState;
	onFilterChange: (filters: FilterState) => void;
	onClearFilters: () => void;
	onClose: () => void;
}) => {
	const statusOptions = [
		{ value: "active", label: "Active" },
		{ value: "used", label: "Used" },
		{ value: "expired", label: "Expired" },
		{ value: "pending", label: "Pending" },
	];

	const typeOptions: { value: CreditTransactionProvider; label: string }[] = [
		{ value: "ltai_base", label: "LibertAI (Base)" },
		{ value: "ltai_solana", label: "LibertAI (Solana)" },
		{ value: "sol_solana", label: "Solana (SOL)" },
		{ value: "thirdweb", label: "Thirdweb" },
		{ value: "revolut", label: "Card (Revolut)" },
		{ value: "voucher", label: "Voucher" },
	];

	const handleStatusChange = (status: string, checked: boolean) => {
		const newStatuses = checked ? [...filters.statuses, status] : filters.statuses.filter((s) => s !== status);
		onFilterChange({ ...filters, statuses: newStatuses });
	};

	const handleTypeChange = (type: CreditTransactionProvider, checked: boolean) => {
		const newTypes = checked ? [...filters.types, type] : filters.types.filter((t) => t !== type);
		onFilterChange({ ...filters, types: newTypes });
	};

	const handleTimeRangeChange = (timeRange: "7d" | "30d" | "custom") => {
		let dateRange = filters.dateRange;
		const now = new Date();
		if (timeRange === "7d") {
			dateRange = { from: dayjs(now).subtract(7, "day").toDate(), to: now };
		} else if (timeRange === "30d") {
			dateRange = { from: dayjs(now).subtract(30, "day").toDate(), to: now };
		}
		onFilterChange({ ...filters, timeRange, dateRange });
	};

	const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
		if (range?.from) {
			onFilterChange({ ...filters, timeRange: "custom", dateRange: { from: range.from, to: range.to || range.from } });
		}
	};

	const hasActiveFilters =
		filters.statuses.length > 0 || filters.types.length > 0 || filters.dateRange.from || filters.dateRange.to;

	return (
		<div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6 space-y-6 w-[400px]">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Filter Transactions</h2>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button variant="ghost" size="sm" onClick={onClearFilters}>
							<LucideBrushCleaning className="h-4 w-4 mr-2" />
							Clear All
						</Button>
					)}
					<Button variant="ghost" size="sm" onClick={onClose} className="text-black hover:text-red-500 p-1">
						<X className="h-4 w-4 dark:text-white" />
					</Button>
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-sm font-medium text-muted-foreground">Date Range</h3>
				<div className="flex items-center gap-2 flex-wrap">
					<Button
						variant={filters.timeRange === "7d" ? "default" : "outline"}
						size="sm"
						onClick={() => handleTimeRangeChange("7d")}
					>
						7 Days
					</Button>
					<Button
						variant={filters.timeRange === "30d" ? "default" : "outline"}
						size="sm"
						onClick={() => handleTimeRangeChange("30d")}
					>
						30 Days
					</Button>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={filters.timeRange === "custom" ? "default" : "outline"}
								size="sm"
								className="w-auto justify-start text-left font-normal"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{filters.timeRange === "custom" && filters.dateRange.from
									? filters.dateRange.from === filters.dateRange.to
										? formatDate(filters.dateRange.from)
										: `${formatDate(filters.dateRange.from)} - ${filters.dateRange.to ? formatDate(filters.dateRange.to) : ""}`
									: "Custom Range"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="range"
								defaultMonth={new Date()}
								selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
								onSelect={handleDateRangeChange}
								autoFocus
								disabled={(date) => date > new Date()}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-sm font-medium text-muted-foreground">Status</h3>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="w-full justify-start">
							{filters.statuses.length === 0
								? "All Statuses"
								: filters.statuses.length === 1
									? statusOptions.find((s) => s.value === filters.statuses[0])?.label
									: `${filters.statuses.length} selected`}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<DropdownMenuLabel>Select Status</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{statusOptions.map((status) => (
							<DropdownMenuCheckboxItem
								key={status.value}
								checked={filters.statuses.includes(status.value)}
								onCheckedChange={(checked) => handleStatusChange(status.value, checked)}
							>
								{status.label}
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="space-y-3">
				<h3 className="text-sm font-medium text-muted-foreground">Type</h3>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="w-full justify-start">
							{filters.types.length === 0
								? "All Types"
								: filters.types.length === 1
									? typeOptions.find((t) => t.value === filters.types[0])?.label
									: `${filters.types.length} selected`}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<DropdownMenuLabel>Select Type</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{typeOptions.map((type) => (
							<DropdownMenuCheckboxItem
								key={type.value}
								checked={filters.types.includes(type.value)}
								onCheckedChange={(checked) => handleTypeChange(type.value, checked)}
							>
								{type.label}
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

export function TransactionHistory() {
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [filters, setFilters] = useState<FilterState>({ statuses: [], types: [], dateRange: {}, timeRange: "None" });
	const { transactions, isLoading, isError } = useTransactions();

	const formatProvider = (provider: CreditTransactionProvider): string => PROVIDER_LABELS[provider] ?? provider;

	const getTransactionStatus = (transaction: CreditTransactionResponse): { label: string; className: string } => {
		if (!transaction.is_active) {
			return { label: "Expired", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
		}
		if (transaction.amount_left <= 0) {
			return { label: "Used", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
		}
		return { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
	};

	const filteredTransactions = useMemo(() => {
		return transactions.filter((transaction) => {
			const transactionDate = dayjs(transaction.created_at);
			if (filters.dateRange.from && transactionDate.isBefore(dayjs(filters.dateRange.from))) return false;
			if (filters.dateRange.to && transactionDate.isAfter(dayjs(filters.dateRange.to).endOf("day"))) return false;
			if (filters.statuses.length > 0) {
				const status = getTransactionStatus(transaction);
				let transactionStatus = status.label.toLowerCase();
				if (transaction.status !== "completed") transactionStatus = "pending";
				if (!filters.statuses.includes(transactionStatus)) return false;
			}
			if (filters.types.length > 0 && !filters.types.includes(transaction.provider)) return false;
			return true;
		});
	}, [transactions, filters]);

	const handleClearFilters = () => setFilters({ statuses: [], types: [], dateRange: {}, timeRange: "None" });

	const handleExportData = () => {
		const headers = ["Date", "Type", "Amount", "Remaining", "Expires", "Status"];
		const csvRows = [
			headers.join(","),
			...filteredTransactions.map((tx) =>
				[
					dayjs(tx.created_at).format("YYYY-MM-DD HH:mm"),
					formatProvider(tx.provider),
					tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 }),
					tx.amount_left.toLocaleString(undefined, { maximumFractionDigits: 4 }),
					tx.expired_at ? dayjs(tx.expired_at).format("YYYY-MM-DD") : "Never",
					getTransactionStatus(tx).label,
				].join(","),
			),
		];
		const startDate = filters.dateRange.from
			? formatDateForCSV(filters.dateRange.from)
			: dayjs(filteredTransactions[filteredTransactions.length - 1].created_at).format("YYYY-MM-DD_HH:mm");
		const endDate = filters.dateRange.to
			? formatDateForCSV(filters.dateRange.to)
			: dayjs(filteredTransactions[0].created_at).format("YYYY-MM-DD_HH:mm");
		const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `libertai-transactions-${startDate}-to-${endDate}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const hasFilters =
		filters.statuses.length > 0 || filters.types.length > 0 || !!filters.dateRange.from || !!filters.dateRange.to;

	return (
		<div className="flex flex-col space-y-4">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<h2 className="text-xl font-semibold">Transaction history</h2>
				<div className="flex gap-1">
					<Popover open={showFilterModal} onOpenChange={setShowFilterModal}>
						<PopoverTrigger asChild>
							<Button className="flex items-center justify-center gap-2">
								<FilterIcon className="h-4 w-4" />
								Filter
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[400px] p-0" align="end">
							<FilterModal
								filters={filters}
								onFilterChange={setFilters}
								onClearFilters={handleClearFilters}
								onClose={() => setShowFilterModal(false)}
							/>
						</PopoverContent>
					</Popover>
					<Button
						variant="outline"
						onClick={handleExportData}
						disabled={isLoading || filteredTransactions.length === 0 || transactions.length === 0}
					>
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{hasFilters && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>
						Showing {filteredTransactions.length} of {transactions.length} transactions
					</span>
				</div>
			)}

			{transactions.some((transaction) => transaction.status !== "completed") && (
				<div className="flex items-center gap-3 p-4 border border-amber-400/30 rounded-lg bg-amber-950/20 text-amber-400">
					<AlertCircle className="h-5 w-5 flex-shrink-0" />
					<div>
						<p className="text-sm font-medium">You have pending transactions</p>
						<p className="text-xs text-amber-400/80">
							Your transaction is being processed and credits will be available soon. If it is not confirmed
							automatically after a few minutes, please reach out to us on{" "}
							<a href="https://t.me/libertai" className="text-primary hover:underline" target="_blank">
								Telegram
							</a>
							.
						</p>
					</div>
				</div>
			)}

			<div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border">
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Type</th>
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Amount</th>
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Remaining</th>
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Expires</th>
								<th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
							</tr>
						</thead>
						<tbody>
							{filteredTransactions.length === 0 && transactions.length > 0 && !isLoading ? (
								<tr className="border-b border-border/50">
									<td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
										No transactions match the current filters.
									</td>
								</tr>
							) : transactions.length === 0 && !isLoading ? (
								<tr className="border-b border-border/50">
									<td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
										No transactions found.
									</td>
								</tr>
							) : isLoading ? (
								<>
									{[0, 1, 2].map((i) => (
										<tr key={i} className="border-b border-border/50">
											<td colSpan={7} className="px-6 py-2">
												<Skeleton className="h-10 w-full my-1" />
											</td>
										</tr>
									))}
								</>
							) : isError ? (
								<tr className="border-b border-border/50">
									<td colSpan={7} className="px-6 py-8 text-center text-destructive">
										Error loading transaction history. Please try again.
									</td>
								</tr>
							) : (
								filteredTransactions.map((transaction) => {
									const status = getTransactionStatus(transaction);
									return (
										<tr key={transaction.id} className="border-b border-border/50 hover:bg-card/70">
											<td className="px-6 py-4 text-sm font-medium">
												{dayjs(transaction.created_at).format("YYYY-MM-DD HH:mm")}
											</td>
											<td className="px-6 py-4 text-sm">{formatProvider(transaction.provider)}</td>
											<td className="px-6 py-4 text-sm">
												${transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
											</td>
											<td className="px-6 py-4 text-sm">
												${transaction.amount_left.toLocaleString(undefined, { maximumFractionDigits: 4 })}
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{transaction.expired_at ? dayjs(transaction.expired_at).format("YYYY-MM-DD") : "Never"}
											</td>
											<td className="px-6 py-4 text-sm">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
													{status.label}
												</span>
												{transaction.status !== "completed" && (
													<span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
														Pending
													</span>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
