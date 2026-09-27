/** A runtime, the way a programme prints it: "5 min". */
export function runtimeShort(n: number | null | undefined): string {
  return `${Math.max(1, n ?? 1)} min`;
}

/** "3 lessons", "1 chapter": a count with its noun. */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
