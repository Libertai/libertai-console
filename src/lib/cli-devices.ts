import { ts } from "./time";

const CLI_KEY_PREFIX = "libertai-cli@";
// The CLI appends hex::encode of 4 random bytes, always lowercase, always 8 chars. The
// pattern is case-sensitive so an uppercase hostname segment like DEADBEEF is not eaten.
const INSTALL_ID = /^(.*)-([0-9a-f]{8})$/;

export type DeviceLabel = { name: string; installId: string | null };

export function parseDeviceName(rawName: string): DeviceLabel {
	if (!rawName.startsWith(CLI_KEY_PREFIX)) {
		return { name: "Unknown device", installId: null };
	}
	const host = rawName.slice(CLI_KEY_PREFIX.length);
	if (host === "") {
		return { name: "Unknown device", installId: null };
	}
	const match = INSTALL_ID.exec(host);
	return match ? { name: match[1], installId: match[2] } : { name: host, installId: null };
}

type Sortable = { last_used_at?: string | null; created_at: string };

// Most recently used first, never-used last, then newest connection first. Copies the
// array: sorting the query result in place would mutate the react-query cache.
export function sortDevices<T extends Sortable>(devices: T[]): T[] {
	return [...devices].sort((a, b) => {
		const aUsed = ts(a.last_used_at);
		const bUsed = ts(b.last_used_at);
		if (aUsed !== bUsed) {
			if (aUsed === null) return 1;
			if (bUsed === null) return -1;
			return bUsed - aUsed;
		}
		return (ts(b.created_at) ?? 0) - (ts(a.created_at) ?? 0);
	});
}
