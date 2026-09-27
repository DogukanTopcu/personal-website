"use client";

import { X } from "@phosphor-icons/react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Offered as autocomplete suggestions. */
  suggestions?: string[];
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  disabled?: boolean;
  /** Keep the case as typed (authors) instead of trimming only. */
  className?: string;
};

/**
 * An ordered list of short strings. Enter or a comma adds, Backspace on an
 * empty input removes the last one. Entries are plain mono text in a box.
 */
export function TagInput({ value, onChange, placeholder, suggestions, disabled, className, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function commit(raw: string) {
    const entries = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry) => !value.includes(entry));
    if (entries.length > 0) onChange([...value, ...entries]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      if (draft.trim()) {
        event.preventDefault();
        commit(draft);
      } else if (event.key === ",") {
        event.preventDefault();
      }
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "control flex h-auto min-h-9 flex-wrap items-center gap-1.5 py-1 focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
        disabled && "opacity-55",
        className,
      )}
      aria-invalid={aria["aria-invalid"]}
    >
      {value.map((entry, index) => (
        <span
          key={`${entry}-${index}`}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-hairline-strong bg-surface pl-1.5 font-mono text-xs"
        >
          {entry}
          <button
            type="button"
            className="flex h-full w-5 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-40"
            aria-label={`Remove ${entry}`}
            disabled={disabled}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X size={11} aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={aria.id}
        aria-describedby={aria["aria-describedby"]}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
        value={draft}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        list={suggestions?.length ? listId : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
      />
      {suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
