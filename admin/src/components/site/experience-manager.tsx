"use client";

import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableList } from "@/components/content/sortable-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StatusMark } from "@/components/ui/status-mark";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FieldErrors } from "@/lib/action-result";
import { removeExperience, reorderExperiences, saveExperience } from "@/lib/actions/experiences";
import type { ExperienceRow } from "@/lib/data/experiences";
import { yearOf } from "@/lib/format";
import { experienceDefaults, toExperienceInput } from "@/lib/inputs";
import type { ExperienceInput } from "@/lib/schemas";
import { CONTENT_STATUSES, EXPERIENCE_KINDS, LABELS, type ExperienceKind } from "@/lib/types";

type Props = { rows: ExperienceRow[] };

/** Years only: "2021 to 2023", "2021 to now", "2021". */
function period(row: ExperienceRow): string {
  const start = yearOf(row.start_date);
  const end = row.is_current ? "now" : yearOf(row.end_date);
  if (start && end) return start === end ? start : `${start} to ${end}`;
  return start || (end ? `until ${end}` : "");
}

export function ExperienceManager({ rows }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [editing, setEditing] = useState<{ row: ExperienceRow | null; kind: ExperienceKind } | null>(null);
  const [deleting, setDeleting] = useState<ExperienceRow | null>(null);
  const [pending, startTransition] = useTransition();

  function reorder(kind: ExperienceKind, next: ExperienceRow[]) {
    const previous = items;
    setItems((current) => [...current.filter((row) => row.kind !== kind), ...next]);
    startTransition(async () => {
      const result = await reorderExperiences(next.map((row) => row.id));
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
    });
  }

  function remove() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await removeExperience(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((row) => row.id !== target.id));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${target.title}".`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {EXPERIENCE_KINDS.map((kind) => {
        const group = items.filter((row) => row.kind === kind).sort((a, b) => a.position - b.position);
        return (
          <section key={kind} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">
                {LABELS.experienceKind[kind]} ({group.length})
              </h2>
              <Button size="sm" onClick={() => setEditing({ row: null, kind })}>
                Add
              </Button>
            </div>
            {group.length === 0 ? (
              <EmptyState className="py-6">Nothing under {LABELS.experienceKind[kind].toLowerCase()} yet.</EmptyState>
            ) : (
              <SortableList
                items={group}
                getId={(row) => row.id}
                onReorder={(next) => reorder(kind, next)}
                disabled={pending}
                className="border-y border-hairline-strong"
                itemClassName="border-b border-hairline last:border-b-0 bg-paper"
                renderItem={(row, handle) => (
                  <div className="flex items-center gap-2 py-2 pr-1">
                    <button {...handle} />
                    <span className="hidden w-24 shrink-0 font-mono text-[0.6875rem] text-ink-soft sm:block">{period(row)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium">{row.title}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {[row.organization, row.location].filter(Boolean).join(", ")}
                        <span className="sm:hidden">{period(row) ? ` · ${period(row)}` : ""}</span>
                      </p>
                    </div>
                    <StatusMark status={row.status} className="hidden md:inline-flex" />
                    <Tooltip label="Edit">
                      <Button variant="ghost" size="sm" icon aria-label={`Edit ${row.title}`} onClick={() => setEditing({ row, kind })}>
                        <PencilSimple size={14} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <Button variant="ghost" size="sm" icon aria-label={`Delete ${row.title}`} onClick={() => setDeleting(row)}>
                        <Trash size={14} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  </div>
                )}
              />
            )}
          </section>
        );
      })}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <ExperienceSheet
            row={editing.row}
            kind={editing.kind}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setItems((current) => {
                const exists = current.some((row) => row.id === saved.id);
                return exists ? current.map((row) => (row.id === saved.id ? saved : row)) : [...current, saved];
              });
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.title}"?` : "Delete entry?"}
        description="The entry is removed from the site for good."
        confirmLabel="Delete entry"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

function ExperienceSheet({
  row,
  kind,
  onClose,
  onSaved,
}: {
  row: ExperienceRow | null;
  kind: ExperienceKind;
  onClose: () => void;
  onSaved: (row: ExperienceRow) => void;
}) {
  const [values, setValues] = useState<ExperienceInput>(() => (row ? toExperienceInput(row) : experienceDefaults(kind)));
  const [highlights, setHighlights] = useState(() => values.highlights.join("\n"));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<ExperienceInput>) => setValues((current) => ({ ...current, ...patch }));

  function submit() {
    const input: ExperienceInput = {
      ...values,
      highlights: highlights
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      const result = await saveExperience(row?.id ?? null, input);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(row ? "Entry saved." : "Entry added.");
      onSaved(result.data);
    });
  }

  return (
    <SheetContent
      title={row ? "Edit entry" : `Add to ${LABELS.experienceKind[kind].toLowerCase()}`}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving" : row ? "Save" : "Add entry"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Kind" error={errors.kind}>
          <Select value={values.kind} onChange={(event) => set({ kind: event.target.value as ExperienceKind })}>
            {EXPERIENCE_KINDS.map((entry) => (
              <option key={entry} value={entry}>
                {LABELS.experienceKind[entry]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" required helper="Role, degree or award name." error={errors.title}>
          <Input value={values.title} onChange={(event) => set({ title: event.target.value })} autoFocus />
        </Field>
        <Field label="Organization" error={errors.organization}>
          <Input value={values.organization} onChange={(event) => set({ organization: event.target.value })} />
        </Field>
        <Field label="Location" error={errors.location}>
          <Input value={values.location} onChange={(event) => set({ location: event.target.value })} />
        </Field>
        <Field label="URL" error={errors.url}>
          <Input type="url" mono value={values.url ?? ""} onChange={(event) => set({ url: event.target.value || null })} placeholder="https://" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" helper="A year is enough: 2021. Optional." error={errors.start_date}>
            <Input mono value={values.start_date} onChange={(event) => set({ start_date: event.target.value })} placeholder="2021" />
          </Field>
          <Field label="End date" helper="Year, or year-month." error={errors.end_date}>
            <Input mono value={values.end_date} disabled={values.is_current} onChange={(event) => set({ end_date: event.target.value })} placeholder="2023" />
          </Field>
        </div>
        <Switch checked={values.is_current} onCheckedChange={(is_current) => set({ is_current })} label="Current" description="Still ongoing. Clears the end date and lists the entry under Now on the home page." />
        <Field label="Summary" error={errors.summary}>
          <Textarea value={values.summary} onChange={(event) => set({ summary: event.target.value })} rows={3} />
        </Field>
        <Field label="Highlights" helper="One per line." error={errors.highlights}>
          <Textarea value={highlights} onChange={(event) => setHighlights(event.target.value)} rows={5} />
        </Field>
        <Field label="Status" helper="Only published entries show on the site." error={errors.status}>
          <Select value={values.status} onChange={(event) => set({ status: event.target.value as ExperienceInput["status"] })}>
            {CONTENT_STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {LABELS.status[entry]}
              </option>
            ))}
          </Select>
        </Field>
        {formError ? (
          <p role="alert" className="border-l-2 border-error pl-3 text-xs text-error">
            {formError}
          </p>
        ) : null}
      </form>
    </SheetContent>
  );
}
