import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(relativeTime);

type Timestamp = string | null | undefined;

// Backend timestamps are naive TIMESTAMP columns holding UTC, serialized without an
// offset, a bare dayjs() would read them as browser-local. Every consumer must go
// through these helpers. Scope: new code; existing date-only formats are unaffected.
const at = (value: string) => dayjs.utc(value).local();

export const ts = (value: Timestamp) => (value ? at(value).valueOf() : null);

export const fromNow = (value: Timestamp) => (value ? at(value).fromNow() : null);

export const isoDate = (value: Timestamp) => (value ? at(value).format("YYYY-MM-DD") : null);

// Whole days, rounded up, floored at 0. Not dayjs's toNow(): it renders everything from
// roughly 25 to 46 days as "a month".
export const daysUntil = (value: Timestamp) =>
	value ? Math.max(0, Math.ceil((at(value).valueOf() - Date.now()) / 86_400_000)) : null;

// The year is only shown outside the current one: device keys live 90 days, so
// created_at legitimately crosses a year boundary.
export const shortDate = (value: Timestamp) => {
	if (!value) return null;
	const date = at(value);
	return date.format(date.isSame(dayjs(), "year") ? "MMM D" : "MMM D, YYYY");
};
