"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";

type SlugFieldProps = {
  value: string;
  onChange: (raw: string) => void;
  onRegenerate: () => void;
  touched: boolean;
  error?: string | null;
  /** The public path in front of the slug, such as "/blog/". */
  prefix: string;
};

export function SlugField({ value, onChange, onRegenerate, touched, error, prefix }: SlugFieldProps) {
  return (
    <div data-field="slug">
      <Field
        label="Slug"
        required
        helper={touched ? "Edited by hand. Clear it to follow the title again." : "Follows the title until you edit it."}
        error={error}
      >
        <div className="flex items-stretch">
          <span className="flex items-center border border-r-0 border-hairline-strong bg-surface px-2.5 font-mono text-xs text-ink-soft">
            {prefix}
          </span>
          <Input mono value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" />
          {touched ? (
            <Tooltip label="Regenerate from the title">
              <Button variant="ghost" icon aria-label="Regenerate slug from the title" className="ml-1" onClick={onRegenerate}>
                <ArrowCounterClockwise size={15} aria-hidden="true" />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      </Field>
    </div>
  );
}
