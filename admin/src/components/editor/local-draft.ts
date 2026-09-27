const PREFIX = "dt-admin:draft:";

export type LocalDraft = { value: string; savedAt: string };

/** Key for a document body: table plus row id, or "new". */
export function draftKey(table: string, id: string | null | undefined): string {
  return `${table}:${id ?? "new"}`;
}

export function readLocalDraft(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalDraft>;
    if (typeof parsed.value !== "string" || typeof parsed.savedAt !== "string") return null;
    return { value: parsed.value, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function writeLocalDraft(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ value, savedAt: new Date().toISOString() } satisfies LocalDraft));
  } catch {
    // Storage full or blocked: the server save is still the real thing.
  }
}

export function clearLocalDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to clear.
  }
}
