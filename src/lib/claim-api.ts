import { client } from "@libertai/inference-sdk/client.gen";

// Event credit claims (QR code at a booth -> /claim?e=<code>). These endpoints aren't in the
// generated inference SDK yet, so they go through the same shared client by hand: it already
// carries the API base URL and sends the httpOnly session cookie (withCredentials). Swap these
// for the generated functions once the SDK is regenerated.

export type CampaignStatus = "open" | "upcoming" | "closed" | "full";

export type CampaignEvent = {
	name: string;
	starts_at: string;
	ends_at: string;
};

export type Campaign = {
	code: string;
	libertai_amount: number;
	aleph_amount: number;
	credit_validity_days: number;
	status: CampaignStatus;
	// The running window, else the next upcoming one, else the most recent past one.
	event: CampaignEvent | null;
};

export type AlephStatus = "none" | "pending" | "sent" | "failed";

export type Claim = {
	code: string;
	event_name: string | null;
	created_at: string;
	libertai_amount: number;
	libertai_expires_at: string;
	aleph_amount: number;
	aleph_address: string | null;
	aleph_status: AlephStatus;
	aleph_item_hash: string | null;
	aleph_expires_at: string | null;
};

type ErrorBody = { detail?: unknown };

/** A non-2xx answer (status set) or no answer at all (status null). `detail` is the backend's
 * human-readable message when it sent a string one. */
export class ClaimApiError extends Error {
	constructor(
		readonly status: number | null,
		readonly detail: string | null,
	) {
		super(detail ?? (status ? `Request failed with status ${status}` : "Network error"));
	}
}

/** The backend's message for a failed call, if it sent one. The claim API's `detail` strings are
 * written for end users, unlike FastAPI's validation errors (which come as a list, not a string). */
export const errorDetail = (error: unknown) => (error instanceof ClaimApiError ? error.detail : null);

type Failed = { error: ErrorBody | undefined; response?: { status: number } };

const toError = (response: Failed) => {
	const detail = response.error?.detail;
	return new ClaimApiError(response.response?.status ?? null, typeof detail === "string" ? detail : null);
};

/** Public. Null when the code is unknown (404). */
export async function getCampaign(code: string): Promise<Campaign | null> {
	const response = await client.get<{ 200: Campaign }, { default: ErrorBody }>({
		responseType: "json",
		url: "/credits/campaigns/{code}",
		path: { code },
	});
	if (response.error) {
		if (response.response?.status === 404) return null;
		throw toError(response);
	}
	return response.data;
}

/** The signed-in user's claim on this code, or null when they haven't claimed it yet (404). */
export async function getMyClaim(code: string): Promise<Claim | null> {
	const response = await client.get<{ 200: Claim }, { default: ErrorBody }>({
		responseType: "json",
		url: "/credits/campaigns/{code}/claim",
		path: { code },
	});
	if (response.error) {
		if (response.response?.status === 404) return null;
		throw toError(response);
	}
	return response.data;
}

export async function createClaim(code: string, alephAddress: string | null): Promise<Claim> {
	const response = await client.post<{ 200: Claim }, { default: ErrorBody }>({
		responseType: "json",
		url: "/credits/campaigns/{code}/claim",
		path: { code },
		body: { aleph_address: alephAddress },
		headers: { "Content-Type": "application/json" },
	});
	if (response.error) throw toError(response);
	return response.data;
}

/** Attach a wallet to an existing claim that has none yet (aleph_status "none"). */
export async function attachAlephWallet(code: string, alephAddress: string): Promise<Claim> {
	const response = await client.post<{ 200: Claim }, { default: ErrorBody }>({
		responseType: "json",
		url: "/credits/campaigns/{code}/claim/aleph",
		path: { code },
		body: { aleph_address: alephAddress },
		headers: { "Content-Type": "application/json" },
	});
	if (response.error) throw toError(response);
	return response.data;
}

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
// Base58 (no 0, O, I, l); a Solana public key encodes to 32-44 characters.
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Light shape check only; the backend has the final say (400 on an invalid address). */
export function isValidAlephAddress(address: string): boolean {
	return EVM_ADDRESS.test(address) || SOLANA_ADDRESS.test(address);
}
