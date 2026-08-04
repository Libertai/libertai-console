import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(relativeTime);

type Timestamp = string | null | undefined;

// Backend timestamps are naive TIMESTAMP columns holding UTC, serialized without an
// offset — a bare dayjs() would read them as browser-local. Every consumer must go
// through these helpers. Scope: new code; existing date-only formats are unaffected.
const at = (value: string) => dayjs.utc(value).local();

export const ts = (value: Timestamp) => (value ? at(value).valueOf() : null);

export const fromNow = (value: Timestamp) => (value ? at(value).fromNow() : null);

// Whole days, rounded up, floored at 0. Not dayjs's toNow(): it renders everything from
// roughly 25 to 46 days as "a month".
export const daysUntil = (value: Timestamp) =>
	value ? Math.max(0, Math.ceil((at(value).valueOf() - Date.now()) / 86_400_000)) : null;

export const shortDate = (value: Timestamp) =>
	value ? at(value).format(at(value).isSame(dayjs(), "year") ? "MMM D" : "MMM D, YYYY") : null;
