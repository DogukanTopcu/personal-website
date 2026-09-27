"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DiagonalCross } from "@/components/ui/skeleton";

type CoverFieldProps = {
  label?: string;
  url: string | null;
  alt: string;
  onChange: (next: { url: string | null; alt: string }) => void;
  urlError?: string | null;
  altError?: string | null;
  /** Hide the alt input (galleries have no alt column for their cover). */
  withAlt?: boolean;
  helper?: string;
  accept?: string;
  /** Names for the data-field hooks used to scroll errors into view. */
  fieldKeys?: { url: string; alt: string };
};

/** One image from the library, with the alt text the site needs. */
export function CoverField({
  label = "Cover image",
  url,
  alt,
  onChange,
  urlError,
  altError,
  withAlt = true,
  helper,
  accept = "image/*",
  fieldKeys = { url: "cover_url", alt: "cover_alt" },
}: CoverFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3" data-field={fieldKeys.url}>
      <Field label={label} as="group" helper={helper} error={urlError}>
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-hairline-strong bg-surface">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- the cover comes from the media bucket
              <img src={url} alt={alt} className="h-full w-full object-cover" />
            ) : (
              <div className="dashed-frame absolute inset-2">
                <DiagonalCross />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>
              {url ? "Replace" : "Choose image"}
            </Button>
            {url ? (
              <Button size="sm" variant="ghost" onClick={() => onChange({ url: null, alt: "" })}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Field>

      {withAlt && url ? (
        <div data-field={fieldKeys.alt}>
          <Field label="Alt text" required helper="What the image shows, for people who cannot see it." error={altError}>
            <Input value={alt} onChange={(event) => onChange({ url, alt: event.target.value })} />
          </Field>
        </div>
      ) : null}

      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        mode="single"
        accept={accept}
        title={label}
        onPick={(picks) => {
          const pick = picks[0];
          if (pick) onChange({ url: pick.asset.url, alt: alt || pick.asset.alt });
        }}
      />
    </div>
  );
}
