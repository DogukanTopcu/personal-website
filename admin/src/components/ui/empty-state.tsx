import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  /** One honest line saying what will go here. */
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** A drafted frame with one line and, when useful, the way to fill it. */
export function EmptyState({ children, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "dashed-frame flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-[0.8125rem] text-ink-soft",
        className,
      )}
    >
      <p>{children}</p>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
