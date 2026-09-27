import Link from "next/link";
import { cn } from "@/lib/cn";

type WordmarkProps = { href?: string; className?: string };

/** "DT / Admin": the initials, then what this app is. */
export function Wordmark({ href = "/", className }: WordmarkProps) {
  return (
    <Link href={href} className={cn("inline-flex items-baseline gap-2 font-heading text-base leading-none", className)}>
      <span>DT</span>
      <span className="text-hairline-strong" aria-hidden="true">
        /
      </span>
      <span className="font-sans text-[0.8125rem] font-medium text-ink-soft">Admin</span>
    </Link>
  );
}
