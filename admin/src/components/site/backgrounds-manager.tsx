"use client";

import { ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { CoverField } from "@/components/content/cover-field";
import { SortableList } from "@/components/content/sortable-list";
import { AnchorButton, Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import type { FieldErrors } from "@/lib/action-result";
import { removeBackground, reorderBackgrounds, saveBackground, saveBackgroundSettings } from "@/lib/actions/backgrounds";
import type { BackgroundRow } from "@/lib/data/backgrounds";
import { siteUrl } from "@/lib/paths";
import type { BackgroundInput } from "@/lib/schemas";

type Settings = { background_id: string | null; background_picker: boolean };
type Props = { backgrounds: BackgroundRow[]; settings: Settings };

/** The public site's own grounds and ink, so a preview here reads like the site. */
const SITE = {
  light: { paper: "#fcfcfc", ink: "#111113", faint: "#6c6e76" },
  dark: { paper: "#0e0f11", ink: "#ececee", faint: "#8a8c93" },
} as const;

type Look = { light_url: string | null; dark_url: string | null; veil_light: number; veil_dark: number };

/** One theme of a background as the site paints it: the picture, the veil, and a line of text on top. */
function Swatch({ look, theme, size = "sm" }: { look: Look; theme: "light" | "dark"; size?: "sm" | "lg" }) {
  const colours = SITE[theme];
  const picture = theme === "dark" ? (look.dark_url ?? look.light_url) : look.light_url;
  const veil = (theme === "dark" ? look.veil_dark : look.veil_light) / 100;
  const style: CSSProperties = {
    backgroundColor: colours.paper,
    backgroundImage: picture ? `url(${JSON.stringify(picture)})` : undefined,
  };
  return (
    <div
      className={
        size === "lg"
          ? "relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-hairline-strong bg-cover bg-center"
          : "relative h-9 w-16 shrink-0 overflow-hidden rounded-md border border-hairline-strong bg-cover bg-center"
      }
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={{ backgroundColor: colours.paper, opacity: veil }} />
      {size === "lg" ? (
        <div className="absolute inset-0 flex flex-col justify-center gap-1 px-5">
          <p className="text-lg font-semibold" style={{ color: colours.ink }}>
            Hi, I&apos;m Doğukan.
          </p>
          <p className="text-xs" style={{ color: colours.faint }}>
            Sep 2026 · the faintest text on the site
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function BackgroundsManager({ backgrounds, settings }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(backgrounds);
  const [current, setCurrent] = useState<Settings>(settings);
  const [editing, setEditing] = useState<{ row: BackgroundRow | null } | null>(null);
  const [deleting, setDeleting] = useState<BackgroundRow | null>(null);
  const [pending, startTransition] = useTransition();

  function applySettings(next: Settings, success: string) {
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await saveBackgroundSettings(next);
      if (!result.ok) {
        setCurrent(previous);
        toast.error(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(success);
    });
  }

  function reorder(next: BackgroundRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await reorderBackgrounds(next.map((row) => row.id));
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
      const result = await removeBackground(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((list) => list.filter((row) => row.id !== target.id));
      if (current.background_id === target.id) setCurrent((value) => ({ ...value, background_id: null }));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${target.name}".`);
      router.refresh();
    });
  }

  const nameOf = (id: string | null) => items.find((row) => row.id === id)?.name ?? "No background";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow">Options ({items.length})</h2>
          <Button size="sm" onClick={() => setEditing({ row: null })}>
            Add background
          </Button>
        </div>
        <p className="max-w-2xl text-[0.8125rem] text-ink-soft">
          The option marked Default is what every visitor sees first. Drag to change the order the site lists them in.
        </p>

        <fieldset className="flex flex-col" disabled={pending}>
          <legend className="sr-only">Default background</legend>

          <label className="flex items-center gap-3 border-y border-hairline-strong py-2 pr-1 pl-9">
            <input
              type="radio"
              name="default-background"
              className="h-4 w-4 shrink-0 accent-[var(--accent)]"
              checked={current.background_id === null}
              onChange={() => applySettings({ ...current, background_id: null }, "The site now has no background.")}
            />
            <Swatch look={{ light_url: null, dark_url: null, veil_light: 0, veil_dark: 0 }} theme="light" />
            <Swatch look={{ light_url: null, dark_url: null, veil_light: 0, veil_dark: 0 }} theme="dark" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium">No background</span>
              <span className="block truncate font-mono text-[0.6875rem] text-ink-soft">
                The plain page{current.background_id === null ? " · default" : ""}
              </span>
            </span>
          </label>

          {items.length === 0 ? (
            <EmptyState className="mt-3 py-6">No backgrounds yet. Add one with a picture for each theme.</EmptyState>
          ) : (
            <SortableList
              items={items}
              getId={(row) => row.id}
              onReorder={reorder}
              disabled={pending}
              className="border-b border-hairline-strong"
              itemClassName="border-b border-hairline last:border-b-0 bg-paper"
              renderItem={(row, handle) => (
                <div className="flex items-center gap-3 py-2 pr-1">
                  <button {...handle} />
                  <input
                    type="radio"
                    name="default-background"
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    aria-label={`Use ${row.name} as the default`}
                    checked={current.background_id === row.id}
                    onChange={() => applySettings({ ...current, background_id: row.id }, `The site now shows "${row.name}".`)}
                  />
                  <Swatch look={row} theme="light" />
                  <Swatch look={row} theme="dark" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium">{row.name}</p>
                    <p className="truncate font-mono text-[0.6875rem] text-ink-soft">
                      Veil {row.veil_light}% light, {row.veil_dark}% dark{row.dark_url ? "" : " · one picture for both"}
                      {current.background_id === row.id ? " · default" : ""}
                    </p>
                  </div>
                  <Tooltip label="Preview on the site">
                    <AnchorButton
                      variant="ghost"
                      size="sm"
                      icon
                      href={siteUrl(`/?background=${row.id}`)}
                      target="_blank"
                      rel="noopener"
                      aria-label={`Preview ${row.name} on the site`}
                    >
                      <ArrowSquareOut size={14} aria-hidden="true" />
                    </AnchorButton>
                  </Tooltip>
                  <Tooltip label="Edit">
                    <Button variant="ghost" size="sm" icon aria-label={`Edit ${row.name}`} onClick={() => setEditing({ row })}>
                      <PencilSimple size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <Button variant="ghost" size="sm" icon aria-label={`Delete ${row.name}`} onClick={() => setDeleting(row)}>
                      <Trash size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                </div>
              )}
            />
          )}
        </fieldset>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="eyebrow">Visitors</h2>
        <Switch
          checked={current.background_picker}
          disabled={pending}
          onCheckedChange={(background_picker) =>
            applySettings(
              { ...current, background_picker },
              background_picker ? "Visitors can choose a background." : "Visitors see the default only.",
            )
          }
          label="Let visitors choose"
          description={`Adds a background button to the site's header, listing No background and every option above. A choice is kept in the visitor's own browser; without one they see ${nameOf(current.background_id)}.`}
        />
      </section>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <BackgroundDialog
            row={editing.row}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setItems((list) => (list.some((row) => row.id === saved.id) ? list.map((row) => (row.id === saved.id ? saved : row)) : [...list, saved]));
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : "Delete background?"}
        description={
          deleting && deleting.id === current.background_id
            ? "It is the default, so the site will show no background until you choose another. The pictures stay in the media library."
            : "Visitors who chose it go back to the default. The pictures stay in the media library."
        }
        confirmLabel="Delete background"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

function BackgroundDialog({ row, onClose, onSaved }: { row: BackgroundRow | null; onClose: () => void; onSaved: (row: BackgroundRow) => void }) {
  const [values, setValues] = useState<BackgroundInput>(
    row
      ? { name: row.name, light_url: row.light_url, dark_url: row.dark_url, veil_light: row.veil_light, veil_dark: row.veil_dark }
      : { name: "", light_url: null, dark_url: null, veil_light: 60, veil_dark: 60 },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<BackgroundInput>) => setValues((value) => ({ ...value, ...patch }));

  const look: Look = {
    light_url: values.light_url ?? null,
    dark_url: values.dark_url ?? null,
    veil_light: Number(values.veil_light),
    veil_dark: Number(values.veil_dark),
  };

  function submit() {
    startTransition(async () => {
      const result = await saveBackground(row?.id ?? null, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(row ? "Background saved." : "Background added.");
      onSaved(result.data);
    });
  }

  const veilField = (key: "veil_light" | "veil_dark", label: string) => (
    <Field label={label} error={errors[key]} aside={`${values[key]}%`} helper="Higher keeps text easier to read; lower shows more of the picture.">
      <input
        type="range"
        min={0}
        max={95}
        step={1}
        value={Number(values[key])}
        onChange={(event) => set({ [key]: Number(event.target.value) })}
        className="w-full accent-[var(--accent)]"
      />
    </Field>
  );

  return (
    <DialogContent
      size="lg"
      title={row ? "Edit background" : "New background"}
      description="A wide, calm picture works best: it is cropped to fill every screen, from a phone to a wide monitor."
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving" : row ? "Save" : "Add background"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Name" required error={errors.name} helper="Shown to visitors in the background menu.">
          <Input value={values.name} onChange={(event) => set({ name: event.target.value })} autoFocus placeholder="Sea" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <CoverField
              label="Light theme picture"
              url={values.light_url ?? null}
              alt=""
              withAlt={false}
              onChange={({ url }) => set({ light_url: url })}
              urlError={errors.light_url}
              fieldKeys={{ url: "light_url", alt: "light_alt" }}
            />
            {veilField("veil_light", "Veil in the light theme")}
            <Swatch look={look} theme="light" size="lg" />
          </div>
          <div className="flex flex-col gap-4">
            <CoverField
              label="Dark theme picture"
              url={values.dark_url ?? null}
              alt=""
              withAlt={false}
              onChange={({ url }) => set({ dark_url: url })}
              urlError={errors.dark_url}
              helper="Optional. Without one, the light picture is used under a dark veil."
              fieldKeys={{ url: "dark_url", alt: "dark_alt" }}
            />
            {veilField("veil_dark", "Veil in the dark theme")}
            <Swatch look={look} theme="dark" size="lg" />
          </div>
        </div>

        {formError ? (
          <p role="alert" className="border-l-2 border-error pl-3 text-xs text-error">
            {formError}
          </p>
        ) : null}
      </form>
    </DialogContent>
  );
}
