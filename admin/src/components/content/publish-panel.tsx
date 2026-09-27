"use client";

import { ArrowSquareOut, Eye } from "@phosphor-icons/react";
import { AnchorButton, Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/datetime-field";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { StatusMark } from "@/components/ui/status-mark";
import { Time } from "@/components/ui/time";
import { isFuture } from "@/lib/format";
import { previewHref, siteUrl } from "@/lib/paths";
import { CONTENT_STATUSES, LABELS, type ContentStatus } from "@/lib/types";
import type { SavedState } from "./use-content-editor";

type PublishPanelProps = {
  status: ContentStatus;
  publishedAt: string | null;
  saved: SavedState;
  dirty: boolean;
  saving: boolean;
  formError: string | null;
  errors: { status?: string | null; published_at?: string | null };
  onStatusChange: (status: ContentStatus) => void;
  onPublishedAtChange: (iso: string | null) => void;
  onSubmit: (status?: ContentStatus) => void;
  /** Public path of the saved row, for preview and "View on site". Null before the first save. */
  publicPath: string | null;
  /** Lessons and chapters are only public when their parent is. */
  parentPublished?: boolean;
};

function primaryLabel(status: ContentStatus, saved: SavedState, publishedAt: string | null): string {
  if (status === "draft") return "Publish";
  if (status === "archived") return saved.status === "archived" ? "Update" : "Archive";
  if (saved.status === "published") return "Update";
  return isFuture(publishedAt) ? "Schedule" : "Publish";
}

/** Status, publish date, save buttons, preview and the link to the live page. */
export function PublishPanel({
  status,
  publishedAt,
  saved,
  dirty,
  saving,
  formError,
  errors,
  onStatusChange,
  onPublishedAtChange,
  onSubmit,
  publicPath,
  parentPublished = true,
}: PublishPanelProps) {
  const isLive = saved.status === "published" && !isFuture(saved.published_at) && parentPublished;
  const primary = primaryLabel(status, saved, publishedAt);
  const primaryStatus: ContentStatus = status === "draft" ? "published" : status;

  return (
    <section className="overflow-hidden rounded-xl border border-hairline-strong bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="eyebrow">Publish</h2>
        <StatusMark status={saved.status} publishedAt={saved.published_at} className="text-xs" />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <Field label="Status" error={errors.status}>
          <Select value={status} onChange={(event) => onStatusChange(event.target.value as ContentStatus)}>
            {CONTENT_STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {LABELS.status[entry]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Publish date"
          helper={
            publishedAt && isFuture(publishedAt)
              ? "In the future: the page goes live at that moment."
              : "Leave empty to use the moment you publish."
          }
          error={errors.published_at}
        >
          <DateTimeField value={publishedAt} onChange={onPublishedAtChange} />
        </Field>

        {formError ? (
          <p role="alert" className="border-l-2 border-error pl-3 text-xs leading-5 text-error">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button variant="primary" disabled={saving} onClick={() => onSubmit(primaryStatus)}>
            {saving ? "Saving" : primary}
          </Button>
          {status === "draft" ? (
            <Button disabled={saving} onClick={() => onSubmit("draft")}>
              Save draft
            </Button>
          ) : null}
        </div>

        <p className="font-mono text-[0.6875rem] text-ink-soft" aria-live="polite">
          {dirty ? "Unsaved changes" : saved.id ? "All changes saved" : "Not saved yet"}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-hairline px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <AnchorButton
            href={publicPath && saved.id ? previewHref(publicPath) : "#"}
            target="_blank"
            rel="noopener"
            size="sm"
            aria-disabled={!saved.id || !publicPath}
            onClick={(event) => {
              if (!saved.id || !publicPath) event.preventDefault();
            }}
          >
            <Eye size={14} aria-hidden="true" />
            Preview
          </AnchorButton>
          {isLive && publicPath ? (
            <AnchorButton href={siteUrl(publicPath)} target="_blank" rel="noopener" size="sm" variant="ghost">
              View on site
              <ArrowSquareOut size={14} aria-hidden="true" />
            </AnchorButton>
          ) : null}
        </div>
        <p className="text-[0.6875rem] leading-4 text-ink-soft">
          {!saved.id
            ? "Save once to enable the preview."
            : dirty
              ? "The preview shows the last saved version."
              : "Opens the public site in draft mode for two minutes."}
        </p>
        {saved.published_at ? (
          <p className="font-mono text-[0.6875rem] text-ink-soft">
            {isFuture(saved.published_at) ? "Goes live " : "Published "}
            <Time iso={saved.published_at} mode="datetime" />
          </p>
        ) : null}
      </div>
    </section>
  );
}
