"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { clearLocalDraft, draftKey } from "@/components/editor/local-draft";
import type { ActionResult, FieldErrors, SavedContent } from "@/lib/action-result";
import { useSaveShortcut, useUnsavedGuard } from "@/lib/hooks";
import { sanitizeSlugInput, slugify } from "@/lib/slug";
import type { ContentStatus } from "@/lib/types";

export type BaseValues = { slug: string; status: ContentStatus; published_at: string | null };

export type SavedState = {
  id: string | null;
  slug: string;
  status: ContentStatus;
  published_at: string | null;
};

type Options<V extends BaseValues> = {
  /** Values as loaded from the database, or the defaults for a new row. */
  initial: V;
  id: string | null;
  table: string;
  save: (id: string | null, values: V) => Promise<ActionResult<SavedContent>>;
  /** Where to go after the first save of a new row. */
  editPath: (id: string) => string;
  successMessage?: string;
};

/**
 * State, dirty tracking, saving, Cmd/Ctrl+S, the unsaved-changes guard and
 * the local body autosave key, shared by every content editor.
 */
export function useContentEditor<V extends BaseValues>({ initial, id, table, save, editPath, successMessage }: Options<V>) {
  const router = useRouter();
  const [values, setValues] = useState<V>(initial);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initial));
  const [saved, setSaved] = useState<SavedState>({
    id,
    slug: initial.slug,
    status: initial.status,
    published_at: initial.published_at,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== snapshot;

  const set = useCallback((patch: Partial<V>) => {
    setValues((current) => ({ ...current, ...patch }));
  }, []);

  const submit = useCallback(
    async (status?: ContentStatus) => {
      if (saving) return;
      const next = status ? { ...values, status } : values;
      setValues(next);
      setSaving(true);
      setFormError(null);

      try {
        const result = await save(saved.id, next);
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {});
          setFormError(result.error);
          const first = Object.keys(result.fieldErrors ?? {})[0];
          if (first) {
            document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
          }
          return;
        }

        const merged: V = { ...next, slug: result.data.slug, status: result.data.status, published_at: result.data.published_at };
        setValues(merged);
        setSnapshot(JSON.stringify(merged));
        setErrors({});
        setSaved({ id: result.data.id, slug: result.data.slug, status: result.data.status, published_at: result.data.published_at });

        clearLocalDraft(draftKey(table, saved.id));
        if (!saved.id) clearLocalDraft(draftKey(table, null));

        if (result.warning) toast.warning(result.warning);
        else toast.success(successMessage ?? "Saved.");

        if (!saved.id) router.replace(editPath(result.data.id));
      } catch {
        setFormError("The save did not go through. Check your connection and try again.");
      } finally {
        setSaving(false);
      }
    },
    [saving, values, save, saved.id, table, successMessage, router, editPath],
  );

  useUnsavedGuard(dirty && !saving);
  useSaveShortcut(useCallback(() => void submit(), [submit]));

  const fieldError = useCallback((key: string) => errors[key] ?? null, [errors]);

  return {
    values,
    set,
    saved,
    dirty,
    saving,
    errors,
    fieldError,
    formError,
    submit,
    storageKey: draftKey(table, saved.id),
  };
}

/** Slug follows the title until it is edited by hand; clearing it hands control back. */
export function useSlugField<V extends { title: string; slug: string }>(
  id: string | null,
  set: (patch: Partial<V>) => void,
) {
  const [touched, setTouched] = useState(Boolean(id));

  const setTitle = useCallback(
    (title: string) => {
      set((touched ? { title } : { title, slug: slugify(title) }) as Partial<V>);
    },
    [set, touched],
  );

  const setSlug = useCallback(
    (raw: string) => {
      const slug = sanitizeSlugInput(raw);
      setTouched(slug !== "");
      set({ slug } as Partial<V>);
    },
    [set],
  );

  const regenerate = useCallback(
    (title: string) => {
      setTouched(false);
      set({ slug: slugify(title) } as Partial<V>);
    },
    [set],
  );

  return { touched, setTitle, setSlug, regenerate };
}
