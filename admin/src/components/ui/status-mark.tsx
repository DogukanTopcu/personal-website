import { cn } from "@/lib/cn";
import { isFuture } from "@/lib/format";
import { LABELS, type ContentStatus } from "@/lib/types";

type StatusMarkProps = {
  status: ContentStatus;
  publishedAt?: string | null;
  className?: string;
};

/** Plain text with a small square marker. Published with a future date reads "Scheduled". */
export function StatusMark({ status, publishedAt, className }: StatusMarkProps) {
  const scheduled = status === "published" && isFuture(publishedAt);
  const label = scheduled ? "Scheduled" : LABELS.status[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[0.8125rem]", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "block h-2 w-2 rounded-full",
          scheduled && "bg-accent",
          !scheduled && status === "published" && "bg-success",
          status === "draft" && "border border-ink-soft",
          status === "archived" && "bg-hairline-strong",
        )}
      />
      {label}
    </span>
  );
}
