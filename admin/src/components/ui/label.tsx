import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type LabelProps = ComponentProps<"label"> & { required?: boolean };

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label className={cn("block text-[0.8125rem] font-medium leading-5 text-ink", className)} {...props}>
      {children}
      {required ? (
        <span className="ml-1 text-ink-soft" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
