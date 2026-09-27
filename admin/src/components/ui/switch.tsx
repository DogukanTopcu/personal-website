"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Switch({ checked, onCheckedChange, label, description, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className={cn("select-none text-[0.8125rem] leading-5", disabled && "opacity-60")}>
        <span className="font-medium text-ink">{label}</span>
        {description ? <span className="block text-xs text-ink-soft">{description}</span> : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full border border-transparent bg-hairline-strong transition-colors duration-150",
          "data-[state=checked]:bg-ink",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block h-4 w-4 translate-x-px rounded-full bg-ink-soft transition duration-150 ease-ink",
            "data-[state=checked]:translate-x-[17px] data-[state=checked]:bg-elevated",
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
