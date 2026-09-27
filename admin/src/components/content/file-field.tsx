"use client";

import { FilePdf } from "@phosphor-icons/react";
import { useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type FileFieldProps = {
  label: string;
  helper?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string | null;
  accept?: string;
  fieldKey: string;
};

/** A single non-image file (a PDF, say) chosen from the library. */
export function FileField({ label, helper, value, onChange, error, accept = "application/pdf", fieldKey }: FileFieldProps) {
  const [open, setOpen] = useState(false);
  const name = value ? decodeURIComponent(value.split("/").pop() ?? value) : null;

  return (
    <div data-field={fieldKey}>
      <Field label={label} as="group" helper={helper} error={error}>
        <div className="flex flex-col gap-2">
          {value ? (
            <a
              href={value}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 rounded-lg border border-hairline-strong bg-elevated px-2.5 py-2 font-mono text-xs hover:border-ink"
            >
              <FilePdf size={16} aria-hidden="true" className="shrink-0 text-ink-soft" />
              <span className="truncate">{name}</span>
            </a>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>
              {value ? "Replace" : "Choose file"}
            </Button>
            {value ? (
              <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Field>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        mode="single"
        accept={accept}
        title={label}
        onPick={(picks) => {
          const pick = picks[0];
          if (pick) onChange(pick.asset.url);
        }}
      />
    </div>
  );
}
