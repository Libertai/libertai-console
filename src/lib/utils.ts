import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMoney } from "@libertai/lib/utils";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const COMPACT_UNITS = [
	{ threshold: 1e12, suffix: "T" },
	{ threshold: 1e9, suffix: "B" },
	{ threshold: 1e6, suffix: "M" },
	{ threshold: 1e3, suffix: "k" },
] as const;

// Compact number: 1234 -> "1.2k", 5_000_000 -> "5M". Below 1000 shown in full.
export function formatCompactNumber(value: number): string {
	const abs = Math.abs(value);
	for (const { threshold, suffix } of COMPACT_UNITS) {
		if (abs >= threshold) {
			return `${(value / threshold).toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
		}
	}
	return value.toLocaleString();
}

// Headline amounts drop the cents when there are none: 40 -> "$40", 12.5 -> "$12.50".
export function formatWholeMoney(value: number): string {
	return Number.isInteger(value) ? `$${value.toLocaleString()}` : formatMoney(value);
}
