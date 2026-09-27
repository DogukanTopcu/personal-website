"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, label, description, disabled, className }: CheckboxProps) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-hairline-strong bg-elevated",
          "data-[state=checked]:border-ink",
          "data-[state=checked]:bg-ink data-[state=checked]:text-paper",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={12} weight="bold" aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={id} className={cn("select-none text-[0.8125rem] leading-5", disabled && "opacity-60")}>
        <span className="font-medium text-ink">{label}</span>
        {description ? <span className="block text-xs text-ink-soft">{description}</span> : null}
      </label>
    </div>
  );
}
