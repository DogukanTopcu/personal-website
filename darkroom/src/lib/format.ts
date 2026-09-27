const dateLong = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dateShort = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string | null | undefined) => (iso ? dateLong.format(new Date(iso)) : "");
export const formatDateShort = (iso: string | null | undefined) => (iso ? dateShort.format(new Date(iso)) : "");
export const formatMonthYear = (iso: string | null | undefined) => (iso ? monthYear.format(new Date(iso)) : "");
export const yearOf = (iso: string | null | undefined) => (iso ? String(new Date(iso).getUTCFullYear()) : "");

export function yearRange(start: string | null, end: string | null, isCurrent: boolean): string {
  const from = yearOf(start);
  const to = isCurrent ? "Present" : yearOf(end);
  if (from && to) return from === to ? from : `${from} - ${to}`;
  return from || to;
}

export function minutes(n: number | null | undefined): string {
  const value = Math.max(1, n ?? 1);
  return `${value} min read`;
}

export function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
