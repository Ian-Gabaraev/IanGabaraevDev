const FULL = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const SHORT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' });

export function formatDate(iso: string): string {
  return FULL.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return SHORT.format(new Date(iso));
}

/** `2026-03-14` — stable across server and client, safe for <time dateTime>. */
export function isoDate(iso: string): string {
  return iso.slice(0, 10);
}

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}
